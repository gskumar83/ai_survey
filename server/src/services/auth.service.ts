import prisma from '../prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokens } from '../utils/jwt';
import crypto from 'crypto';
import { sendEmployeeCredentials, sendPasswordResetEmail } from './email.service';


export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.statusCode = statusCode;
  }
}

// ─── Helper: generate structured Admin ID with "VCS" prefix ───────────────────
// Pattern: VCS_ADM_<NAME_PREFIX>_<SEQ>
// e.g. Bharathi S -> VCS_ADM_BHA_001
export const buildAdminCode = async (name: string, email: string): Promise<string> => {
  const cleanName = (name || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
  const cleanEmail = (email || '').split('@')[0].replace(/[^a-zA-Z]/g, '').toUpperCase();
  const namePrefix = (cleanName.slice(0, 3) || cleanEmail.slice(0, 3) || 'ADM').padEnd(3, 'X');
  const prefix = `VCS_ADM_${namePrefix}_`;

  const existingCount = await prisma.admins.count({

    where: { admin_code: { startsWith: prefix } },
  });

  let seqNum = existingCount + 1;
  let code = `${prefix}${String(seqNum).padStart(3, '0')}`;

  // Ensure unique code
  while (await prisma.admins.findFirst({ where: { admin_code: code } })) {
    seqNum++;
    code = `${prefix}${String(seqNum).padStart(3, '0')}`;
  }

  return code;
};

export const ensureSuperAdmin = async () => {
  const envEmail = (process.env.SUPER_ADMIN_EMAIL || process.env.AUTHORIZED_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const envPassword = (process.env.SUPER_ADMIN_PASSWORD || process.env.AUTHORIZED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '').trim();
  const envName = (process.env.SUPER_ADMIN_NAME || process.env.AUTHORIZED_ADMIN_NAME || process.env.ADMIN_NAME || 'Administrator').trim();

  if (!envEmail || !envPassword) {
    return null;
  }

  try {
    let admin = await prisma.admins.findFirst({
      where: { email: { equals: envEmail, mode: 'insensitive' } },
    });

    const password_hash = await hashPassword(envPassword);
    const now = new Date();

    if (admin) {
      admin = await prisma.admins.update({
        where: { id: admin.id },
        data: {
          name: envName || admin.name,
          ...(admin.password_hash ? {} : { password_hash }),
          is_activated: true,
          activated_at: admin.activated_at || now,
        },
      });
      console.log(`🛡️ Super Admin synchronized: ${admin.email} (${admin.admin_code})`);
    } else {
      const admin_code = await buildAdminCode(envName, envEmail);
      admin = await prisma.admins.create({
        data: {
          admin_code,
          name: envName,
          email: envEmail,
          password_hash,
          is_activated: true,
          activated_at: now,
        },
      });
      console.log(`🛡️ Super Admin created: ${admin.email} (${admin.admin_code})`);
    }

    // Company creator relationships are strictly preserved. Zero automatic reassignments.
    
    return admin;
  } catch (err) {
    console.warn('Notice: Could not synchronize super admin:', err);
    return null;
  }
};

export const getAdminActivationStatus = async () => {
  const adminCount = await prisma.admins.count();
  return {
    isActivated: adminCount > 0,
    hasAdmins: adminCount > 0,
  };
};

export const registerAdmin = async (data: any) => {
  const { name, email, password } = data;
  const inputEmail = (email || '').trim().toLowerCase();
  const inputName = (name || '').trim() || 'Administrator';
  const inputPassword = password || '';

  if (!inputEmail || !inputPassword) {
    throw new AuthError('Email and password are required for admin registration.', 400);
  }

  const existing = await prisma.admins.findFirst({
    where: { email: { equals: inputEmail, mode: 'insensitive' } },
  });

  if (existing) {
    throw new AuthError('An administrator account with this email already exists. Please sign in.', 409);
  }

  const admin_code = await buildAdminCode(inputName, inputEmail);
  const password_hash = await hashPassword(inputPassword);
  const now = new Date();

  const admin = await prisma.admins.create({
    data: {
      admin_code,
      name: inputName,
      email: inputEmail,
      password_hash,
      is_activated: true,
      activated_at: now,
    },
  });

  // Note: New admin is created without touching existing company creator relationships.
  const tokens = generateTokens({
    id: admin.id,
    role: 'admin',
    adminRole: (admin.role as any) || 'org_admin',
    companyId: admin.company_id,
  });

  return {
    tokens,
    admin: {
      id: admin.id,
      admin_code: admin.admin_code,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      company_id: admin.company_id,
      is_activated: true,
    },
    isActivated: true,
    message: 'Admin account created successfully.',
  };
};

export const loginAdmin = async (data: any) => {
  const { email, identifier, password } = data;
  const inputIdentifier = (identifier || email || '').trim();
  const inputPassword = password || '';

  if (!inputIdentifier || !inputPassword) {
    throw new AuthError('Email/Admin ID and password are required.', 400);
  }

  // 1. Query DB for existing admin by Email OR Admin ID (admin_code)
  let admin = await prisma.admins.findFirst({
    where: {
      OR: [
        { email: { equals: inputIdentifier, mode: 'insensitive' } },
        { admin_code: { equals: inputIdentifier, mode: 'insensitive' } },
      ],
    },
    include: { company: { select: { id: true, name: true } } },
  });

  // If not found, check if it matches configured super admin in environment variables
  if (!admin) {
    const envEmail = (process.env.SUPER_ADMIN_EMAIL || process.env.AUTHORIZED_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    if (envEmail && inputIdentifier.toLowerCase() === envEmail) {
      await ensureSuperAdmin();
      admin = await prisma.admins.findFirst({
        where: { email: { equals: inputIdentifier, mode: 'insensitive' } },
        include: { company: { select: { id: true, name: true } } },
      });
    }
  }

  if (!admin) {
    const totalAdmins = await prisma.admins.count();
    if (totalAdmins === 0) {
      throw new AuthError('No admin account registered yet. Please create an admin account first.', 404);
    }
    throw new AuthError('Invalid credentials. Please check your Email/Admin ID and password.', 401);
  }

  // 2. Verify password
  let isValid = await comparePassword(inputPassword, admin.password_hash);
  if (!isValid) {
    // If password mismatch, check if environment password was updated
    const envPassword = (process.env.SUPER_ADMIN_PASSWORD || process.env.AUTHORIZED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '').trim();
    const envEmail = (process.env.SUPER_ADMIN_EMAIL || process.env.AUTHORIZED_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    if (envEmail && admin.email.toLowerCase() === envEmail && inputPassword === envPassword) {
      const newHash = await hashPassword(inputPassword);
      admin = await prisma.admins.update({
        where: { id: admin.id },
        data: { password_hash: newHash },
        include: { company: { select: { id: true, name: true } } },
      });
      isValid = true;
    }
  }
  if (!isValid) {
    throw new AuthError('Invalid Email/Admin ID or password.', 401);
  }

  // Ensure admin_code and is_activated are set
  let updatedFields: any = {};
  if (!admin.is_activated) {
    updatedFields.is_activated = true;
    updatedFields.activated_at = new Date();
  }
  if (!admin.admin_code) {
    updatedFields.admin_code = await buildAdminCode(admin.name, admin.email);
  }

  if (Object.keys(updatedFields).length > 0) {
    admin = await prisma.admins.update({
      where: { id: admin.id },
      data: updatedFields,
      include: { company: { select: { id: true, name: true } } },
    });
  }

  // Determine role
  const envEmail = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  const isSuperAdmin = admin.role === 'super_admin' || (envEmail && admin.email.toLowerCase() === envEmail);
  const effectiveRole: 'super_admin' | 'org_admin' = isSuperAdmin ? 'super_admin' : 'org_admin';

  const tokens = generateTokens({
    id: admin.id,
    role: 'admin',
    adminRole: effectiveRole,
    companyId: isSuperAdmin ? null : admin.company_id,
  });

  return {
    tokens,
    admin: {
      id: admin.id,
      admin_code: admin.admin_code,
      email: admin.email,
      name: admin.name,
      role: effectiveRole,
      company_id: admin.company_id,
      company_name: admin.company?.name || null,
      is_activated: admin.is_activated,
      isSuperAdmin,
    },
    isActivated: true,
    message: 'Signed in successfully.',
  };
};

export const resetAdminPassword = async (data: any) => {
  const { identifier, email, newPassword, password } = data;
  const inputIdentifier = (identifier || email || '').trim();
  const inputPassword = newPassword || password || '';

  if (!inputIdentifier || !inputPassword) {
    throw new AuthError('Administrator Email or Admin ID and new password are required.', 400);
  }

  if (inputPassword.length < 8) {
    throw new AuthError('Password must be at least 8 characters long.', 400);
  }

  let admin = await prisma.admins.findFirst({
    where: {
      OR: [
        { email: { equals: inputIdentifier, mode: 'insensitive' } },
        { admin_code: { equals: inputIdentifier, mode: 'insensitive' } },
      ],
    },
    include: { company: { select: { id: true, name: true } } },
  });

  if (!admin) {
    throw new AuthError('No administrator account found with that Email or Admin ID.', 404);
  }

  const password_hash = await hashPassword(inputPassword);
  admin = await prisma.admins.update({
    where: { id: admin.id },
    data: {
      password_hash,
      is_activated: true,
      activated_at: new Date(),
    },
    include: { company: { select: { id: true, name: true } } },
  });

  const envEmail = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  const isSuperAdmin = admin.role === 'super_admin' || (envEmail && admin.email.toLowerCase() === envEmail);
  const effectiveRole: 'super_admin' | 'org_admin' = isSuperAdmin ? 'super_admin' : 'org_admin';

  const tokens = generateTokens({
    id: admin.id,
    role: 'admin',
    adminRole: effectiveRole,
    companyId: isSuperAdmin ? null : admin.company_id,
  });

  return {
    tokens,
    admin: {
      id: admin.id,
      admin_code: admin.admin_code,
      email: admin.email,
      name: admin.name,
      role: effectiveRole,
      company_id: admin.company_id,
      company_name: admin.company?.name || null,
      is_activated: true,
      isSuperAdmin,
    },
    isActivated: true,
    message: 'Admin password updated successfully. Signed in.',
  };
};


export const getAllAdmins = async () => {
  return prisma.admins.findMany({
    select: {
      id: true,
      admin_code: true,
      name: true,
      email: true,
      is_activated: true,
      created_at: true,
    },
    orderBy: { created_at: 'desc' },
  });
};

export const createAdminByAdmin = async (data: any) => {
  const { name, email, password } = data;
  const inputEmail = (email || '').trim().toLowerCase();
  const inputName = (name || '').trim() || 'Administrator';
  const inputPassword = password || '';

  if (!inputEmail || !inputPassword) {
    throw new AuthError('Email and password are required.', 400);
  }

  const existing = await prisma.admins.findFirst({
    where: { email: { equals: inputEmail, mode: 'insensitive' } },
  });

  if (existing) {
    throw new AuthError('An administrator with this email already exists.', 409);
  }

  const admin_code = await buildAdminCode(inputName, inputEmail);
  const password_hash = await hashPassword(inputPassword);

  const newAdmin = await prisma.admins.create({
    data: {
      admin_code,
      name: inputName,
      email: inputEmail,
      password_hash,
      is_activated: true,
      activated_at: new Date(),
    },
    select: {
      id: true,
      admin_code: true,
      name: true,
      email: true,
      is_activated: true,
      created_at: true,
    },
  });

  return newAdmin;
};

export const deleteAdminByAdmin = async (adminIdToDelete: string, requestingAdminId: string) => {
  if (adminIdToDelete === requestingAdminId) {
    throw new AuthError('You cannot delete or revoke access for your own logged-in administrator account.', 400);
  }

  const admin = await prisma.admins.findUnique({
    where: { id: adminIdToDelete },
  });

  if (!admin) {
    throw new AuthError('Administrator not found.', 404);
  }

  // Safety check: Prevent deleting the Super Admin
  const envEmail = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  if (admin.role === 'super_admin' || (envEmail && admin.email.toLowerCase() === envEmail)) {
    throw new AuthError('The Super Admin account cannot be deleted or revoked.', 403);
  }
  // Company creator relationships are strictly preserved. Zero company reassignments.

  await prisma.admins.delete({
    where: { id: adminIdToDelete },
  });

  return { message: 'Administrator account deleted and access revoked successfully.' };
};

// ─── Helper: generate smart employee code ────────────────────────────────────
// Pattern: <COMPANY_ABBR>_<DEPT_ABBR>_<SEQ>
// e.g. Infosys + Testing → INF_TES_001
const buildEmployeeCode = async (companyName: string, department: string): Promise<string> => {
  // Take first 3 letters of company and department, uppercase
  const compAbbr = companyName.replace(/\s+/g, '').slice(0, 3).toUpperCase();
  const deptAbbr = department.replace(/\s+/g, '').slice(0, 3).toUpperCase();
  const prefix = `${compAbbr}_${deptAbbr}_`;

  // Count existing employees whose code starts with this prefix
  const existing = await prisma.employees.count({
    where: { employee_code: { startsWith: prefix } },
  });

  const seq = String(existing + 1).padStart(3, '0'); // 001, 002 …
  return `${prefix}${seq}`;
};

export const registerEmployee = async (data: any) => {
  let { name, companyId, companyName, otherCompany, department, otherDepartment, email, password, phone } = data;

  // Resolve custom department if "Other" was selected
  if (department && department.toLowerCase() === 'other' && otherDepartment && otherDepartment.trim()) {
    department = otherDepartment.trim();
  } else if (department && department.trim()) {
    department = department.trim();
  }

  // Resolve custom company if "Other" was selected
  const customCompany = (companyName || otherCompany || '').trim();
  if ((!companyId || companyId.toLowerCase() === 'other' || !/^[0-9a-fA-F]{24}$/.test(companyId)) && customCompany) {
    let company = await prisma.companies.findFirst({
      where: { name: { equals: customCompany, mode: 'insensitive' } },
    });

    if (!company) {
      let admin = await prisma.admins.findFirst({ where: { is_activated: true } });
      if (!admin) {
        admin = await prisma.admins.findFirst();
      }
      if (!admin) {
        const secureRandomPass = crypto.randomBytes(24).toString('hex');
        const password_hash = await hashPassword(secureRandomPass);
        admin = await prisma.admins.create({
          data: {
            name: 'Primary Administrator',
            email: `admin_${crypto.randomBytes(4).toString('hex')}@system.internal`,
            password_hash,
            is_activated: true,
            admin_code: 'VCS_ADM_001',
          },
        });
      }
      company = await prisma.companies.create({
        data: {
          name: customCompany,
          created_by_admin_id: admin.id,
        },
      });
    }
    companyId = company.id;
  }

  // Verify companyId is a valid 24-character hexadecimal MongoDB ObjectId
  if (!companyId || typeof companyId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(companyId)) {
    throw new Error('Invalid Company ID format. Please select a valid company.');
  }

  // Verify company exists
  const company = await prisma.companies.findUnique({ where: { id: companyId } });
  if (!company) throw new Error('Company not found. Please select a valid company.');

  // Check email uniqueness
  const existingEmployee = await prisma.employees.findUnique({ where: { email } });
  if (existingEmployee) throw new Error('Email already in use');

  // Generate smart employee code
  const employeeCode = await buildEmployeeCode(company.name, department);

  // Hash the password the employee chose themselves
  const password_hash = await hashPassword(password);

  const employee = await prisma.employees.create({
    data: {
      employee_code: employeeCode,
      name,
      email,
      phone: phone || null,
      department,
      password_hash,
      company_id: companyId,
      is_first_login: false, // They set their own password, no reset needed
    },
  });

  // Auto-assign any active/open survey cycles for this company to the new employee
  try {
    const openCycles = await prisma.survey_cycles.findMany({
      where: { company_id: companyId, status: 'open' },
      select: { id: true },
    });
    if (openCycles.length > 0) {
      await prisma.survey_assignments.createMany({
        data: openCycles.map(c => ({
          survey_cycle_id: c.id,
          employee_id: employee.id,
          status: 'assigned' as const,
        })),
      });
    }
  } catch (assignErr) {
    console.warn('Notice: Could not auto-assign open cycles to new employee:', assignErr);
  }

  // Return the generated employee_code directly — shown on screen, no email needed
  return {
    id: employee.id,
    employee_code: employee.employee_code,
    name: employee.name,
    email: employee.email,
    department: employee.department,
  };
};

export const loginEmployee = async (data: any) => {
  const { employeeCode, identifier, email, companyName, password } = data;

  const cleanIdentifier = (employeeCode || identifier || email || '').trim();
  const cleanCompanyName = (companyName || '').trim();
  const cleanPassword = password || '';

  if (!cleanIdentifier || !cleanPassword) {
    throw new AuthError('Email or Employee ID and password are required.', 400);
  }

  // 1. Look up employee by employee_code OR email (case-insensitive) including company association
  const employee = await prisma.employees.findFirst({
    where: {
      OR: [
        { employee_code: { equals: cleanIdentifier, mode: 'insensitive' } },
        { email: { equals: cleanIdentifier, mode: 'insensitive' } },
      ],
    },
    include: {
      company: true,
    },
  });

  if (!employee) {
    throw new AuthError('Invalid credentials. Employee ID or Email not found.', 401);
  }

  // 2. Validate company association if companyName is provided
  if (cleanCompanyName) {
    if (!employee.company) {
      throw new AuthError('Employee is not associated with any active organization.', 401);
    }
    const registeredCompanyName = (employee.company.name || '').trim().toLowerCase();
    if (registeredCompanyName !== cleanCompanyName.toLowerCase()) {
      throw new AuthError('Invalid credentials or company association. The provided company does not match this Employee account.', 401);
    }
  }

  // 3. Verify password
  const isValid = await comparePassword(cleanPassword, employee.password_hash);
  if (!isValid) {
    throw new AuthError('Invalid credentials. Incorrect password.', 401);
  }
  if (employee.company && employee.company.status === 'Inactive') {
    throw new AuthError('Your organization account is currently inactive. Please contact your administrator.', 403);
  }

  // 4. Generate JWT tokens
  const tokens = generateTokens({ id: employee.id, role: 'employee' });

  return {
    ...tokens,
    mustResetPassword: employee.is_first_login,
    employee: {
      id: employee.id,
      employee_code: employee.employee_code,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      company: {
        id: employee.company.id,
        name: employee.company.name,
        logo_url: employee.company.logo_url,
        default_language: employee.company.default_language || 'en',
        supported_languages: (employee.company.supported_languages && employee.company.supported_languages.length > 0) ? employee.company.supported_languages : ['en'],
      },
    },
  };
};

export const resetEmployeePassword = async (employeeId: string, data: any) => {
  const { newPassword } = data;

  const password_hash = await hashPassword(newPassword);

  await prisma.employees.update({
    where: { id: employeeId },
    data: {
      password_hash,
      is_first_login: false,
    }
  });

  return { success: true };
};

export const sendEmployeePasswordResetLink = async (email: string) => {
  const inputEmail = (email || '').trim().toLowerCase();
  if (!inputEmail) return { success: false, message: 'Email is required' };

  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');

  // 1. Check in employees
  const employee = await prisma.employees.findFirst({
    where: { email: { equals: inputEmail, mode: 'insensitive' } },
  });

  if (employee) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.$runCommandRaw({
      update: 'employees',
      updates: [
        {
          q: { $or: [{ _id: { $oid: employee.id } }, { _id: employee.id }] },
          u: { $set: { reset_token_hash: tokenHash, reset_token_expires_at: { $date: expiresAt.toISOString() } } }
        }
      ]
    });

    const resetUrl = `${clientUrl}/employee/index.html?token=${token}`;
    await sendPasswordResetEmail(employee.email, employee.name, resetUrl);
    return { success: true, token, resetUrl, recipient: employee.email, role: 'employee' };
  }

  // 2. Check in admins
  const admin = await prisma.admins.findFirst({
    where: { email: { equals: inputEmail, mode: 'insensitive' } },
  });

  if (admin) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.$runCommandRaw({
      update: 'admins',
      updates: [
        {
          q: { $or: [{ _id: { $oid: admin.id } }, { _id: admin.id }] },
          u: { $set: { reset_token_hash: tokenHash, reset_token_expires_at: { $date: expiresAt.toISOString() } } }
        }
      ]
    });

    const resetUrl = `${clientUrl}/employee/index.html?token=${token}`;
    await sendPasswordResetEmail(admin.email, admin.name, resetUrl);
    return { success: true, token, resetUrl, recipient: admin.email, role: 'admin' };
  }

  return { success: false, message: 'Account not found' };
};

export const resetEmployeePasswordWithToken = async (token: string, newPassword: string) => {
  if (!token || !newPassword) {
    throw new AuthError('Token and new password are required', 400);
  }

  if (newPassword.length < 8) {
    throw new AuthError('Password must be at least 8 characters long', 400);
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // 1. Try finding in employees
  let rawResult: any = await prisma.$runCommandRaw({
    find: 'employees',
    filter: {
      reset_token_hash: tokenHash
    },
    limit: 1
  });

  let employees = rawResult?.cursor?.firstBatch || [];
  if (employees.length > 0) {
    const user = employees[0];
    const rawExp = user.reset_token_expires_at;
    const expiresAt = rawExp?.$date ? new Date(rawExp.$date) : new Date(rawExp);

    if (isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
      throw new AuthError('Password reset link has expired. Please request a new one.', 400);
    }

    const employeeId = user._id?.$oid || String(user._id);
    const newPasswordHash = await hashPassword(newPassword);

    await prisma.$runCommandRaw({
      update: 'employees',
      updates: [
        {
          q: { $or: [{ _id: { $oid: employeeId } }, { _id: employeeId }] },
          u: {
            $set: { password_hash: newPasswordHash, is_first_login: false },
            $unset: { reset_token_hash: "", reset_token_expires_at: "" }
          }
        }
      ]
    });
    return { success: true, message: 'Password reset successfully' };
  }

  // 2. Try finding in admins
  rawResult = await prisma.$runCommandRaw({
    find: 'admins',
    filter: {
      reset_token_hash: tokenHash
    },
    limit: 1
  });

  let adminList = rawResult?.cursor?.firstBatch || [];
  if (adminList.length > 0) {
    const user = adminList[0];
    const rawExp = user.reset_token_expires_at;
    const expiresAt = rawExp?.$date ? new Date(rawExp.$date) : new Date(rawExp);

    if (isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
      throw new AuthError('Password reset link has expired. Please request a new one.', 400);
    }

    const adminId = user._id?.$oid || String(user._id);
    const newPasswordHash = await hashPassword(newPassword);

    await prisma.$runCommandRaw({
      update: 'admins',
      updates: [
        {
          q: { $or: [{ _id: { $oid: adminId } }, { _id: adminId }] },
          u: {
            $set: { password_hash: newPasswordHash, is_activated: true },
            $unset: { reset_token_hash: "", reset_token_expires_at: "" }
          }
        }
      ]
    });
    return { success: true, message: 'Password reset successfully' };
  }

  throw new AuthError('Invalid or expired reset token', 400);
};

// ─── Organization Admin Invitation & Activation (Single-Use, 24h Expiry) ───────
export const generateAdminInvitation = async (companyId: string, email: string, name: string, baseUrl?: string) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (name || '').trim() || 'Administrator';
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new AuthError('Valid administrator email address is required', 400);
  }
  if (!companyId || !/^[0-9a-fA-F]{24}$/.test(companyId)) {
    throw new AuthError('Valid target company ID is required', 400);
  }

  const company = await prisma.companies.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new AuthError('Target organization not found', 404);
  }

  // Generate cryptographically secure 32-byte token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  let admin = await prisma.admins.findFirst({
    where: { email: { equals: cleanEmail, mode: 'insensitive' } },
  });

  if (admin) {
    // Cannot reassign Super Admin
    const envEmail = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
    if (admin.role === 'super_admin' || (envEmail && admin.email.toLowerCase() === envEmail)) {
      throw new AuthError('The Super Admin account cannot be assigned to an individual organization', 400);
    }

    // Update existing admin with new invitation & company assignment
    admin = await prisma.admins.update({
      where: { id: admin.id },
      data: {
        name: cleanName || admin.name,
        company_id: companyId,
        role: 'org_admin',
        is_activated: false,
        activation_token_hash: tokenHash,
        activation_token_expires_at: expiresAt,
      },
    });
  } else {
    const admin_code = await buildAdminCode(cleanName, cleanEmail);
    const dummyHash = await hashPassword(crypto.randomBytes(16).toString('hex'));
    admin = await prisma.admins.create({
      data: {
        admin_code,
        name: cleanName,
        email: cleanEmail,
        password_hash: dummyHash,
        role: 'org_admin',
        company_id: companyId,
        is_activated: false,
        activation_token_hash: tokenHash,
        activation_token_expires_at: expiresAt,
      },
    });
  }

  // Build invitation link using URL fragment (#invite=...)
  const base = (process.env.APP_URL || process.env.CLIENT_URL || baseUrl || 'http://localhost:5173').replace(/\/+$/, '');
  const invitationUrl = `${base}/admin/visteria-admin-panel.html#invite=${rawToken}&email=${encodeURIComponent(cleanEmail)}`;

  return {
    success: true,
    admin: {
      id: admin.id,
      admin_code: admin.admin_code,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      company_id: admin.company_id,
    },
    company: { id: company.id, name: company.name },
    invitationUrl,
    expiresAt: expiresAt.toISOString(),
  };
};

