# Meta App Review Setup Guide

## Adding Test Users for Demo

1. Go to https://developers.facebook.com/apps/YOUR_APP_ID/roles/test-users/
2. Click "Add Test Users" or use existing Instagram test account
3. Or add real Instagram accounts as "Testers":
   - Go to Roles → Roles
   - Add people by Facebook/Instagram account
   - Give them "Tester" role

## Test Users Can:
- ✅ Send messages to your business Instagram in dev mode
- ✅ RECEIVE messages from your business in dev mode
- ✅ Be used in your demo video

## Creating the Demo Video

### What to Show:

1. **Login Flow** (30 seconds)
   - Show business logging into your dashboard
   - Show Instagram OAuth connection working

2. **Receiving Messages** (30 seconds)
   - Have test user send Instagram DM to business
   - Show message appearing in your dashboard in real-time
   - Show conversation details (customer name, timestamp, etc.)

3. **Sending Replies** (1 minute)
   - Type a reply in your dashboard
   - Click send
   - Show the message status changing from "sending" to "sent"
   - **Switch to the test Instagram account**
   - Show the reply appearing in Instagram DM
   - Optional: Show the AI suggestion feature

4. **Additional Features** (30 seconds - optional)
   - Show conversation list
   - Show message retry if it failed
   - Show conversation management

### Recording Tips:

- Use Loom or OBS - keep it under 3 minutes
- Narrate what you're doing: "Here I'm connecting the Instagram account..."
- Show your mouse cursor
- Make sure UI is clear and readable
- No need to be perfect - they just want to see it works

## Alternative: Screenshots with Descriptions

If video is difficult, you can provide:

1. Screenshot: Login page
2. Screenshot: Instagram OAuth consent screen
3. Screenshot: Dashboard with incoming message
4. Screenshot: Typing a reply
5. Screenshot: Message sent status
6. Screenshot: Instagram DM showing the reply arrived

Add descriptions under each screenshot explaining the step.

## What Meta Reviewers Check:

- ✅ Does the webhook receive Instagram messages?
- ✅ Can businesses send replies through the app?
- ✅ Are messages actually delivered to Instagram?
- ✅ Is the user experience clear and legitimate?
- ✅ Are you only using permissions for stated purpose?

## Common Approval Timeline:

- Submission → Review starts: 1-2 days
- Review duration: 3-7 days
- If rejected: You can resubmit with changes

## If Your Demo Shows Test Users:

**This is completely fine!** In your submission notes, write:

"This demo uses test users as the app is currently in development mode.
Once approved for production, the app will work with all Instagram users
who message the business first."
