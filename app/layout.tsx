import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { ThemeProvider } from "@/lib/context/ThemeContext";
import { Analytics } from "@vercel/analytics/react";
import "@/lib/env-validation"; // Validate environment variables at startup

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InboxForge - The AI Front Desk for Your Business Email",
  description: "Forward your business email to InboxForge. AI triages every message, alerts you to urgent issues, drafts on-brand replies, and answers customers after hours. Start your 14-day free trial today.",
  keywords: ["customer support", "AI support", "email triage", "customer service", "auto-reply", "email support", "unified inbox", "Claude AI"],
  authors: [{ name: "InboxForge" }],
  icons: {
    icon: '/favicon.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: "InboxForge - The AI Front Desk for Your Business Email",
    description: "AI that triages every customer email, flags what's urgent, and answers after hours",
    type: "website",
    siteName: "InboxForge",
  },
  twitter: {
    card: "summary_large_image",
    title: "InboxForge - The AI Front Desk for Your Business Email",
    description: "AI that triages every customer email, flags what's urgent, and answers after hours",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
