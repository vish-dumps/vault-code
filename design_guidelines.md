# CodeVault Design Guidelines

## Design Approach

**Reference-Based Strategy:** Drawing inspiration from VS Code (editor interface), Linear (minimal productivity UI), and LeetCode (problem-solving dashboard), creating a developer-focused, utility-first experience.

**Core Principles:**
- Code-first interface with developer ergonomics
- Minimal chrome, maximum content area
- Information density without clutter
- Consistent, predictable interactions

---

## Typography System

**Font Family:** 
- UI Text: Inter or system fonts (-apple-system, BlinkMacSystemFont)
- Code: JetBrains Mono or Fira Code (monospace with ligatures)

**Type Scale:**
- Display (Dashboard headers): text-3xl font-bold
- Section Headers: text-xl font-semibold
- Card Titles: text-base font-medium
- Body Text: text-sm font-normal
- Code: text-sm font-mono
- Captions/Meta: text-xs

**Hierarchy Rules:**
- Use font weight (medium/semibold/bold) for emphasis over size changes
- Maintain single-line headers where possible
- Code snippets always monospace with consistent sizing

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16
- Micro spacing (within components): p-2, gap-2, space-y-2
- Component padding: p-4, p-6
- Section spacing: py-8, py-12, gap-8
- Large gaps: py-16, gap-16

**Grid Structure:**
- Sidebar: Fixed width 16rem (w-64) on desktop, collapsible on mobile
- Main content: flex-1 with max-w-7xl container
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Question lists: Single column with full-width cards

**Container Strategy:**
- Global wrapper: min-h-screen flex
- Page containers: p-6 md:p-8 lg:p-12
- Card containers: p-4 md:p-6

---

## Navigation Structure

**Sidebar (Primary Navigation):**
- Fixed left sidebar (desktop), slide-over drawer (mobile)
- Height: Full viewport (h-screen)
- Width: w-64 with p-4 internal padding
- Nav items: Vertical stack with gap-1
- Icon + Label pattern for all items
- Active state: Distinct visual treatment
- Sections: Dashboard, Workspace, Question Vault, Contests, Profile

**Top Bar:**
- Sticky header (sticky top-0) with backdrop-blur
- Height: h-16
- Contains: Logo/brand (left), theme toggle, user menu (right)
- Mobile: Hamburger menu button (left), user actions (right)

---

## Component Library

### Dashboard Components

**Stats Cards:**
- Grid layout: 3 columns on desktop (grid-cols-1 md:grid-cols-3)
- Card structure: p-6, rounded-lg
- Content: Icon + Label (text-sm) + Value (text-3xl font-bold) + Trend indicator
- Size: Consistent height for alignment

**Progress Chart:**
- Container: col-span-full or 2/3 width
- Height: h-80
- Recharts with minimal styling
- Legend: Bottom placement

**Contest List:**
- Card-based layout with gap-4
- Each contest: Flex row with space-between
- Info: Platform badge + Contest name + Date/Time
- Compact sizing: py-3 px-4

**Quick Add Button:**
- Fixed position: bottom-8 right-8
- Size: w-14 h-14 rounded-full
- Icon: Plus symbol
- Floating with shadow-lg

### Question Vault Components

**Layout Split (Detail View):**
- Two-column: grid-cols-1 lg:grid-cols-2 with gap-6
- LEFT Panel (Question Details):
  - Width: Auto-fit content
  - Sections stacked vertically with gap-4
  - Title: text-2xl font-bold
  - Metadata grid: Tags, difficulty, platform badges
  - Notes: Prose formatting with max-w-prose
- RIGHT Panel (Code Editor):
  - Sticky positioning: sticky top-4
  - Monaco Editor container: min-h-96
  - Language selector: Top-right of editor
  - Multiple approaches: Tab interface above editor

**Question List (Vault Index):**
- Full-width cards in single column
- Each card: p-4, flex layout
- Left section: Title + metadata (tags, difficulty)
- Right section: Quick actions (edit, delete)
- Hover: Subtle elevation change

