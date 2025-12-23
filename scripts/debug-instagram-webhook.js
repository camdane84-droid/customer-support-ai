// Debug script to check webhook events
console.log('🔍 Instagram Webhook Debugging\n');
console.log('This will help us understand what webhooks you\'re receiving.\n');
console.log('═══════════════════════════════════════\n');

console.log('📋 Instructions:');
console.log('1. Keep your dev server running (npm run dev)');
console.log('2. Make sure ngrok is running and webhook is configured');
console.log('3. Send a test message FROM your Instagram mobile app');
console.log('4. Watch your server console logs for:\n');

console.log('✅ What you SHOULD see when you send via Instagram:');
console.log(`
📨 Instagram webhook received: {...}
📦 Full webhook event: {...}
💬 New message from [YOUR_ID] to [CUSTOMER_ID]: [your message]
📍 Checking message direction... (has is_echo flag: true/false)
📍 Message type: ECHO (sent by business)
   Business account: [YOUR_ID]
   Customer account: [CUSTOMER_ID]
✓ Found business connection for @your_username
📤 Echo message - using existing customer from conversation
📝 Updated conversation (echo): [conversation_id]
✅ Echo message saved to database (message you sent through Instagram)
`);

console.log('\n❌ If you DON\'T see these logs:');
console.log('   → Instagram is NOT sending webhook for your outgoing messages');
console.log('   → This means we need to check webhook subscription\n');

console.log('🔧 Quick Webhook Check:\n');
console.log('1. Go to: https://developers.facebook.com/apps/2123260635151224/webhooks/');
console.log('2. Look for your Instagram webhook subscription');
console.log('3. Check that "messages" is subscribed');
console.log('4. Click "Test" button to see sample webhook');
console.log('\n═══════════════════════════════════════\n');

console.log('💡 Common Issues:\n');
console.log('Issue 1: No webhook received at all');
console.log('  → Check ngrok is running');
console.log('  → Check webhook URL is correct in Meta dashboard');
console.log('  → Check messages field is subscribed\n');

console.log('Issue 2: Webhook received but message not saved');
console.log('  → Check server logs for errors');
console.log('  → Look for "❌" symbols in logs');
console.log('  → Message type should show "ECHO"\n');

console.log('Issue 3: Saved but not appearing in UI');
console.log('  → Refresh your browser');
console.log('  → Check database directly');
console.log('  → Wait 1 second (new refresh rate)\n');

console.log('📝 Next Step:');
console.log('   Send a message via Instagram NOW and paste the server logs here.\n');
