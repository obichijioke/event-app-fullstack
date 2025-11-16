# Official Design Direction

**Date:** 2025-10-24  
**Status:** ✅ Approved  
**Reference:** EventHub Ticket Selection Interface

---

## Design System Overview

This document defines the **official design direction** for the event ticketing platform based on the professional, enterprise-grade aesthetic demonstrated in the EventHub ticket selection interface.

---

## Core Design Philosophy

### **Professional & Enterprise-Grade**

This platform handles **financial transactions** and must build **trust** with users in the Nigerian market. The design system prioritizes:

1. **Clarity over decoration** - Information is immediately scannable
2. **Trust & professionalism** - Clean, corporate aesthetic
3. **Timeless design** - Won't look dated in 2-3 years
4. **Accessibility** - High contrast, clear hierarchy
5. **Consistency** - Systematic use of design tokens

---

## Design Principles

### 1. **Flat Design - No Glassmorphism**

**✅ DO:**
- Use solid backgrounds (`bg-white`, `bg-card`, `bg-primary`)
- Create depth through borders and spacing
- Use subtle shadows sparingly (`shadow-sm`, `shadow-md`)
- Maintain high contrast for readability

**❌ DON'T:**
- Use glassmorphism effects (`backdrop-blur`, semi-transparent backgrounds)
- Use heavy gradients for decorative purposes
- Use decorative blur elements
- Use transparency effects for structure

**Example:**
```tsx
// ✅ CORRECT - Professional card
<div className="rounded-lg border border-border bg-card p-6 shadow-sm">

// ❌ WRONG - Glassmorphism
<div className="rounded-lg bg-white/10 backdrop-blur-md">
```

### 2. **Border-Based Structure**

**Borders define structure, not shadows or blur effects.**

**✅ DO:**
- Use clear borders to separate sections (`border-border`)
- Use colored borders for active/selected states (`border-primary`)
- Use consistent border radius (`rounded-lg` = 8px for cards)
- Use borders to create visual hierarchy

**❌ DON'T:**
- Rely on shadows alone for structure
- Use transparency to create separation
- Mix border radius sizes inconsistently

**Example:**
```tsx
// ✅ CORRECT - Border-based structure
<div className="rounded-lg border border-border bg-white">
  <div className="border-b border-border p-4">Header</div>
  <div className="p-4">Content</div>
</div>

// ❌ WRONG - Shadow-based structure
<div className="rounded-lg bg-white shadow-2xl">
```

### 3. **High Contrast & Readability**

**All text must be easily readable with proper contrast ratios.**

**✅ DO:**
- Use dark text on light backgrounds (`text-foreground` on `bg-background`)
- Use white text on dark backgrounds (`text-white` on `bg-primary`)
- Use muted colors for secondary text (`text-muted-foreground`)
- Maintain WCAG AA compliance minimum (AAA preferred)

**❌ DON'T:**
- Use low-contrast color combinations
- Use white text on light backgrounds
- Use decorative colors that reduce readability

**Example:**
```tsx
// ✅ CORRECT - High contrast
<div className="bg-white">
  <h2 className="text-foreground">Title</h2>
  <p className="text-muted-foreground">Description</p>
</div>

// ❌ WRONG - Low contrast
<div className="bg-white">
  <h2 className="text-gray-300">Title</h2>
</div>
```

### 4. **Minimal & Purposeful**

**Every design element must serve a purpose.**

**✅ DO:**
- Use clean, minimal designs
- Remove unnecessary decorative elements
- Use white space effectively
- Keep interfaces uncluttered

**❌ DON'T:**
- Add decorative elements without purpose
- Use emojis excessively in UI (sparingly in content is OK)
- Overcomplicate simple interactions
- Add visual effects for aesthetic only

### 5. **Consistent & Predictable**

**Users should know what to expect.**

**✅ DO:**
- Use consistent spacing scale (4px increments)
- Use consistent color palette
- Use consistent component patterns
- Use consistent interaction patterns

**❌ DON'T:**
- Mix different spacing systems
- Use random colors outside the palette
- Create one-off component variations
- Use inconsistent hover/focus states

---

## Visual Design Patterns

### **Depth Creation Methods**

1. **Borders** (Primary method)
   - `border-border` for standard borders
   - `border-primary` for active/selected states
   - `border-2` for emphasis when needed

2. **Spacing** (Secondary method)
   - Generous padding and margins
   - White space to separate sections
   - Consistent gaps between elements

3. **Shadows** (Minimal use)
   - `shadow-sm` for subtle card elevation
   - `shadow-md` for dropdowns/popovers
   - `shadow-lg` for modals (sparingly)
   - Never use `shadow-2xl` or decorative shadows

4. **Color Contrast**
   - Light cards on light gray backgrounds
   - White text on colored backgrounds
   - Colored text for emphasis

### **Component Styling Standards**

#### **Cards**
```tsx
// Standard card
<div className="rounded-lg border border-border bg-card p-6 shadow-sm">

// Selected/Active card
<div className="rounded-lg border-2 border-primary bg-card p-6 shadow-sm">

// Hover state
<div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-all hover:border-primary hover:shadow-md">
```

#### **Buttons**
```tsx
// Primary button
<button className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">

// Secondary button
<button className="rounded-md border border-border bg-background px-4 py-2 text-foreground hover:bg-muted">

// Outline button
<button className="rounded-md border border-primary px-4 py-2 text-primary hover:bg-primary hover:text-primary-foreground">
```

