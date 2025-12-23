# InboxForge - AI-Powered Customer Support Platform

InboxForge is a comprehensive customer support platform that centralizes conversations from multiple channels (Instagram, Email, SMS) into a single unified inbox, powered by AI to help businesses respond faster and more effectively.

## Features

- 🤖 **AI-Powered Responses** - Get intelligent response suggestions using Claude AI
- 📱 **Multi-Channel Support** - Instagram DMs, Email, SMS (coming soon)
- 💬 **Unified Inbox** - Manage all customer conversations in one place
- 📊 **Analytics Dashboard** - Track response times, conversation volume, and performance
- 🧠 **Knowledge Base** - Store FAQs and canned responses for quick replies
- 🎨 **Dark Mode** - Full dark mode support throughout the application
- 🔄 **Real-time Updates** - Live conversation updates via Supabase Realtime
- 👤 **Customer Profiles** - AI-generated customer insights and preferences

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Anthropic Claude
- **Email**: SendGrid
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Prerequisites

Before you begin, ensure you have:

- Node.js 20+ installed
- A Supabase account and project
- A Meta Developer account (for Instagram integration)
- A SendGrid account (for email integration)
- An Anthropic API key (for AI features)

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd customer-support-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the `env.example.txt` file and rename it to `.env.local`:

```bash
cp env.example.txt .env.local
```

Then fill in your actual values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Meta/Facebook/Instagram Integration
NEXT_PUBLIC_META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret

# SendGrid Email Integration
SENDGRID_API_KEY=your_sendgrid_api_key

# Anthropic AI Integration
ANTHROPIC_API_KEY=your_anthropic_api_key

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Support Contact
NEXT_PUBLIC_SUPPORT_EMAIL=support@yourdomain.com
NEXT_PUBLIC_COMPANY_NAME=Your Company Name
```

### 4. Set Up Supabase Database

Run the SQL migrations in your Supabase project to create the necessary tables:

- `businesses` - Store business account information
- `conversations` - Store customer conversations
- `messages` - Store individual messages
- `social_connections` - Store OAuth tokens for Instagram/Facebook
- `knowledge_base` - Store FAQs and canned responses

### 5. Configure Meta App for Instagram

1. Create a Meta App at [developers.facebook.com](https://developers.facebook.com)
2. Add Instagram Basic Display and Instagram Messaging products
3. Configure OAuth redirect URI: `https://yourdomain.com/api/auth/instagram/callback`
4. Add required permissions: `instagram_basic`, `instagram_manage_messages`, `pages_messaging`

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

For HTTPS (required for Instagram webhooks in development):

```bash
npm run dev
# This runs both Next.js and a local SSL proxy on port 3001
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Authentication pages
│   └── ...
├── components/            # React components
│   ├── inbox/            # Inbox-related components
│   ├── layout/           # Layout components
│   └── ui/               # Reusable UI components
├── lib/                   # Utility functions and API clients
│   ├── api/              # API client functions
│   ├── context/          # React context providers
│   └── utils/            # Helper functions
└── public/               # Static assets
```

## Key Features Explained

### AI Response Suggestions

The AI analyzes conversation history and your business policies to generate contextual response suggestions. Enable "AI Customer Insights" in Settings to automatically generate customer profiles and conversation notes.

### Instagram Integration

Connect your Instagram Business account to receive and respond to DMs directly in InboxForge. The integration uses Meta's Graph API and requires:
- A Facebook Page connected to your Instagram Business account
- Proper permissions granted during OAuth flow
- Webhook configuration for real-time message delivery

### Real-time Updates

Conversations update in real-time using Supabase Realtime subscriptions. New messages appear instantly without refreshing the page.

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add all environment variables from `.env.local`
4. Deploy!

```bash
npm run build
npm run start
```

### Environment Variables for Production

Make sure to update:
- `NEXT_PUBLIC_APP_URL` to your production domain
- Configure Meta App redirect URI to use your production domain
- Set up proper CORS and security headers

## Scripts

- `npm run dev` - Start development server with HTTPS proxy
- `npm run dev:http` - Start development server (HTTP only)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Support

For questions or issues, please contact us at the email specified in your environment variables or visit our [Contact Page](/contact).

## License

[Your License Here]

## Contributing

[Your contribution guidelines here]

---

Built with ❤️ using Next.js, Supabase, and Claude AI
