import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'no-reply@surveyai.local';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export const sendEmployeeCredentials = async (
  email: string,
  name: string,
  employeeCode: string,
  tempPassword: string
) => {
  const subject = 'Welcome to Survey AI - Your Login Credentials';
  const text = `Hi ${name},\n\nYou have been registered on Survey AI. Please use the following credentials to log in:\n\nEmployee Code: ${employeeCode}\nTemporary Password: ${tempPassword}\n\nYou will be required to change your password upon first login.\n\nRegards,\nThe Survey AI Team`;
  const html = `<p>Hi ${name},</p><p>You have been registered on Survey AI. Please use the following credentials to log in:</p><ul><li><strong>Employee Code:</strong> ${employeeCode}</li><li><strong>Temporary Password:</strong> ${tempPassword}</li></ul><p>You will be required to change your password upon first login.</p><p>Regards,<br/>The Survey AI Team</p>`;

  if (SENDGRID_API_KEY) {
    try {
      await sgMail.send({
        to: email,
        from: SENDGRID_FROM_EMAIL,
        subject,
        text,
        html,
      });
      console.log(`Email sent successfully to ${email}`);
    } catch (error) {
      console.error('Error sending email via SendGrid:', error);
      // Fallback to console for local dev if SendGrid fails
      console.log(`[Email Fallback] To: ${email}\nSubject: ${subject}\n\n${text}`);
    }
  } else {
    // If no API key, log to console for development
    console.log(`[Email Fallback - No SendGrid Key] To: ${email}\nSubject: ${subject}\n\n${text}`);
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetUrl: string
) => {
  const subject = 'Reset Your People First Organization AI Survey Password';
  const text = `Hi ${name},\n\nYou requested a password reset for your People First Organization AI Survey account.\n\nPlease click the link below to reset your password:\n\n${resetUrl}\n\nThis password reset link is valid for 10 minutes and can only be used once.\n\nIf you did not request this password reset, you can safely ignore this email.\n\nRegards,\nVisteria Consulting Services Private Limited\nPeople First Organization AI Survey Team`;
  const html = `<div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
    <h2 style="color: #0369a1; margin-top: 0;">People First Organization AI Survey</h2>
    <p>Hi ${name},</p>
    <p>You requested a password reset for your People First Organization AI Survey account.</p>
    <p style="margin: 24px 0;">
      <a href="${resetUrl}" style="background-color: #1769d5; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Your Password</a>
    </p>
    <p style="color: #64748b; font-size: 13px;">Or copy and paste this link into your browser:<br/><a href="${resetUrl}" style="color: #0284c7;">${resetUrl}</a></p>
    <p style="background: #f1f5f9; padding: 12px; border-left: 4px solid #0284c7; font-size: 13px; margin: 20px 0;">
      <strong>Note:</strong> This password reset link is valid for <strong>10 minutes</strong> and can only be used once.
    </p>
    <p style="color: #64748b; font-size: 13px;">If you did not request this password reset, you can safely ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
    <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
      <strong>Visteria Consulting Services Private Limited</strong><br/>
      Vision Changes Everything.
    </p>
  </div>`;

  if (SENDGRID_API_KEY) {
    try {
      await sgMail.send({
        to: email,
        from: SENDGRID_FROM_EMAIL,
        subject,
        text,
        html,
      });
      console.log(`Password reset email sent successfully to ${email}`);
    } catch (error) {
      console.error('Error sending reset email via SendGrid:', error);
      console.log(`[Email Fallback] To: ${email}\nSubject: ${subject}\n\n${text}`);
    }
  } else {
    console.log(`[Email Fallback - No SendGrid Key] To: ${email}\nSubject: ${subject}\n\n${text}`);
  }
};

export const sendNotificationEmail = async (
  email: string,
  subject: string,
  message: string
): Promise<boolean> => {
  const text = `${message}\n\nRegards,\nVisteria Consulting Services Private Limited`;
  const html = `<div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
    <h2 style="color: #0369a1; margin-top: 0;">${subject}</h2>
    <p style="white-space: pre-line;">${message}</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
    <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
      <strong>Visteria Consulting Services Private Limited</strong>
    </p>
  </div>`;

  if (SENDGRID_API_KEY) {
    try {
      await sgMail.send({
        to: email,
        from: SENDGRID_FROM_EMAIL,
        subject,
        text,
        html,
      });
      return true;
    } catch (error) {
      console.error('Error sending notification email via SendGrid:', error);
      console.log(`[Email Fallback] To: ${email}\nSubject: ${subject}\n\n${text}`);
      return false;
    }
  } else {
    console.log(`[Email Fallback - No SendGrid Key] To: ${email}\nSubject: ${subject}\n\n${text}`);
    return false;
  }
};

export const emailService = {
  sendEmployeeCredentials,
  sendPasswordResetEmail,
  sendNotificationEmail,
};
