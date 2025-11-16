# UI Components Library

Foundation/Primitive components for the Event Ticketing Platform, built following the Design System specifications.

## Overview

This library provides a comprehensive set of reusable, accessible, and type-safe React components built with:
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **class-variance-authority** for variant management
- **Radix UI** primitives for accessibility
- **Design System** compliance for consistency

## Components

### Button Components

#### Button
Primary button component with multiple variants and sizes.

```tsx
import { Button } from '@/components/ui';

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// States
<Button loading>Loading...</Button>
<Button disabled>Disabled</Button>

// As child (polymorphic)
<Button asChild>
  <a href="/events">View Events</a>
</Button>
```

#### IconButton
Icon-only button for actions.

```tsx
import { IconButton } from '@/components/ui';

<IconButton aria-label="Close" variant="default">
  <XIcon className="w-5 h-5" />
</IconButton>

<IconButton aria-label="Delete" variant="destructive">
  <TrashIcon className="w-5 h-5" />
</IconButton>
```

#### ButtonGroup
Group related buttons together.

```tsx
import { ButtonGroup, Button } from '@/components/ui';

<ButtonGroup>
  <Button variant="outline">Left</Button>
  <Button variant="outline">Middle</Button>
  <Button variant="outline">Right</Button>
</ButtonGroup>

<ButtonGroup orientation="vertical">
  <Button variant="outline">Top</Button>
  <Button variant="outline">Bottom</Button>
</ButtonGroup>
```

### Form Components

#### Input
Text input with validation states.

```tsx
import { Input, Label } from '@/components/ui';

<div className="space-y-2">
  <Label htmlFor="email" required>Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="you@example.com"
  />
</div>

// With error
<Input error placeholder="Invalid input" />

// Sizes
<Input inputSize="sm" />
<Input inputSize="md" />
<Input inputSize="lg" />
```

#### Textarea
Multi-line text input.

```tsx
import { Textarea, Label } from '@/components/ui';

<div className="space-y-2">
  <Label htmlFor="description">Description</Label>
  <Textarea
    id="description"
    rows={4}
    placeholder="Enter description..."
  />
</div>
```

#### Checkbox
Checkbox with optional label.

```tsx
import { Checkbox } from '@/components/ui';

<Checkbox label="Accept terms and conditions" />

// Without label
<Checkbox id="custom-checkbox" />
```

#### Radio & RadioGroup
Radio buttons for single selection.

```tsx
import { RadioGroup } from '@/components/ui';

<RadioGroup
  name="ticket-type"
  options={[
    { value: 'ga', label: 'General Admission' },
    { value: 'vip', label: 'VIP', disabled: false },
    { value: 'premium', label: 'Premium' },
  ]}
  value={selectedValue}
  onChange={setSelectedValue}
/>

// Horizontal orientation
<RadioGroup orientation="horizontal" {...props} />
```

#### Switch
Toggle switch for boolean values.

```tsx
import { Switch } from '@/components/ui';

<Switch
  label="Enable notifications"
  checked={enabled}
  onCheckedChange={setEnabled}
/>
```

#### Select
Dropdown selection.

```tsx
import { Select, Label } from '@/components/ui';

<div className="space-y-2">
  <Label htmlFor="category">Category</Label>
  <Select
    id="category"
    options={[
      { value: 'music', label: 'Music' },
      { value: 'sports', label: 'Sports' },
      { value: 'arts', label: 'Arts & Culture' },
    ]}
  />
</div>
```

### Typography Components

#### Heading
Semantic headings with consistent styling.

```tsx
import { Heading } from '@/components/ui';

<Heading level="h1">Page Title</Heading>
<Heading level="h2">Section Title</Heading>
<Heading level="h3">Subsection Title</Heading>

// Custom element
<Heading as="h1" level="h2">Styled as H2, semantic H1</Heading>
```

#### Text
Flexible text component with variants.

```tsx
import { Text } from '@/components/ui';

<Text>Default body text</Text>
<Text size="sm" variant="muted">Small muted text</Text>
<Text size="lg" weight="semibold">Large semibold text</Text>
<Text variant="error">Error message</Text>
<Text variant="success">Success message</Text>

// As different element
<Text as="span">Inline text</Text>
```

#### Link
Next.js Link with styling.

```tsx
import { Link } from '@/components/ui';

<Link href="/events">Browse Events</Link>
<Link href="/help" variant="muted">Help Center</Link>

// External link
<Link href="https://example.com" external>
  External Link
</Link>
```

### Feedback Components

#### Badge
Status indicators and labels.

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Cancelled</Badge>
<Badge variant="primary">Featured</Badge>
<Badge variant="outline">Draft</Badge>

// Sizes
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>
```

#### Spinner
Loading indicator.

```tsx
import { Spinner } from '@/components/ui';

<Spinner />
<Spinner size="sm" />
<Spinner size="lg" />
<Spinner variant="white" />
<Spinner label="Loading events..." />
```

#### Skeleton
Loading placeholder.

```tsx
import { Skeleton } from '@/components/ui';

<Skeleton className="h-4 w-full" />
<Skeleton variant="circular" className="w-12 h-12" />
<Skeleton variant="rectangular" className="h-32 w-full" />
```

#### ProgressBar
Progress indicator.

```tsx
import { ProgressBar } from '@/components/ui';

<ProgressBar value={75} />
<ProgressBar value={50} variant="success" showLabel />
<ProgressBar value={25} variant="warning" size="lg" />
```

#### Avatar
User/organization avatar with fallback.

```tsx
import { Avatar } from '@/components/ui';

<Avatar src="/avatar.jpg" alt="User" />
<Avatar name="John Doe" />
<Avatar name="Jane Smith" size="lg" />
<Avatar fallback="AB" size="xl" />
```

## Accessibility

All components follow WCAG 2.1 AA guidelines:
- Proper ARIA attributes
- Keyboard navigation support
- Focus indicators
- Screen reader support
- Semantic HTML

## TypeScript Support

All components are fully typed with TypeScript:
- Props interfaces exported
- Variant types from class-variance-authority
- Proper ref forwarding
- Generic type support where applicable

## Styling

Components use Tailwind CSS classes from the Design System:
- Consistent color palette
- Typography scale
- Spacing system
- Border styles
- Interactive states

## Best Practices

1. **Always provide labels** for form inputs
2. **Use semantic HTML** (proper heading levels, etc.)
3. **Include aria-label** for icon buttons
4. **Handle loading states** in buttons
5. **Show error states** in form inputs
6. **Use appropriate variants** for context

## Examples

See the component showcase at `/components-demo` for live examples of all components.

