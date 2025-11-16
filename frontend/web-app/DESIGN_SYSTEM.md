# Event Platform Design System

**Version:** 2.0  
**Last Updated:** 2025-10-24  
**Target Platform:** Event Ticketing Platform (Nigeria Market)

---

## Design Philosophy

This design system defines the core design tokens for a **flat, minimal, enterprise-focused** aesthetic optimized for clarity, trust, and accessibility.

**Key Principles:**
- **Flat Design**: Structure through borders and spacing, minimal shadows
- **High Contrast**: Clear visual hierarchy for readability
- **Professional**: Suitable for financial transactions
- **Consistent**: Predictable patterns using design tokens
- **No Glassmorphism**: Solid backgrounds, no blur effects
- **Border-Based**: Depth created through borders, not transparency

**Reference:** See `DESIGN_DIRECTION.md` for official design direction and `DESIGN_QUICK_REFERENCE.md` for developer quick reference.

**Note:** For component implementation details, see `components/ui/README.md`

---

## 1. Color System

### 1.1 Primary Colors

**Primary Blue** - Main brand color for primary actions and key UI elements
- **Value:** `#1e40af` (Blue 800)
- **Usage:** Primary buttons, links, active states, brand elements
- **Classes:** `bg-primary`, `text-primary`, `border-primary`
- **Foreground:** `#ffffff` (White) - `text-primary-foreground`
- **Contrast Ratio:** 8.59:1 (AAA compliant)

**Secondary Purple** - Secondary actions and accents
- **Value:** `#7c3aed` (Violet 600)
- **Usage:** Secondary buttons, badges, highlights
- **Classes:** `bg-secondary`, `text-secondary`, `border-secondary`
- **Foreground:** `#ffffff` (White) - `text-secondary-foreground`

**Accent Amber** - Call-to-action and emphasis
- **Value:** `#f59e0b` (Amber 500)
- **Usage:** Promotional elements, featured badges, CTAs
- **Classes:** `bg-accent`, `text-accent`, `border-accent`
- **Foreground:** `#ffffff` (White) - `text-accent-foreground`

### 1.2 Semantic Colors

**Success Green**
- **Value:** `#059669` (Emerald 600)
- **Usage:** Success messages, confirmations, positive states
- **Classes:** `bg-success`, `text-success`, `border-success`
- **Foreground:** `#ffffff` - `text-success-foreground`

**Warning Orange**
- **Value:** `#d97706` (Amber 600)
- **Usage:** Warning messages, caution states, pending actions
- **Classes:** `bg-warning`, `text-warning`, `border-warning`
- **Foreground:** `#ffffff` - `text-warning-foreground`

**Error Red**
- **Value:** `#dc2626` (Red 600)
- **Usage:** Error messages, destructive actions, validation errors
- **Classes:** `bg-error`, `text-error`, `border-error`
- **Foreground:** `#ffffff` - `text-error-foreground`

### 1.3 Neutral Colors

**Background**
- **Light Mode:** `#f9fafb` (Gray 50)
- **Dark Mode:** `#0a0a0a` (Near Black)
- **Classes:** `bg-background`

**Foreground (Text)**
- **Light Mode:** `#111827` (Gray 900)
- **Dark Mode:** `#ededed` (Light Gray)
- **Classes:** `text-foreground`

**Muted (Subtle backgrounds)**
- **Light Mode:** `#f3f4f6` (Gray 100)
- **Dark Mode:** `#1f2937` (Gray 800)
- **Classes:** `bg-muted`, `text-muted-foreground`
- **Foreground:** `#6b7280` (Gray 500) in light mode

**Border**
- **Light Mode:** `rgba(0, 0, 0, 0.1)` (10% black)
- **Dark Mode:** `rgba(255, 255, 255, 0.1)` (10% white)
- **Classes:** `border-border`

### 1.4 Surface Colors

**Card**
- **Light Mode:** `#ffffff` (White)
- **Dark Mode:** `#1f2937` (Gray 800)
- **Classes:** `bg-card`, `text-card-foreground`
- **Usage:** Cards, panels, elevated surfaces

