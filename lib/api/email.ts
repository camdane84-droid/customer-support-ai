import { Resend } from 'resend';
import { logger } from '@/lib/logger';

export async function sendEmail(params: {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html || params.text,
    });

    if (error) {
      throw error;
    }

    logger.success('Email sent successfully', { to: params.to, id: data?.id });
    return { success: true };
  } catch (error: any) {
    const errorDetail = error?.message || 'Unknown Resend error';
    logger.error('Resend error', error, {
      to: params.to,
      from: params.from,
    });
    throw new Error(`Failed to send email: ${errorDetail}`);
  }
}
