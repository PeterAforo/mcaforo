import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@mcaforo.com',
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('Email would be sent:', mailOptions)
    return { messageId: 'dev-message-id' }
  }

  return transporter.sendMail(mailOptions)
}

export function getNewsletterConfirmationEmail(confirmUrl: string) {
  return {
    subject: 'Confirm your newsletter subscription - McAforo',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0f172a; margin: 0;">McAforo</h1>
          </div>
          
          <h2 style="color: #0f172a;">Confirm your subscription</h2>
          
          <p>Thank you for subscribing to our newsletter! Please click the button below to confirm your subscription.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              Confirm Subscription
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            If you didn't subscribe to our newsletter, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} McAforo. All rights reserved.
          </p>
        </body>
      </html>
    `,
  }
}

export function getNewsletterWelcomeEmail(unsubscribeUrl: string) {
  return {
    subject: 'Welcome to the McAforo Newsletter!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0f172a; margin: 0;">McAforo</h1>
          </div>
          
          <h2 style="color: #0f172a;">Welcome aboard! 🎉</h2>
          
          <p>Your subscription has been confirmed. You'll now receive our latest insights, tips, and updates on technology and business.</p>
          
          <h3 style="color: #0f172a;">What to expect:</h3>
          <ul>
            <li>Industry insights and trends</li>
            <li>Tips for digital transformation</li>
            <li>Case studies and success stories</li>
            <li>Exclusive offers and updates</li>
          </ul>
          
          <p>We typically send 1-2 emails per month, so we won't overwhelm your inbox.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} McAforo. All rights reserved.<br>
            <a href="${unsubscribeUrl}" style="color: #999;">Unsubscribe</a>
          </p>
        </body>
      </html>
    `,
  }
}

export function getUnsubscribeConfirmationEmail() {
  return {
    subject: 'You have been unsubscribed - McAforo',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0f172a; margin: 0;">McAforo</h1>
          </div>
          
          <h2 style="color: #0f172a;">You've been unsubscribed</h2>
          
          <p>We're sorry to see you go! You have been successfully unsubscribed from our newsletter.</p>
          
          <p>If you change your mind, you can always subscribe again on our website.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} McAforo. All rights reserved.
          </p>
        </body>
      </html>
    `,
  }
}
