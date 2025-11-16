# Design System Quick Reference

**For:** Developers implementing UI components  
**Style:** Professional, Enterprise-Grade, Flat Design

---

## ✅ DO's - Copy & Paste These Patterns

### **Cards**
```tsx
// Standard card
<div className="rounded-lg border border-border bg-card p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-foreground">Title</h3>
  <p className="text-sm text-muted-foreground">Description</p>
</div>

// Interactive card (hover effect)
<div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-all hover:border-primary hover:shadow-md">
  {/* content */}
</div>

// Selected/Active card
<div className="rounded-lg border-2 border-primary bg-card p-6 shadow-sm">
  {/* content */}
</div>
```

### **Buttons**
```tsx
// Primary CTA
<button className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90">
  Click me
</button>

// Secondary button
<button className="rounded-md border border-border bg-background px-4 py-2 font-medium text-foreground transition-colors hover:bg-muted">
  Secondary
</button>

// Outline button
<button className="rounded-md border border-primary px-4 py-2 font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
  Outline
</button>

// Large button
<button className="rounded-md bg-primary px-6 py-3 text-lg font-medium text-primary-foreground transition-colors hover:bg-primary/90">
  Large CTA
</button>
```

### **Badges**
```tsx
// Standard badge
<span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
  Category
</span>

// Accent/Promotional badge
<span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
  Popular
</span>

// Outline badge
<span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-sm font-medium text-foreground">
  Tag
</span>

// Success badge
<span className="inline-flex items-center rounded-full bg-success px-3 py-1 text-sm font-medium text-success-foreground">
  Available
</span>

// Warning badge
<span className="inline-flex items-center rounded-full bg-warning px-3 py-1 text-sm font-medium text-warning-foreground">
  Low stock
</span>
```

### **Form Inputs**
```tsx
// Text input
<input
  type="text"
  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
  placeholder="Enter text..."
/>

// Input with error
<input
  type="text"
  className="w-full rounded-md border border-error bg-background px-3 py-2 text-foreground focus:border-error focus:outline-none focus:ring-2 focus:ring-error/20"
/>

// Select dropdown
<select className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
  <option>Option 1</option>
</select>

// Textarea
<textarea
  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
  rows={4}
  placeholder="Enter description..."
/>
```

### **Typography**
```tsx
// Page heading
<h1 className="text-3xl font-bold text-foreground lg:text-4xl">
  Page Title
</h1>

// Section heading
<h2 className="text-2xl font-semibold text-foreground lg:text-3xl">
  Section Title
</h2>

// Card title
<h3 className="text-lg font-semibold text-foreground lg:text-xl">
  Card Title
</h3>

// Body text
<p className="text-base text-foreground">
  Regular paragraph text
</p>

// Muted/secondary text
<p className="text-sm text-muted-foreground">
  Secondary information
</p>

// Small label
<label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
  Label
</label>
```

### **Sections/Containers**
```tsx
// Page section
<section className="py-12 lg:py-16">
  <div className="container mx-auto px-4">
    {/* content */}
  </div>
</section>

// Card grid
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {/* cards */}
</div>

// Two-column layout
<div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
  <div>{/* left column */}</div>
  <div>{/* right column */}</div>
</div>
```

### **Lists**
```tsx
// Simple list
<ul className="space-y-2">
  <li className="text-foreground">Item 1</li>
  <li className="text-foreground">Item 2</li>
</ul>

// List with dividers
<ul className="divide-y divide-border">
  <li className="py-4">Item 1</li>
  <li className="py-4">Item 2</li>
</ul>
```

---

## ❌ DON'Ts - Avoid These Patterns

### **No Glassmorphism**
```tsx
// ❌ WRONG
<div className="bg-white/10 backdrop-blur-md">

// ✅ CORRECT
<div className="border border-border bg-card">
```

### **No Decorative Blur**
```tsx
// ❌ WRONG
<div className="absolute blur-3xl bg-primary/20">

// ✅ CORRECT - Use solid backgrounds
<div className="bg-primary">
```

### **No Heavy Shadows**
```tsx
// ❌ WRONG
<div className="shadow-2xl">

// ✅ CORRECT
<div className="shadow-sm">
```

### **No Low Contrast**
```tsx
// ❌ WRONG
<p className="text-gray-300">Text</p>

// ✅ CORRECT
<p className="text-muted-foreground">Text</p>
```

