# Landing Page Hero Demo - How It Works

The animated "video" on the landing page (`app/page.tsx`) is **not a video file**. It's a fully coded, interactive mockup built with JSX and pure CSS animations. This means it's zero-bandwidth, theme-aware (switches between light/dark mode live), and fully responsive.

## Architecture Overview

The demo lives entirely in two files:

| File | What it does |
|---|---|
| `app/page.tsx` (lines ~200-620) | JSX structure — the fake browser window with sidebar, chat messages, AI panel, and input area |
| `app/globals.css` (lines ~158-570) | CSS keyframe animations — typing effects, slide-ins, button clicks, timed delays |

## How the Animation Sequence Works

### 1. Trigger: Intersection Observer

An `IntersectionObserver` watches the hero container (`heroRef`). When the user scrolls it into view (10-20% visible depending on screen size), the class `hero-visible` is added to the container. All animations are scoped under `.hero-visible`, so nothing plays until it's on screen. If the user scrolls away, the class is removed and animations pause.

**Code:** `app/page.tsx` lines 63-100

### 2. Layout: Fake Browser Window

The mockup is a flexbox layout mimicking the real InboxForge dashboard:

```
+-------------------+-------------------------------+
|  Left Sidebar     |  Main Chat Area               |
|  (conversation    |  - Chat header (@sarahcoffee) |
|   list with 6     |  - Message bubbles            |
|   contacts)       |  - AI suggestion panel        |
|                   |  - Chat input bar             |
+-------------------+-------------------------------+
```

- **Left sidebar:** 6 fake conversations (Instagram, WhatsApp, TikTok, Email) with avatar initials, platform icons, and preview text
- **Main area:** An active conversation with @sarahcoffee about decaf coffee

### 3. Animation Timeline

Everything is orchestrated via CSS `animation-delay` values. Here's the full sequence:

| Time | What Happens | CSS Class |
|---|---|---|
| 0.2s | Sidebar conversations slide in | `animation-delay-sidebar` |
| 1.0s | Customer message types out: *"Hi! Do you have any decaf coffee options?"* | `animation-delay-600` |
| 1.6s | Chat header slides in | `animation-delay-200/400/800` |
| 3.0s | Reply types out: *"Yes! We have 3 delicious decaf options..."* | `animation-delay-1000` |
| 5.0s | Customer asks: *"Perfect! Which one is most popular?"* | `animation-delay-1400` |
| 7.0s | "Generate AI Response" button slides in | `animation-delay-1500` |
| 8.0s | Button animates a click (scales down then back) | `animation-delay-1800` |
| 8.5s | AI Suggestion Panel pops up with suggested response | `animation-delay-2000` |
| 10.0s | "Use This Response" button animates a click | `animation-delay-2400` |
| 10.5s | AI-assisted reply appears (no typing effect, instant) | `animation-delay-2600` |
| 12.0s | Customer: *"Awesome! I'll order that one. Thanks so much!"* | `animation-delay-3200` |
| 14.0s | Support reply: *"You're so welcome! Enjoy your coffee..."* | `animation-delay-3800` |
| 16.0s | Customer: *"One more thing - do you offer subscriptions?"* | `animation-delay-4200` |
| 18.0s | Support reply: *"Absolutely! We have monthly subscriptions..."* | `animation-delay-4600` |

### 4. Key CSS Animations

#### Typing Effect (`typing-then-wrap`)
Text starts at `width: 0` with `overflow: hidden` and `white-space: nowrap`, then expands to full width using `steps(60, end)` for a typewriter look. At 100% it switches to `white-space: normal` so long text wraps properly.

#### Slide Up + Fade In (`slide-up-fade-in`)
Messages start 10px below their final position at 0 opacity, then slide up and fade in over 0.6s.

#### Button Click + Fade (`button-click-fade`)
Scales to 0.95 (pressed effect), bounces back to 1.0, then fades to 0 opacity — simulating a user clicking a button that then disappears.

#### AI Panel (`animate-ai-panel`)
The AI suggestion panel slides in, stays visible for a set duration, then fades out after the "Use This Response" button is "clicked."

### 5. Theme Awareness

Every element checks `currentTheme` (from `useTheme()`) and applies conditional classes:

```tsx
currentTheme === 'dark'
  ? 'bg-[#1a2332] border-slate-700'   // Dark mode
  : 'bg-white border-gray-200'         // Light mode
```

The demo automatically matches whatever theme the user has selected — no separate assets needed.

### 6. Responsive Design

The mockup uses Tailwind responsive prefixes throughout:

- **Mobile:** Sidebar collapses to icon-only (avatar initials), smaller text, tighter padding
- **Tablet (`sm:`):** Some labels appear, aspect ratio shifts from 3/4 to 4/3
- **Desktop (`md:`):** Full sidebar with names/previews, aspect ratio becomes 16/9 (`aspect-video`)

## How to Modify the Demo

### Change the conversation content
Edit the message text in `app/page.tsx` inside the `<span className="typing-text">` elements (lines ~407-557).

### Adjust animation timing
Edit the `animation-delay` values in `app/globals.css` (lines ~314-460). The delays under `.hero-visible` control when each element appears. Keep them in ascending order to maintain the conversation flow.

### Add a new message
1. Copy an existing message block (customer or support) in `page.tsx`
2. Give it a new `animation-delay-XXXX` class
3. Add the corresponding `.hero-visible .animation-delay-XXXX` rule in `globals.css` with your desired delay
4. Add a `.hero-visible .animation-delay-XXXX .typing-text` rule if you want the typing effect

### Change the scenario
The current demo shows a coffee shop customer asking about decaf. To change the scenario, update:
- Conversation list entries in the sidebar (names, platforms, preview text)
- Chat header (name, platform icon)
- All message bubble text
- AI suggestion panel content

## Why This Approach (Instead of a Video)

- **Zero file size** — no video/gif to download, loads instantly
- **Theme-aware** — matches light/dark mode in real-time
- **Responsive** — adapts to any screen size with CSS, not fixed pixels
- **Accessible** — real text that screen readers can parse
- **Easy to update** — change copy or timing without re-recording anything
- **Interactive** — animations trigger on scroll, pause when off-screen
