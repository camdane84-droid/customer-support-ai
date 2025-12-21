# Testing Instagram Messaging Flow with Test User

## Prerequisites:
- ✅ Test user added to Meta app and accepted invitation
- ✅ Test user's Instagram account is linked to their Facebook account
- ✅ Your ngrok tunnel is running (or production URL)
- ✅ Webhook is subscribed to your Instagram account

## Test Steps:

### 1. Verify Test User Has Access
- Go to: https://developers.facebook.com/apps/2123260635151224/roles/roles/
- Confirm test user shows "Active" status

### 2. Send Test Message (From Test User's Instagram)
- Open Instagram app/website
- Log in as the test user
- Search for your business Instagram account
- Send a Direct Message: "Hi, this is a test message!"

### 3. Verify Message Received
- Check your app's console/logs for webhook event
- Check your dashboard - message should appear
- Check database:
  ```sql
  SELECT * FROM messages ORDER BY created_at DESC LIMIT 5;
  SELECT * FROM conversations ORDER BY last_message_at DESC LIMIT 5;
  ```

### 4. Send Reply (From Your Dashboard)
- Open your dashboard
- Find the conversation
- Type a reply: "Thanks for your message! This is an automated test reply."
- Click Send
- Check console for API response

### 5. Verify Reply Delivered
- Switch to test user's Instagram
- Check the DM thread
- **The reply should appear!** 🎉

### 6. If Reply Doesn't Appear:

Check these common issues:

1. **Access token expired?**
   ```bash
   # Test your access token
   curl "https://graph.facebook.com/v21.0/me?access_token=YOUR_TOKEN"
   ```

2. **Wrong Instagram account ID?**
   - Check social_connections table
   - Verify platform_user_id matches your business IG account

3. **Test user not properly linked?**
   - Test user's Facebook must be linked to their Instagram
   - Check in Facebook Settings → Instagram

4. **Webhook not receiving?**
   - Test webhook: https://developers.facebook.com/apps/2123260635151224/webhooks/
   - Send test event

## Expected API Response:

When sending a message, you should see:
```json
{
  "recipient_id": "CUSTOMER_INSTAGRAM_ID",
  "message_id": "mid.XXXXX"
}
```

If you see this, the message was sent successfully!