#### **Badges**
```tsx
// Standard badge
<span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">

// Accent badge (for promotions)
<span className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">

// Outline badge
<span className="rounded-full border border-border px-3 py-1 text-sm font-medium text-foreground">
```

#### **Inputs**
```tsx
// Standard input
<input className="rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />

// Error state
<input className="rounded-md border border-error bg-background px-3 py-2 text-foreground focus:border-error focus:outline-none focus:ring-2 focus:ring-error/20" />
```

---

## Color Usage Guidelines

### **Primary Color (Blue #1e40af)**
- Primary buttons and CTAs
- Active/selected states
- Links and interactive elements
- Brand elements
- Step indicators (active)

### **Secondary Color (Purple #7c3aed)**
- Secondary buttons
- Badges for categories
- Alternative CTAs
- Accent elements

### **Accent Color (Amber #f59e0b)**
- Promotional badges ("Popular", "Featured")
- Special offers
- Attention-grabbing elements
- Limited use for emphasis

### **Semantic Colors**
- **Success (Green #059669):** Confirmations, availability, positive states
- **Warning (Orange #d97706):** Cautions, low inventory, pending states
- **Error (Red #dc2626):** Errors, validation failures, destructive actions

### **Neutral Colors**
- **Background (#f9fafb):** Page background
- **Card (#ffffff):** Card backgrounds, elevated surfaces
- **Foreground (#111827):** Primary text
- **Muted (#6b7280):** Secondary text, labels
- **Border (rgba(0,0,0,0.1)):** Standard borders

---

## Typography Guidelines

### **Font Weights**
- **Bold (700):** Prices, totals, primary headings
- **Semibold (600):** Section headers, card titles
- **Medium (500):** Labels, secondary headings, buttons
- **Regular (400):** Body text, descriptions

### **Font Sizes**
- **Hero headline:** `text-4xl sm:text-5xl lg:text-6xl` (36-72px)
- **Page title:** `text-3xl lg:text-4xl` (30-36px)
- **Section heading:** `text-2xl lg:text-3xl` (24-30px)
- **Card title:** `text-lg lg:text-xl` (18-20px)
- **Body text:** `text-base` (16px)
- **Small text:** `text-sm` (14px)
- **Micro text:** `text-xs` (12px)

### **Text Hierarchy**
1. Primary information (prices, titles) - Large, bold
2. Secondary information (descriptions) - Regular weight
3. Tertiary information (labels, metadata) - Small, muted

---

## Spacing Guidelines

### **Spacing Scale (4px increments)**
- `gap-2` (8px) - Tight spacing between related items
- `gap-3` (12px) - Small spacing
- `gap-4` (16px) - Standard spacing between elements
- `gap-6` (24px) - Medium spacing between sections
- `gap-8` (32px) - Large spacing
- `gap-12` (48px) - Section spacing
- `gap-16` (64px) - Major section spacing

### **Padding Standards**
- **Cards:** `p-6` (24px) standard, `p-4` (16px) compact
- **Buttons:** `px-4 py-2` (16px/8px) standard, `px-6 py-3` (24px/12px) large
- **Inputs:** `px-3 py-2` (12px/8px)
- **Badges:** `px-3 py-1` (12px/4px)
- **Sections:** `py-12 lg:py-16` (48-64px)

---

## Border & Radius Guidelines

### **Border Widths**
- `border` (1px) - Standard borders
- `border-2` (2px) - Active/selected states
- `border-0` - No border

### **Border Radius**
- `rounded-md` (6px) - Buttons, inputs, small elements
- `rounded-lg` (8px) - Cards, containers, standard elements
- `rounded-xl` (12px) - Large cards, modals
- `rounded-full` - Badges, pills, circular elements

---

## Interaction Patterns

### **Hover States**
- Subtle border color change (`hover:border-primary`)
- Slight shadow increase (`hover:shadow-md`)
- Background color shift (`hover:bg-muted`)
- Minimal lift effect (`hover:-translate-y-0.5`)

### **Focus States**
- Clear focus ring (`focus:ring-2 focus:ring-primary/20`)
- Border color change (`focus:border-primary`)
- No outline removal without alternative

### **Active/Selected States**
- Colored border (`border-primary`)
- Background color change
- Visual indicator (checkmark, highlight)

### **Transitions**
- `transition-all duration-300` for smooth interactions
- `transition-colors` for color-only changes
- `transition-transform` for movement

---

## What to Avoid

### **❌ Glassmorphism Effects**
- No `backdrop-blur`
- No semi-transparent backgrounds for structure
- No frosted glass effects

### **❌ Heavy Visual Effects**
- No decorative gradients
- No decorative blur elements
- No excessive shadows
- No 3D effects

### **❌ Trendy Design Patterns**
- No neumorphism
- No brutalism
- No maximalist designs
- No overly artistic layouts

### **❌ Inconsistent Patterns**
- No random spacing values
- No off-palette colors
- No one-off component styles
- No mixing design systems

---

## Summary

This design system creates a **professional, trustworthy, and accessible** experience suitable for:

1. ✅ Financial transactions
2. ✅ Enterprise/B2B contexts
3. ✅ Nigerian market expectations
4. ✅ Long-term maintainability
5. ✅ Accessibility compliance
6. ✅ Multi-device responsiveness

**Key Characteristics:**
- **Flat design** with border-based structure
- **High contrast** for readability
- **Minimal effects** for professionalism
- **Consistent patterns** for predictability
- **Timeless aesthetic** for longevity

This is the **official design direction** for all components, pages, and features in the application.

