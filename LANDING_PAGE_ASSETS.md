# Landing Page Assets Guide

This document outlines the image assets you should create and add to complete the InboxForge landing page.

## Required Assets

### 1. Dashboard Screenshot (Hero Section)
- **Location**: Replace the mockup in `app/page.tsx` lines ~117-170
- **Dimensions**: 1920x1080px (16:9 aspect ratio)
- **Format**: PNG or WebP
- **Path**: `/public/dashboard-hero.png`
- **Content**: Show the main inbox interface with conversations, AI suggestions, and clean UI

### 2. Feature Screenshots
These can be added to the Features section to show specific capabilities:
- **AI Suggestions Screenshot**: Show the AI-powered response feature
- **Unified Inbox Screenshot**: Display multiple channels in one view
- **Analytics Dashboard**: Show the reporting interface
- **Customer Profile**: Display the auto-generated customer insights

### 3. Open Graph Image (Social Sharing)
- **Location**: `public/og-image.png`
- **Dimensions**: 1200x630px
- **Format**: PNG
- **Content**:
  - InboxForge logo
  - Tagline: "All Your Customer Conversations. One Intelligent Inbox."
  - Clean purple gradient background
  - Optional: Small dashboard preview

### 4. Enhanced Logo/Icon
The current logo is a simple SVG. Consider creating:
- **High-res logo**: For various contexts
- **Logo variations**: Light/dark mode versions
- **Animated logo**: For loading states

## Brand Colors Reference

Primary Purple: `#8B5CF6` (oklch(0.64 0.238 293.498))
- Use for CTAs, accents, and brand elements
- Gradient variations available in globals.css

## Implementation Notes

### To add a real dashboard screenshot:
1. Take a high-quality screenshot of your dashboard
2. Save it to `/public/dashboard-hero.png`
3. Update `app/page.tsx` around line 117:
```tsx
<div className="mt-16 rounded-xl overflow-hidden shadow-2xl">
  <Image
    src="/dashboard-hero.png"
    alt="InboxForge Dashboard"
    width={1920}
    height={1080}
    className="w-full h-auto"
    priority
  />
</div>
```

### To add feature screenshots:
Add them inline with feature descriptions in the Features section for better visual storytelling.

## Additional Recommendations

1. **Video Demo**: Consider adding a product demo video in the hero section
2. **Customer Logos**: Add logos of businesses using InboxForge in the social proof section
3. **Icon Set**: Create custom icons for features instead of using Lucide icons
4. **Illustrations**: Add custom illustrations for the "How It Works" section
5. **Animations**: Consider adding subtle animations for interactive elements

## Tools for Creating Assets

- **Screenshots**: Use your actual product
- **Design**: Figma, Canva, or Adobe Illustrator
- **Image Optimization**: TinyPNG, Squoosh, or Next.js Image Optimization
- **Videos**: Loom, OBS Studio, or ScreenFlow

---

*Note: All current placeholders are production-ready and styled correctly. Simply replace them with real assets when available.*