export const verifyAdminInvitation = async (rawToken: string, email: string) => {
  if (!rawToken || !email) {
    throw new AuthError('Invitation token and email are required', 400);
  }
  const cleanEmail = email.trim().toLowerCase();
  const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

  const admin = await prisma.admins.findFirst({
    where: { email: { equals: cleanEmail, mode: 'insensitive' } },
    include: { company: { select: { id: true, name: true, logo_url: true } } },
  });

  if (!admin || !admin.activation_token_hash || admin.activation_token_hash !== tokenHash) {
    throw new AuthError('Invalid or expired invitation link. Please request a new invitation from Super Admin.', 400);
  }

  if (!admin.activation_token_expires_at || new Date(admin.activation_token_expires_at) < new Date()) {
    throw new AuthError('Invitation link has expired (24h limit). Please request a new invitation from Super Admin.', 400);
  }

  return {
    valid: true,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      admin_code: admin.admin_code,
      company: admin.company,
    },
  };
};

export const activateAdminAccount = async (data: { token: string; email: string; password: string }) => {
  const { token, email, password } = data;
  if (!token || !email || !password) {
    throw new AuthError('Token, email, and new password are required', 400);
  }
  if (password.length < 8) {
    throw new AuthError('Password must be at least 8 characters long', 400);
  }

  const verified = await verifyAdminInvitation(token, email);
  const newHash = await hashPassword(password);

  const updatedAdmin = await prisma.admins.update({
    where: { id: verified.admin.id },
    data: {
      password_hash: newHash,
      is_activated: true,
      activated_at: new Date(),
      activation_token_hash: null,
      activation_token_expires_at: null,
    },
    include: { company: { select: { id: true, name: true } } },
  });

  const tokens = generateTokens({
    id: updatedAdmin.id,
    role: 'admin',
    adminRole: updatedAdmin.role as any,
    companyId: updatedAdmin.company_id,
  });

  return {
    success: true,
    message: 'Account activated successfully. Welcome to Visteria.',
    tokens,
    admin: {
      id: updatedAdmin.id,
      admin_code: updatedAdmin.admin_code,
      email: updatedAdmin.email,
      name: updatedAdmin.name,
      role: updatedAdmin.role,
      company_id: updatedAdmin.company_id,
      company_name: updatedAdmin.company?.name || null,
      is_activated: true,
    },
  };
};
