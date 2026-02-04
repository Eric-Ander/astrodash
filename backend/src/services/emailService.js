const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Check if SMTP settings are configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.warn('⚠️  Email notifications disabled: SMTP settings not configured');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    console.log('✅ Email service initialized');
  }

  isConfigured() {
    return this.transporter !== null;
  }

  async sendClearSkyNotification(userEmail, locationName, forecast) {
    if (!this.isConfigured()) {
      throw new Error('Email service not configured');
    }

    const subject = `🌟 Clear skies tonight at ${locationName}!`;
    
    const html = `
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
            <a href="${process.env.APP_URL || 'https://astroweather.tenpixel.ch'}" class="button">
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
          <p>To manage your notification settings, visit AstroWeather and go to Saved Locations.</p>
          <p style="margin-top: 20px;">
            <a href="${process.env.APP_URL || 'https://astroweather.tenpixel.ch'}" style="color: #3b82f6;">AstroWeather</a>
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Clear Skies Alert!
      
      Location: ${locationName}
      
      Tonight's Forecast:
      - Cloud Coverage: ${forecast.avgClouds}%
      - Visibility: ${forecast.avgVisibility} km
      - Best Time: ${forecast.bestTime}
      - Astronomy Score: ${forecast.score}/100
      
      Great conditions for stargazing tonight!
      
      View full forecast: ${process.env.APP_URL || 'https://astroweather.tenpixel.ch'}
    `;

    try {
      const info = await this.transporter.sendMail({
        from: `"AstroWeather" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: userEmail,
        subject: subject,
        text: text,
        html: html
      });

      console.log(`✅ Email sent to ${userEmail}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw error;
    }
  }

  async sendTestEmail(userEmail) {
    if (!this.isConfigured()) {
      throw new Error('Email service not configured');
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>🌟 AstroWeather Test Email</h2>
        <p>This is a test email from AstroWeather.</p>
        <p>If you received this, your email notifications are working correctly!</p>
        <p><a href="${process.env.APP_URL || 'https://astroweather.tenpixel.ch'}">Visit AstroWeather</a></p>
      </body>
      </html>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: `"AstroWeather" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: userEmail,
        subject: '🌟 AstroWeather Test Email',
        html: html
      });

      console.log(`✅ Test email sent to ${userEmail}`);
      return info;
    } catch (error) {
      console.error('❌ Failed to send test email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
