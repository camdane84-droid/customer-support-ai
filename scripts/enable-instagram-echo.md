# Enable Instagram Message Echoes

## What This Does
When you send a message directly through Instagram (not through your app), the webhook will receive an "echo" event and save it to your database. This makes testing much easier!

## Steps to Enable:

### 1. Go to Meta App Dashboard
Visit: https://developers.facebook.com/apps/2123260635151224/webhooks/

### 2. Find Your Instagram Webhook
Look for the webhook subscription for your Instagram integration

### 3. Edit Webhook Fields
Click "Edit" next to your webhook subscription

### 4. Subscribe to These Fields:
Make sure these are checked:
- ✅ `messages` (you already have this)
- ✅ `message_echoes` (ADD THIS - this is the important one!)
- ✅ `messaging_postbacks` (optional but useful)

### 5. Save Changes

## What Will Happen After:

When you send a message through Instagram directly:
1. ✅ Instagram sends webhook to your app with `is_echo: true`
2. ✅ Your app detects it's an echo message
3. ✅ Saves it as a business message (sender_type: 'business')
4. ✅ Shows up in your dashboard immediately
5. ✅ Marked as 'sent' status automatically

## Testing:

1. Have a customer (test user) message your business Instagram
2. Reply to them **directly through Instagram app** (not your dashboard)
3. Check your app dashboard - your reply should appear!
4. Check server logs for: "✅ Echo message saved to database"

## Logs to Watch For:

When you send via Instagram, you'll see:
```
📦 Full webhook event: {...}
💬 New message from [YOUR_ACCOUNT_ID] to [CUSTOMER_ID]: [message]
📍 Message type: ECHO (sent by business)
✓ Found business connection for @your_username
📤 Echo message - using existing customer from conversation
📝 Updated conversation (echo): [conversation_id]
✅ Echo message saved to database (message you sent through Instagram)
```

## Benefits:

- ✅ See full conversation history even if you reply via Instagram
- ✅ Test easier without needing to go through your app
- ✅ More accurate conversation tracking
- ✅ Better for transitioning between Instagram and your app