**Approach Toggle:**
- Tab-style interface above code editor
- Each tab: px-4 py-2, rounded-t
- Active tab: Distinct treatment
- Add approach: Button in tab row

### Workspace Components

**Code Editor:**
- Monaco Editor: Full-height container (min-h-screen minus header)
- Toolbar: Sticky top (h-12) with save, language selector, settings
- Footer: Status bar showing language, line count

**Snippet Manager:**
- Sidebar list (w-64) with snippets
- Main area: Editor (flex-1)
- Split view: Resizable panels

### Forms & Inputs

**Text Inputs:**
- Height: h-10
- Padding: px-3
- Border: border rounded-md
- Focus state: Ring treatment (ring-2)

**Textareas:**
- Min height: min-h-32
- Padding: p-3
- Resize: resize-y

**Buttons:**
- Primary: px-4 py-2 rounded-md font-medium
- Secondary: Similar sizing, different treatment
- Icon buttons: w-10 h-10 rounded-md
- Disabled: opacity-50 cursor-not-allowed

**Select/Dropdowns:**
- Height: h-10
- Consistent with text input styling
- Language selector: Prominent in editor toolbar

### Badges & Labels

**Difficulty Badges:**
- Size: px-2 py-1 rounded text-xs font-medium
- Easy, Medium, Hard variations

**Platform Badges:**
- Size: px-2 py-1 rounded-md text-xs
- Icons + text for LeetCode, Codeforces

**Topic Tags:**
- Chip style: px-3 py-1 rounded-full text-xs
- Removable in edit mode (X icon)

### Data Display

**Statistics:**
- Large numbers: text-4xl font-bold
- Labels: text-sm uppercase tracking-wide
- Trend indicators: Arrow icons + percentage

**Tables (if needed):**
- Minimal borders
- Striped rows: divide-y
- Sticky headers: sticky top-0

---

## Theme Toggle Implementation

**Toggle Control:**
- Location: Top-right of navbar
- Icon-based: Sun/Moon icons
- Size: w-10 h-10 interactive area
- Transition: All theme changes with transition-colors duration-200

**Theme Structure:**
- Default: Dark theme on load
- Classes: Use `dark:` prefix for all theme-dependent styles
- Persistence: Store preference in localStorage

---

## Responsive Breakpoints

- Mobile: Base styles (< 768px)
- Tablet: md: prefix (768px+)
- Desktop: lg: prefix (1024px+)
- Wide: xl: prefix (1280px+)

**Mobile Adaptations:**
- Sidebar: Drawer overlay, activated by hamburger
- Dashboard cards: Stack vertically
- Question vault split: Stack LEFT then RIGHT
- Editor: Full-width, collapsible panels

---

## Animations

**Minimal Motion:**
- Page transitions: None (instant)
- Hover states: transition-colors duration-150
- Dropdown/Modal: transition-opacity duration-200
- Loading spinners: Only for async operations
- NO scroll-triggered animations
- NO complex entrance animations

---

## Special Layouts

### Authentication Pages
- Centered card: max-w-md mx-auto mt-20
- Form: Vertical stack with gap-4
- Logo: Centered above form
- Links: Below form, text-sm

### Profile Page
- Two-column: User info (left) + Connected accounts (right)
- Stats grid: 2-3 columns
- Edit mode: Inline form fields

---

## Images

**No hero images required** - This is a utility application, not a marketing site.

**Where images may appear:**
- Empty states: Illustration or icon for "No questions saved yet"
- User avatars: 40px circle in navbar, 80px in profile
- Platform logos: Small icons (16-20px) in badges
- All images should be optional placeholders - focus is on functionality

---

## Accessibility

- All interactive elements: Keyboard navigable
- Form inputs: Associated labels (visible or sr-only)
- Icon buttons: aria-label attributes
- Theme toggle: Accessible switch role
- Monaco Editor: Built-in accessibility features enabled
- Focus indicators: Clear ring-2 states on all focusable elements
- Consistent tab order following visual hierarchy