**Popover**
- **Light Mode:** `#ffffff` (White)
- **Dark Mode:** `#1f2937` (Gray 800)
- **Classes:** `bg-popover`, `text-popover-foreground`
- **Usage:** Dropdowns, tooltips, popovers

**Input**
- **Value:** `#ffffff` (White)
- **Classes:** `bg-input`
- **Usage:** Form inputs, text areas, select boxes

### 1.5 Color Usage Guidelines

**DO:**
- Use `bg-primary` with `text-primary-foreground` for primary buttons
- Use semantic colors for their intended purpose (success for confirmations, error for failures)
- Maintain consistent color pairings (background + foreground)
- Use `border-border` for all standard borders

**DON'T:**
- Mix color foregrounds (e.g., `bg-primary` with `text-secondary-foreground`)
- Use decorative colors for semantic meaning
- Override semantic colors for aesthetic preferences

---

## 2. Spacing System

### 2.1 Spacing Scale

Tailwind's default spacing scale (based on 0.25rem / 4px increments):

| Class | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `0` | `0` | 0px | No spacing |
| `0.5` | `0.125rem` | 2px | Micro spacing |
| `1` | `0.25rem` | 4px | Tight spacing |
| `1.5` | `0.375rem` | 6px | Compact spacing |
| `2` | `0.5rem` | 8px | Small spacing |
| `3` | `0.75rem` | 12px | Medium-small spacing |
| `4` | `1rem` | 16px | **Base spacing** |
| `5` | `1.25rem` | 20px | Medium spacing |
| `6` | `1.5rem` | 24px | Medium-large spacing |
| `8` | `2rem` | 32px | Large spacing |
| `10` | `2.5rem` | 40px | Extra large spacing |
| `12` | `3rem` | 48px | Section spacing |
| `16` | `4rem` | 64px | Major section spacing |
| `18` | `4.5rem` | 72px | Custom large spacing |
| `20` | `5rem` | 80px | Hero spacing |
| `24` | `6rem` | 96px | Extra hero spacing |

### 2.2 Component Spacing Patterns

**Card Padding:**
- **Small:** `p-4` (16px)
- **Medium:** `p-6` (24px) - **Default**
- **Large:** `p-8` (32px)

**Button Padding:**
- **Small:** `px-3 py-1.5` (12px × 6px)
- **Medium:** `px-4 py-2` (16px × 8px) - **Default**
- **Large:** `px-6 py-3` (24px × 12px)

**Input Padding:**
- **Standard:** `px-3 py-2` (12px × 8px)
- **Large:** `px-4 py-3` (16px × 12px)

**Section Spacing:**
- **Between sections:** `mb-12` or `mb-16` (48px or 64px)
- **Between components:** `mb-6` or `mb-8` (24px or 32px)
- **Between elements:** `mb-4` (16px)

**Gap (Flexbox/Grid):**
- **Tight:** `gap-2` (8px)
- **Normal:** `gap-4` (16px) - **Default**
- **Loose:** `gap-6` (24px)

### 2.3 Spacing Guidelines

**DO:**
- Use multiples of 4px for consistency
- Use `space-y-*` for vertical stacking
- Use `gap-*` for flex/grid layouts
- Maintain consistent padding within component types

**DON'T:**
- Use arbitrary values unless absolutely necessary
- Mix spacing scales inconsistently
- Use negative margins excessively

---

## 3. Border Styles

### 3.1 Border Widths

- **None:** `border-0`
- **Thin:** `border` (1px) - **Default**
- **Medium:** `border-2` (2px)
- **Thick:** `border-4` (4px)

### 3.2 Border Radius

- **None:** `rounded-none` (0px)
- **Small:** `rounded-sm` (4px) - `calc(var(--radius) - 4px)`
- **Medium:** `rounded-md` (6px) - `calc(var(--radius) - 2px)`
- **Large:** `rounded-lg` (8px) - `var(--radius)` - **Default**
- **Extra Large:** `rounded-xl` (12px)
- **2XL:** `rounded-2xl` (16px)
- **Full:** `rounded-full` (9999px) - For circles/pills

