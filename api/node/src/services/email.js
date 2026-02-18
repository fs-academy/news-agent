/**
 * Email service for sending transactional emails
 * Uses Nodemailer with configurable transport (SMTP, SendGrid, etc.)
 */

import nodemailer from 'nodemailer';
import { config } from '../config.js';

// Create transporter based on configuration
let transporter;
let isEthereal = false;

/**
 * Initialize email transporter
 * In development, uses Ethereal (fake SMTP) for testing
 * In production, uses configured SMTP settings
 */
async function initializeTransporter() {
  if (transporter) return transporter;

  if (config.nodeEnv === 'development' && !config.email?.smtp?.host) {
    // Use Ethereal for development testing (fake SMTP service)
    console.log('📧 Creating Ethereal test account for email testing...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      isEthereal = true;
      console.log('📧 Email service using Ethereal (development mode)');
      console.log('   Test account:', testAccount.user);
      console.log('   View sent emails at: https://ethereal.email/login');
      console.log('   Username:', testAccount.user);
      console.log('   Password:', testAccount.pass);
      return transporter;
    } catch (err) {
      console.error('❌ Failed to create Ethereal test account:', err.message);
      throw err;
    }
  }

  // Production configuration
  transporter = nodemailer.createTransport({
    host: config.email?.smtp?.host || 'smtp.gmail.com',
    port: config.email?.smtp?.port || 587,
    secure: config.email?.smtp?.secure || false,
    auth: {
      user: config.email?.smtp?.user || process.env.SMTP_USER,
      pass: config.email?.smtp?.pass || process.env.SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Send password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetToken - Password reset token
 * @param {string} userName - User's name for personalization
 * @returns {Promise<{success: boolean, messageId?: string, previewUrl?: string}>}
 */
export async function sendPasswordResetEmail(to, resetToken, userName = 'User') {
  try {
    const transport = await initializeTransporter();
    
    const frontendUrl = config.oauth?.frontendUrl || '';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: config.email?.from || '"NewsAgent" <noreply@newsagent.com>',
      to,
      subject: 'Reset Your NewsAgent Password',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background-color: #1a56db; border-radius: 12px 12px 0 0;">
                      <table role="presentation" style="border-collapse: collapse;">
                        <tr>
                          <td style="vertical-align: middle; padding-right: 12px;">
                            <div style="width: 40px; height: 40px; background-color: rgba(255,255,255,0.2); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                              </svg>
                            </div>
                          </td>
                          <td style="vertical-align: middle;">
                            <span style="color: #ffffff; font-size: 24px; font-weight: 600;">NewsAgent</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">
                      <h1 style="margin: 0 0 20px; color: #0d0f1c; font-size: 24px; font-weight: 700;">Reset Your Password</h1>
                      
                      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Hi ${userName},
                      </p>
                      
                      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        We received a request to reset your password for your NewsAgent account. Click the button below to create a new password:
                      </p>
                      
                      <!-- CTA Button -->
                      <table role="presentation" style="border-collapse: collapse; margin: 30px 0;">
                        <tr>
                          <td style="border-radius: 8px; background-color: #1a56db;">
                            <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 16px 32px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        This link will expire in <strong>1 hour</strong> for security reasons.
                      </p>
                      
                      <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                      </p>
                      
                      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                      
                      <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="margin: 10px 0 0; color: #1a56db; font-size: 12px; line-height: 1.6; word-break: break-all;">
                        ${resetUrl}
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px 40px; text-align: center;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        © 2026 NewsAgent Inc. All rights reserved.
                      </p>
                      <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px;">
                        Your AI-powered news intelligence platform.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
        Reset Your NewsAgent Password
        
        Hi ${userName},
        
        We received a request to reset your password for your NewsAgent account.
        
        Click the link below to create a new password:
        ${resetUrl}
        
        This link will expire in 1 hour for security reasons.
        
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        
        © 2026 NewsAgent Inc. All rights reserved.
      `,
    };

    const info = await transport.sendMail(mailOptions);
    
    // In development with Ethereal, log the preview URL for testing
    let previewUrl = null;
    if (isEthereal || config.nodeEnv === 'development') {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('📧 PASSWORD RESET EMAIL SENT (Development Mode)');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('   To:', to);
      console.log('   Message ID:', info.messageId);
      if (previewUrl) {
        console.log('');
        console.log('   👉 VIEW EMAIL HERE:', previewUrl);
        console.log('');
      }
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('');
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('❌ FAILED TO SEND PASSWORD RESET EMAIL');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('   Error:', error.message);
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('');
    return {
      success: false,
      error: error.message,
    };
  }
}

export default {
  sendPasswordResetEmail,
};
