# SendGrid Email Setup Guide

## Overview
Team invitation emails are configured to send from: `noreply@inbox-forge.com`

## Setup Steps

### 1. Verify Sender Email in SendGrid

1. Go to [SendGrid Dashboard](https://app.sendgrid.com/)
2. Navigate to **Settings** → **Sender Authentication**
3. Click **Verify a Single Sender**
4. Fill in the form:
   - **From Name**: InboxForge
   - **From Email Address**: noreply@inbox-forge.com
   - **Reply To**: (your support email, e.g., support@inbox-forge.com)
   - **Company Address**: (your business address)
   - **Nickname**: InboxForge Notifications
5. Click **Create**
6. Check your email (the one associated with the inbox-forge.com domain) for the verification email
7. Click the verification link

**Important**: You must have access to receive emails at `noreply@inbox-forge.com` to complete verification. If you don't own this domain or can't receive emails:
- Use a different email you control (e.g., `youremail@gmail.com`)
- Update `.env.local` with that email address
- Later, set up domain authentication for professional emails

### 2. Alternative: Domain Authentication (Recommended for Production)

For a more professional setup without needing to verify each sender:

1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Follow the DNS setup instructions for `inbox-forge.com`
4. Add the provided DNS records to your domain registrar
5. Once verified, you can send from any email address at your domain

### 3. Add Environment Variable to Vercel

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `SENDGRID_FROM_EMAIL`
   - **Value**: `noreply@inbox-forge.com` (or your verified email)
   - **Environment**: All (Production, Preview, Development)
5. Click **Save**
6. Redeploy your application for changes to take effect

### 4. Local Development

The environment variable is already set in `.env.local`:
```
SENDGRID_FROM_EMAIL=noreply@inbox-forge.com
```

Restart your dev server to apply the change:
```bash
npm run dev
```

### 5. Test Email Sending

1. Go to your dashboard → Team Management
2. Click "Invite Team Member"
3. Enter an email address and select a role
4. Click "Create Invitation"
5. In the modal, click "Send Invitation via Email"
6. Check the recipient's inbox (and spam folder)

## Troubleshooting

### Email not sending
- Check SendGrid dashboard for error logs: **Activity** → **Email Activity**
- Verify sender email is verified in SendGrid
- Check that `SENDGRID_FROM_EMAIL` matches the verified email exactly
- Check Vercel logs for error messages

### "Failed to send email" error
- Verify SENDGRID_API_KEY is correct
- Check SendGrid account status (not suspended)
- Verify sender email is authenticated

### Email goes to spam
- Set up domain authentication (SPF, DKIM records)
- Add a custom domain in SendGrid
- Ensure email content isn't flagged by spam filters

## Email Template

The invitation email includes:
- Personalized greeting with business name
- Clear call-to-action button
- 7-day expiration notice
- Fallback link if button doesn't work

Template location: `app/api/team/invitations/route.ts` (PATCH endpoint)
