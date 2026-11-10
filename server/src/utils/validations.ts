import { z } from 'zod';

export const adminRegisterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const adminLoginSchema = z.object({
  email: z.string().optional(),
  identifier: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
}).refine(data => !!(data.email || data.identifier), {
  message: 'Admin email address or Admin ID is required',
  path: ['email'],
});

export const adminResetPasswordSchema = z.object({
  identifier: z.string().min(1, 'Email or Admin ID is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const employeeRegisterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  companyId: z.string().optional(),
  companyName: z.string().optional(),
  otherCompany: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  otherDepartment: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  agreedToTerms: z.boolean().optional(),
  consentVersion: z.string().optional(),
  consentedAt: z.string().optional(),
}).refine((data) => {
  if (data.companyId && /^[0-9a-fA-F]{24}$/.test(data.companyId) && data.companyId.toLowerCase() !== 'other') {
    return true;
  }
  const custom = (data.companyName || data.otherCompany || '').trim();
  return custom.length > 0;
}, {
  message: 'Invalid Company ID format. Must be a valid 24-character hexadecimal MongoDB ID',
  path: ['companyId'],
});

export const employeeLoginSchema = z.object({
  employeeCode: z.string().optional(),
  identifier: z.string().optional(),
  email: z.string().optional(),
  companyName: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
}).refine(data => !!(data.employeeCode || data.identifier || data.email), {
  message: 'Email or Employee ID is required',
  path: ['employeeCode'],
});

export const employeeResetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const branchSchema = z.object({
  address_line: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
});

const optionalEmail = z.string().optional().transform(v => {
  if (!v || !v.trim()) return undefined;
  return v.trim();
}).refine(v => !v || z.string().email().safeParse(v).success, {
  message: 'Invalid official company email address'
});

const optionalString = z.string().optional().transform(v => {
  if (v === undefined || v === null || !v.trim()) return undefined;
  return v.trim();
});

const booleanFlag = z.union([
  z.boolean(),
  z.string().transform(v => {
    const s = String(v).trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'yes';
  })
]).optional();

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').transform(v => v.trim()),
  company_code: z.string().optional().transform(v => (v && v.trim()) ? v.trim().toUpperCase() : undefined),
  official_email: optionalEmail,
  contact_number: optionalString,
  address: optionalString,
  industry: optionalString,
  website: optionalString,
  status: z.enum(['Active', 'Inactive']).optional().default('Active'),
  // branches could be a stringified JSON if sent via form-data or native array if sent via JSON
  branches: z.union([
    z.array(branchSchema),
    z.string().transform((val) => {
      if (!val) return [];
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }).pipe(z.array(branchSchema))
  ]).optional().default([]),
});

export const updateCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').optional().transform(v => v ? v.trim() : undefined),
  company_code: z.string().min(1, 'Company code cannot be empty').optional().transform(v => v ? v.trim() : undefined),
  official_email: optionalEmail,
  contact_number: optionalString,
  address: optionalString,
  industry: optionalString,
  website: optionalString,
  status: z.enum(['Active', 'Inactive']).optional(),
  removeLogo: booleanFlag,
  branches: z.union([
    z.array(branchSchema),
    z.string().transform((val) => {
      if (!val) return undefined;
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : undefined;
      } catch {
        return undefined;
      }
    }).pipe(z.array(branchSchema).optional())
  ]).optional(),
});

// --- Phase 3 Schemas ---

export const createQuestionSchema = z.object({
  company_id: z.string().min(1, 'Company ID is required'),
  question_text: z.string().min(1, 'Question text is required'),
  question_type: z.enum(['rating', 'single_choice', 'text']),
  options_json: z.any().optional(), // Can be an array of strings or objects, depending on type
});

export const updateQuestionSchema = z.object({
  question_text: z.string().min(1).optional(),
  question_type: z.enum(['rating', 'single_choice', 'text']).optional(),
  options_json: z.any().optional(),
});

export const surveyQuestionSchema = z.object({
  question_id: z.string().min(1),
  display_order: z.number().int().min(0),
});

export const createSurveySchema = z.object({
  company_id: z.string().min(1, 'Company ID is required'),
  title: z.string().min(1, 'Title is required'),
  is_enabled: z.boolean().optional(),
  questions: z.array(surveyQuestionSchema).optional(),
});

export const updateSurveySchema = z.object({
  title: z.string().min(1).optional(),
  is_enabled: z.boolean().optional(),
  questions: z.array(surveyQuestionSchema).optional(),
});

export const createSurveyCycleSchema = z.object({
  company_id: z.string().min(1, 'Company ID is required'),
  survey_id: z.string().min(1, 'Survey ID is required'),
  period_start: z.string().transform((str) => new Date(str)),
  period_end: z.string().transform((str) => new Date(str)),
  status: z.enum(['open', 'closed', 'analyzed', 'reported']).optional(),
});

export const updateSurveyCycleSchema = z.object({
  period_start: z.string().transform((str) => new Date(str)).optional(),
  period_end: z.string().transform((str) => new Date(str)).optional(),
  status: z.enum(['open', 'closed', 'analyzed', 'reported']).optional(),
});

// --- Phase 4 Schemas ---

export const createEmployeeSchema = z.object({
  company_id: z.string().min(1, 'Company ID is required'),
  employee_code: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  department: z.string().optional(),
  password: z.string().min(6).optional(),
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  company_id: z.string().optional(),
  employee_code: z.string().optional(),
});

// --- Phase 5 Schemas ---

export const responseAnswerSchema = z.object({
  question_id: z.string().min(1, 'Question ID is required'),
  answer_value: z.string().optional(),
});

export const submitResponseSchema = z.object({
  answers: z.array(responseAnswerSchema)
});

export const assistantChatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional(),
  context: z.any().optional()
});
