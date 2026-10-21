import 'dotenv/config';
import nodemailer from 'nodemailer';

export const createTransporter = () => {
    const host = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
    const port = parseInt(process.env.BREVO_SMTP_PORT || '587', 10);
    const user = process.env.BREVO_SMTP_USER;
    const pass = process.env.BREVO_SMTP_KEY;

    if (!user || !pass || user.includes('your_brevo') || pass.includes('your_brevo')) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
            user,
            pass
        }
    });
};

export const sendOtpEmail = async (toEmail, otpCode, purpose = 'Verification Code') => {
    const transporter = createTransporter();
    const fromName = process.env.BREVO_FROM_NAME || 'Archon Nell Industrial';
    const fromEmail = process.env.BREVO_FROM_EMAIL || 'kentfloyd02@gmail.com';

    if (!transporter) {
        console.log(`[Brevo SMTP Simulation] (${purpose}) OTP for ${toEmail}: ${otpCode}`);
        return {
            sent: false,
            simulated: true,
            message: 'Brevo SMTP credentials not set in .env. Code generated in simulation mode.'
        };
    }

    const isPasswordReset = purpose.toLowerCase().includes('password') || purpose.toLowerCase().includes('reset');
    const isLogin = purpose.toLowerCase().includes('login');
    const actionText = isPasswordReset 
      ? 'Use the 6-digit verification code below to authorize your password reset request.' 
      : isLogin 
      ? 'Use the 6-digit verification code below to complete your secure Two-Factor Authentication (2FA) login.'
      : 'Use the 6-digit verification code below to authorize your procurement checkout or account action.';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .header { background: #0b1b3d; padding: 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0; font-size: 12px; color: #94a3b8; }
        .body { padding: 32px 28px; text-align: center; }
        .code-box { background: #f8fafc; border: 2px dashed #3b82f6; border-radius: 12px; padding: 18px; margin: 24px 0; }
        .code { font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1d4ed8; }
        .note { font-size: 12px; color: #64748b; line-height: 1.6; margin-top: 16px; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>ARCHON NELL</h1>
          <p>Construction Chemicals & Engineering Solutions</p>
        </div>
        <div class="body">
          <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 12px;">${purpose}</h2>
          <p style="font-size: 14px; color: #334155; margin: 0;">${actionText}</p>
          
          <div class="code-box">
            <span class="code">${otpCode}</span>
          </div>

          <p class="note">
            This verification code is valid for <strong>5 minutes</strong>. If you did not initiate this request, please change your credentials immediately or contact support.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Archon Nell Inc. Cainta, Rizal / Metro Manila Site.
        </div>
      </div>
    </body>
    </html>
  `;

    const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: toEmail,
        subject: `${otpCode} - Archon Nell ${purpose}`,
        html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    return {
        sent: true,
        messageId: info.messageId
    };
};
