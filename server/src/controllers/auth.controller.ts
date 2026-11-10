import { Request, Response } from 'express';
import { adminRegisterSchema, adminLoginSchema, adminResetPasswordSchema, employeeRegisterSchema, employeeLoginSchema, employeeResetPasswordSchema } from '../utils/validations';
import * as authService from '../services/auth.service';
import { verifyRefreshToken, generateTokens } from '../utils/jwt';

// Admin and employee sessions get their own cookie names so that logging into
// one portal in a browser tab can never silently overwrite/hijack the other
// portal's session (they share the same origin, so a single cookie name would
// collide between the two).
const ADMIN_REFRESH_COOKIE = 'admin_refresh_token';
const EMPLOYEE_REFRESH_COOKIE = 'employee_refresh_token';

const setRefreshTokenCookie = (res: Response, cookieName: string, token: string) => {
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const adminRegister = async (req: Request, res: Response) => {
  try {
    const validatedData = adminRegisterSchema.parse(req.body);
    const result = await authService.registerAdmin(validatedData);

    setRefreshTokenCookie(res, ADMIN_REFRESH_COOKIE, result.tokens.refreshToken);
    res.status(201).json({
      accessToken: result.tokens.accessToken,
      isActivated: result.isActivated,
      message: result.message,
      admin: result.admin,
    });
  } catch (error: any) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message || 'Registration failed' });
  }
};

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const validatedData = adminLoginSchema.parse(req.body);
    const result = await authService.loginAdmin(validatedData);

    setRefreshTokenCookie(res, ADMIN_REFRESH_COOKIE, result.tokens.refreshToken);
    res.json({
      accessToken: result.tokens.accessToken,
      isActivated: result.isActivated,
      message: result.message,
      admin: result.admin,
    });
  } catch (error: any) {
    const status = error.statusCode || 401;
    res.status(status).json({ error: error.message || 'Login failed' });
  }
};

export const adminResetPassword = async (req: Request, res: Response) => {
  try {
    const validatedData = adminResetPasswordSchema.parse(req.body);
    const result = await authService.resetAdminPassword(validatedData);

    setRefreshTokenCookie(res, ADMIN_REFRESH_COOKIE, result.tokens.refreshToken);
    res.json({
      accessToken: result.tokens.accessToken,
      message: result.message,
      admin: result.admin,
    });
  } catch (error: any) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message || 'Password reset failed' });
  }
};

export const verifyAdminInvitation = async (req: Request, res: Response) => {
  try {
    const token = ((req.body?.token || req.query?.token || '') as string).trim();
    const email = ((req.body?.email || req.query?.email || '') as string).trim();
    const result = await authService.verifyAdminInvitation(token, email);
    res.json(result);
  } catch (error: any) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message || 'Invitation verification failed' });
  }
};

export const activateAdminAccount = async (req: Request, res: Response) => {
  try {
    const { token, email, password } = req.body || {};
    const result = await authService.activateAdminAccount({ token, email, password });
    setRefreshTokenCookie(res, ADMIN_REFRESH_COOKIE, result.tokens.refreshToken);
    res.json({
      accessToken: result.tokens.accessToken,
      message: result.message,
      admin: result.admin,
    });
  } catch (error: any) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message || 'Account activation failed' });
  }
};

export const getAdminStatus = async (_req: Request, res: Response) => {
  try {
    const status = await authService.getAdminActivationStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Could not fetch admin status' });
  }
};

export const employeeRegister = async (req: Request, res: Response) => {
  try {
    const validatedData = employeeRegisterSchema.parse(req.body);
    const employee = await authService.registerEmployee(validatedData);
    res.status(201).json({ message: 'Employee registered successfully', data: employee });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
};

export const employeeLogin = async (req: Request, res: Response) => {
  try {
    const validatedData = employeeLoginSchema.parse(req.body);
    const { accessToken, refreshToken, mustResetPassword, employee } = await authService.loginEmployee(validatedData);

    setRefreshTokenCookie(res, EMPLOYEE_REFRESH_COOKIE, refreshToken);
    res.json({ accessToken, mustResetPassword, employee });
  } catch (error: any) {
    const status = error.statusCode || 401;
    res.status(status).json({ error: error.message || 'Login failed' });
  }
};

export const employeeResetPassword = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const validatedData = employeeResetPasswordSchema.parse(req.body);
    await authService.resetEmployeePassword(req.user.id, validatedData);

    res.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Password reset failed' });
  }
};

const refreshFor = (cookieName: string, expectedRole: 'admin' | 'employee') =>
  async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies[cookieName];
      if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token provided' });
      }

      const payload = verifyRefreshToken(refreshToken);
      if (payload.role !== expectedRole) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }
      const tokens = generateTokens({ id: payload.id, role: payload.role });

      setRefreshTokenCookie(res, cookieName, tokens.refreshToken);
      res.json({ accessToken: tokens.accessToken });
    } catch (error) {
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  };

export const refreshAdmin = refreshFor(ADMIN_REFRESH_COOKIE, 'admin');
export const refreshEmployee = refreshFor(EMPLOYEE_REFRESH_COOKIE, 'employee');

export const logoutAdmin = async (_req: Request, res: Response) => {
  res.clearCookie(ADMIN_REFRESH_COOKIE);
  res.json({ message: 'Logged out successfully' });
};

export const logoutEmployee = async (_req: Request, res: Response) => {
  res.clearCookie(EMPLOYEE_REFRESH_COOKIE);
  res.json({ message: 'Logged out successfully' });
};

export const employeeForgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailConfigured = !!(process.env.SENDGRID_API_KEY || process.env.SMTP_HOST);
    const resetResult = await authService.sendEmployeePasswordResetLink(email);

    if (!emailConfigured) {
      return res.json({
        message: 'Password reset request processed. Outbound email service (SENDGRID_API_KEY / SMTP) is not configured in server/.env.',
        emailConfigured: false,
        token: process.env.NODE_ENV !== 'production' ? resetResult?.token : undefined,
        resetUrl: process.env.NODE_ENV !== 'production' ? resetResult?.resetUrl : undefined
      });
    }

    res.json({
      message: 'If an account matches that email address, password-reset instructions will be sent.',
      emailConfigured: true
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const employeeResetPasswordWithToken = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    await authService.resetEmployeePasswordWithToken(token, newPassword);
    res.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message || 'Password reset failed' });
  }
};