### 3.3 Border Colors

- **Default:** `border-border` - Use for all standard borders
- **Primary:** `border-primary` - Use for focused/active states
- **Muted:** `border-muted` - Use for subtle dividers
- **Transparent:** `border-transparent` - Use for invisible borders (maintaining layout)

### 3.4 Border Usage Patterns

**Card Border:**
```
border border-border rounded-lg
```

**Input Border (Default):**
```
border border-border rounded-md
```

**Input Border (Focused):**
```
border-2 border-primary rounded-md
```

**Input Border (Error):**
```
border-2 border-error rounded-md
```

**Divider (Horizontal):**
```
border-t border-border
```

**Divider (Vertical):**
```
border-l border-border
```

### 3.5 Border Guidelines

**DO:**
- Use `border-border` for all standard borders
- Use `rounded-lg` for cards and panels
- Use `rounded-md` for inputs and buttons
- Use `border-2` for focus states

**DON'T:**
- Use colored borders for decoration
- Mix border radius values within the same component
- Use borders and shadows together (prefer borders)

---

## 4. Layout Principles

### 4.1 Container System

**Container (Centered with Max Width):**
```html
<div class="container mx-auto px-4">
  <!-- Content -->
</div>
```

**Container Configuration:**
- **Padding:** `2rem` (32px) on all sides
- **Max Width:** `1400px` at `2xl` breakpoint
- **Centering:** `mx-auto`

**Custom Containers:**
```html
<!-- Full width -->
<div class="w-full px-4">

<!-- Max width small -->
<div class="max-w-2xl mx-auto px-4">

<!-- Max width medium -->
<div class="max-w-4xl mx-auto px-4">

<!-- Max width large -->
<div class="max-w-6xl mx-auto px-4">
```

### 4.2 Grid System

**Two Column Grid:**
```html
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>Column 1</div>
  <div>Column 2</div>
</div>
```

**Three Column Grid:**
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>
```

**Four Column Grid:**
```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
  <div>Column 4</div>
</div>
```

**Sidebar Layout:**
```html
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <aside class="lg:col-span-3">Sidebar</aside>
  <main class="lg:col-span-9">Main Content</main>
</div>
```

### 4.3 Responsive Breakpoints

| Breakpoint | Min Width | Tailwind Prefix | Usage |
|------------|-----------|-----------------|-------|
| Mobile | 0px | (none) | Default mobile-first |
| Small | 640px | `sm:` | Large phones, small tablets |
| Medium | 768px | `md:` | Tablets |
| Large | 1024px | `lg:` | Laptops, desktops |
| Extra Large | 1280px | `xl:` | Large desktops |
| 2XL | 1536px | `2xl:` | Extra large screens |

**Responsive Pattern Example:**
```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
  <!-- Responsive grid: 1 col mobile, 2 cols small, 3 cols large, 4 cols xl -->
</div>
```

### 4.4 Flexbox Patterns

**Horizontal Stack (with gap):**
```html
<div class="flex items-center space-x-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

**Vertical Stack (with gap):**
```html
<div class="flex flex-col space-y-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

**Space Between:**
```html
<div class="flex items-center justify-between">
  <div>Left</div>
  <div>Right</div>
</div>
```

**Centered Content:**
```html
<div class="flex items-center justify-center min-h-screen">
  <div>Centered Content</div>
</div>
```

### 4.5 Z-Index Layers

| Layer | Z-Index | Usage |
|-------|---------|-------|
| Base | `0` | Default layer |
| Dropdown | `999` | `z-999` - Dropdown menus |
| Sticky | `1000` | `z-1000` - Sticky headers |
| Fixed | `1001` | `z-1001` - Fixed elements |
| Modal Backdrop | `2000` | `z-2000` - Modal overlays |
| Modal Content | `3000` | `z-3000` - Modal dialogs |

---

**End of Design System Documentation**

