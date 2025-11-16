'use client';

import * as React from 'react';
import {
  Button,
  IconButton,
  ButtonGroup,
  Input,
  Textarea,
  Label,
  Checkbox,
  RadioGroup,
  Switch,
  Select,
  Heading,
  Text,
  Link,
  Badge,
  Spinner,
  Skeleton,
  ProgressBar,
  Avatar,
} from '@/components/ui';

export default function ComponentsDemo() {
  const [radioValue, setRadioValue] = React.useState('option1');
  const [switchValue, setSwitchValue] = React.useState(false);

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-12">
          <Heading level="h1" className="mb-4">
            UI Components Showcase
          </Heading>
          <Text variant="muted" size="lg">
            Foundation/Primitive components following the Design System
          </Text>
        </div>

        {/* Buttons */}
        <section className="mb-16">
          <Heading level="h2" className="mb-6">
            Buttons
          </Heading>
          
          <div className="space-y-6">
            <div>
              <Text weight="semibold" className="mb-3">
                Variants
              </Text>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            <div>
              <Text weight="semibold" className="mb-3">
                Sizes
              </Text>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            <div>
              <Text weight="semibold" className="mb-3">
                States
              </Text>
              <div className="flex flex-wrap gap-3">
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>

            <div>
              <Text weight="semibold" className="mb-3">
                Icon Buttons
              </Text>
              <div className="flex flex-wrap gap-3">
                <IconButton aria-label="Close" variant="default">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </IconButton>
                <IconButton aria-label="Edit" variant="primary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </IconButton>
                <IconButton aria-label="Delete" variant="destructive">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </IconButton>
              </div>
            </div>

            <div>
              <Text weight="semibold" className="mb-3">
                Button Group
              </Text>
              <ButtonGroup>
                <Button variant="outline">Left</Button>
                <Button variant="outline">Middle</Button>
                <Button variant="outline">Right</Button>
              </ButtonGroup>
            </div>
          </div>
        </section>

        {/* Form Components */}
        <section className="mb-16">
          <Heading level="h2" className="mb-6">
            Form Components
          </Heading>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <div className="space-y-2">
              <Label htmlFor="input-demo" required>
                Text Input
              </Label>
              <Input id="input-demo" placeholder="Enter text..." />
              <Text size="xs" variant="muted">
                Helper text goes here
              </Text>
            </div>

            <div className="space-y-2">
              <Label htmlFor="input-error">Input with Error</Label>
              <Input id="input-error" error placeholder="Invalid input" />
              <Text size="xs" variant="error">
                This field is required
              </Text>
            </div>

            <div className="space-y-2">
              <Label htmlFor="textarea-demo">Textarea</Label>
              <Textarea id="textarea-demo" rows={4} placeholder="Enter description..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="select-demo">Select</Label>
              <Select
                id="select-demo"
                options={[
                  { value: '', label: 'Select an option' },
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ]}
              />
            </div>

            <div className="space-y-3">
              <Label>Checkbox</Label>
              <Checkbox label="Accept terms and conditions" />
              <Checkbox label="Subscribe to newsletter" />
            </div>

            <div className="space-y-3">
              <Label>Radio Group</Label>
              <RadioGroup
                name="demo-radio"
                options={[
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ]}
                value={radioValue}
                onChange={setRadioValue}
              />
            </div>

            <div className="space-y-3">
              <Label>Switch</Label>
              <Switch
                label="Enable notifications"
                checked={switchValue}
                onCheckedChange={setSwitchValue}
              />
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-16">
          <Heading level="h2" className="mb-6">
            Typography
          </Heading>
          
          <div className="space-y-4">
            <Heading level="h1">Heading 1</Heading>
            <Heading level="h2">Heading 2</Heading>
            <Heading level="h3">Heading 3</Heading>
            <Heading level="h4">Heading 4</Heading>
            <Heading level="h5">Heading 5</Heading>
            <Heading level="h6">Heading 6</Heading>
            
            <div className="pt-4 space-y-2">
              <Text size="lg">Large body text</Text>
              <Text>Default body text</Text>
              <Text size="sm" variant="muted">Small muted text</Text>
              <Text size="xs" variant="muted">Extra small text</Text>
            </div>

            <div className="pt-4 space-y-2">
              <Link href="#">Default link</Link>
              <br />
              <Link href="#" variant="muted">Muted link</Link>
              <br />
              <Link href="#" variant="underline">Underlined link</Link>
            </div>
          </div>
        </section>

        {/* Feedback Components */}
        <section className="mb-16">
          <Heading level="h2" className="mb-6">
            Feedback Components
          </Heading>
          
          <div className="space-y-6">
            <div>
              <Text weight="semibold" className="mb-3">
                Badges
              </Text>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="outline-primary">Outline Primary</Badge>
              </div>
            </div>

            <div>
              <Text weight="semibold" className="mb-3">
                Spinners
              </Text>
              <div className="flex flex-wrap items-center gap-4">
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" />
                <Spinner size="xl" />
              </div>
            </div>

            <div>
              <Text weight="semibold" className="mb-3">
                Skeletons
              </Text>
              <div className="space-y-3 max-w-md">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center space-x-3">
                  <Skeleton variant="circular" className="w-12 h-12" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Text weight="semibold" className="mb-3">
                Progress Bars
              </Text>
              <div className="space-y-4 max-w-md">
                <ProgressBar value={25} />
                <ProgressBar value={50} variant="success" showLabel />
                <ProgressBar value={75} variant="warning" />
                <ProgressBar value={90} variant="error" size="lg" showLabel />
              </div>
            </div>

            <div>
              <Text weight="semibold" className="mb-3">
                Avatars
              </Text>
              <div className="flex flex-wrap items-center gap-4">
                <Avatar name="John Doe" size="sm" />
                <Avatar name="Jane Smith" size="md" />
                <Avatar name="Bob Johnson" size="lg" />
                <Avatar name="Alice Williams" size="xl" />
                <Avatar fallback="AB" size="2xl" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
