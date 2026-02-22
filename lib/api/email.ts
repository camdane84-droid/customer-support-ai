import sgMail from '@sendgrid/mail';
import { logger } from '@/lib/logger';

export async function sendEmail(params: {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
}) {
  // Set API key before each send to ensure it's properly initialized
  // This is important in serverless environments where env vars may not be available at module load time
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY environment variable is not set');
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  try {
    await sgMail.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html || params.text,
    });

    logger.success('Email sent successfully', { to: params.to });
    return { success: true };
  } catch (error: any) {
    const sgErrors = error?.response?.body?.errors;
    const errorDetail = sgErrors?.[0]?.message || error.message || 'Unknown SendGrid error';
    logger.error('SendGrid error', error, {
      to: params.to,
      from: params.from,
      responseBody: error?.response?.body
    });
    throw new Error(`Failed to send email: ${errorDetail}`);
  }
}
