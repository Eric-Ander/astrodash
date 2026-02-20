const nodemailer = require('nodemailer');
const { Resend } = require('resend');

class EmailService {
  constructor() {
    this.provider = null; // 'resend' or 'smtp'
    this.resend = null;
    this.transporter = null;
    this.fromEmail = null;
    this.initialize();
  }

  initialize() {
    // Try Resend first (recommended)
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      this.fromEmail = process.env.EMAIL_FROM || 'AstroDash <onboarding@resend.dev>';
      this.provider = 'resend';
      console.log('✅ Email service initialized (Resend)');
      return;
    }

    // Fall back to SMTP
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      this.fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
      this.provider = 'smtp';
      console.log('✅ Email service initialized (SMTP)');
      return;
    }

    console.warn('⚠️  Email notifications disabled: No email provider configured');
    console.warn('   Set RESEND_API_KEY for Resend, or SMTP_HOST/SMTP_USER for SMTP');
  }

  isConfigured() {
    return this.provider !== null;
  }

  getEmailTemplate(locationName, forecast) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #f8fafc;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .forecast-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
          }
          .metric {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .metric:last-child {
            border-bottom: none;
          }
          .metric-label {
            font-weight: 600;
            color: #64748b;
          }
          .metric-value {
            font-weight: 700;
            color: #1e293b;
          }
          .score {
            font-size: 2rem;
            font-weight: 900;
            color: #10b981;
            text-align: center;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #10b981);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #64748b;
            margin-top: 30px;
            font-size: 0.9rem;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✨ Clear Skies Alert! 🔭</h1>
          <p>Perfect conditions for stargazing tonight</p>
        </div>
        <div class="content">
          <h2>📍 ${locationName}</h2>
          <p>Great news! The forecast shows excellent conditions for astronomy tonight.</p>

          <div class="forecast-box">
            <h3>Tonight's Forecast</h3>
            <div class="metric">
              <span class="metric-label">Cloud Coverage</span>
              <span class="metric-value">${forecast.avgClouds}%</span>
            </div>
            <div class="metric">
              <span class="metric-label">Visibility</span>
              <span class="metric-value">${forecast.avgVisibility} km</span>
            </div>
            <div class="metric">
              <span class="metric-label">Best Time</span>
              <span class="metric-value">${forecast.bestTime}</span>
            </div>
            <div class="score">
              Astronomy Score: ${forecast.score}/100
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.APP_URL || 'https://astrodash.ch'}" class="button">
              View Full Forecast
            </a>
          </div>

          <p style="margin-top: 30px; color: #64748b; font-size: 0.9rem;">
            <strong>💡 Tip:</strong> Check the full forecast for moon phase, light pollution,
            and hourly details to plan your observing session.
          </p>
        </div>
        <div class="footer">
          <p>You received this email because you enabled notifications for ${locationName}.</p>
          <p>To manage your notification settings, visit AstroDash and go to Saved Locations.</p>
          <p style="margin-top: 20px;">
            <a href="${process.env.APP_URL || 'https://astrodash.ch'}" style="color: #3b82f6;">AstroDash</a>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  async sendClearSkyNotification(userEmail, locationName, forecast) {
    if (!this.isConfigured()) {
      throw new Error('Email service not configured');
    }

    const subject = `🌟 Clear skies tonight at ${locationName}!`;
    const html = this.getEmailTemplate(locationName, forecast);
    const text = `
Clear Skies Alert!

Location: ${locationName}

Tonight's Forecast:
- Cloud Coverage: ${forecast.avgClouds}%
- Visibility: ${forecast.avgVisibility} km
- Best Time: ${forecast.bestTime}
- Astronomy Score: ${forecast.score}/100

Great conditions for stargazing tonight!

View full forecast: ${process.env.APP_URL || 'https://astrodash.ch'}
    `.trim();

    try {
      if (this.provider === 'resend') {
        const { data, error } = await this.resend.emails.send({
          from: this.fromEmail,
          to: [userEmail],
          subject: subject,
          html: html,
          text: text
        });

        if (error) {
          throw new Error(error.message);
        }

        console.log(`✅ Email sent to ${userEmail} via Resend: ${data.id}`);
        return data;
      } else {
        const info = await this.transporter.sendMail({
          from: `"AstroDash" <${this.fromEmail}>`,
          to: userEmail,
          subject: subject,
          text: text,
          html: html
        });

        console.log(`✅ Email sent to ${userEmail} via SMTP: ${info.messageId}`);
        return info;
      }
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw error;
    }
  }

  async sendTestEmail(userEmail) {
    if (!this.isConfigured()) {
      throw new Error('Email service not configured. Please set RESEND_API_KEY or SMTP settings.');
    }

    const subject = '🌟 AstroDash Test Email';
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1>🌟 AstroDash Test Email</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 1.1rem;">This is a test email from AstroDash.</p>
          <p style="color: #10b981; font-weight: 600;">✅ If you received this, your email notifications are working correctly!</p>
          <p style="margin-top: 20px;">
            You will receive alerts when your saved locations have excellent conditions for stargazing.
          </p>
          <p style="margin-top: 30px;">
            <a href="${process.env.APP_URL || 'https://astrodash.ch'}"
               style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #10b981); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Visit AstroDash
            </a>
          </p>
        </div>
      </body>
      </html>
    `;

    try {
      if (this.provider === 'resend') {
        const { data, error } = await this.resend.emails.send({
          from: this.fromEmail,
          to: [userEmail],
          subject: subject,
          html: html
        });

        if (error) {
          throw new Error(error.message);
        }

        console.log(`✅ Test email sent to ${userEmail} via Resend: ${data.id}`);
        return data;
      } else {
        const info = await this.transporter.sendMail({
          from: `"AstroDash" <${this.fromEmail}>`,
          to: userEmail,
          subject: subject,
          html: html
        });

        console.log(`✅ Test email sent to ${userEmail} via SMTP: ${info.messageId}`);
        return info;
      }
    } catch (error) {
      console.error('❌ Failed to send test email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