### **No Random Spacing**
```tsx
// ❌ WRONG
<div className="p-7 gap-5">

// ✅ CORRECT - Use 4px increments
<div className="p-6 gap-4">
```

---

## Color Reference

### **Backgrounds**
- `bg-background` - Page background (#f9fafb)
- `bg-card` - Card background (#ffffff)
- `bg-muted` - Muted background (#f3f4f6)
- `bg-primary` - Primary color (#1e40af)
- `bg-secondary` - Secondary color (#7c3aed)
- `bg-accent` - Accent color (#f59e0b)

### **Text Colors**
- `text-foreground` - Primary text (#111827)
- `text-muted-foreground` - Secondary text (#6b7280)
- `text-primary` - Primary color text
- `text-white` - White text (on dark backgrounds)

### **Borders**
- `border-border` - Standard border (rgba(0,0,0,0.1))
- `border-primary` - Primary color border
- `border-error` - Error state border

### **Semantic Colors**
- `bg-success` / `text-success` - Green (#059669)
- `bg-warning` / `text-warning` - Orange (#d97706)
- `bg-error` / `text-error` - Red (#dc2626)

---

## Spacing Reference

### **Padding**
- `p-2` = 8px (tight)
- `p-4` = 16px (compact)
- `p-6` = 24px (standard)
- `p-8` = 32px (spacious)

### **Gaps**
- `gap-2` = 8px (tight)
- `gap-4` = 16px (standard)
- `gap-6` = 24px (medium)
- `gap-8` = 32px (large)
- `gap-12` = 48px (section)

### **Margins**
- `mb-2` = 8px
- `mb-4` = 16px
- `mb-6` = 24px
- `mb-8` = 32px

---

## Border Radius Reference

- `rounded-md` = 6px (buttons, inputs)
- `rounded-lg` = 8px (cards, standard)
- `rounded-xl` = 12px (large cards)
- `rounded-full` = 9999px (badges, pills)

---

## Shadow Reference

- `shadow-sm` - Subtle elevation (cards)
- `shadow-md` - Medium elevation (dropdowns)
- `shadow-lg` - High elevation (modals, sparingly)

**Never use:** `shadow-xl`, `shadow-2xl`

---

## Transition Reference

```tsx
// All properties
className="transition-all duration-300"

// Colors only
className="transition-colors duration-300"

// Transform only
className="transition-transform duration-300"
```

---

## Common Patterns

### **Hover Effect on Card**
```tsx
className="transition-all hover:border-primary hover:shadow-md"
```

### **Focus Ring on Input**
```tsx
className="focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
```

### **Active/Selected State**
```tsx
className={cn(
  "border border-border",
  isSelected && "border-2 border-primary"
)}
```

### **Disabled State**
```tsx
className="opacity-50 cursor-not-allowed"
disabled
```

---

## Responsive Patterns

### **Responsive Text**
```tsx
className="text-base lg:text-lg"
className="text-2xl lg:text-3xl"
```

### **Responsive Padding**
```tsx
className="p-4 lg:p-6"
className="py-12 lg:py-16"
```

### **Responsive Grid**
```tsx
className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
```

### **Responsive Spacing**
```tsx
className="gap-4 lg:gap-6"
className="space-y-6 lg:space-y-8"
```

---

## Checklist for New Components

- [ ] Uses solid backgrounds (no glassmorphism)
- [ ] Uses border-based structure
- [ ] Has high contrast text
- [ ] Uses design system colors only
- [ ] Uses 4px-based spacing
- [ ] Has proper hover/focus states
- [ ] Uses consistent border radius
- [ ] Uses minimal shadows (shadow-sm or shadow-md)
- [ ] Is responsive (mobile, tablet, desktop)
- [ ] Has proper accessibility (ARIA, keyboard nav)

---

## Quick Tips

1. **When in doubt, use borders** - Not shadows or blur
2. **Keep it simple** - Remove unnecessary decoration
3. **Use the palette** - Don't create custom colors
4. **Be consistent** - Copy existing patterns
5. **Test contrast** - Ensure text is readable
6. **Think professional** - Would this work in a bank app?

---

**Remember:** This is a professional, enterprise-grade platform for financial transactions. Every design decision should build trust and clarity.

