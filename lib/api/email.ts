import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(params: {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
}) {
  try {
    await sgMail.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html || params.text,
    });

    console.log('✅ Email sent to:', params.to);
    return { success: true };
  } catch (error: any) {
    console.error('❌ SendGrid error:', error?.response?.body || error);
    throw new Error('Failed to send email');
  }
}
