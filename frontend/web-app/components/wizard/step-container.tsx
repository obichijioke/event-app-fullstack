'use client';

interface StepContainerProps {
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function StepContainer({
  title,
  description,
  icon,
  children,
  maxWidth = 'lg',
}: StepContainerProps) {
  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  }[maxWidth];

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Step Header */}
        <div className="mb-8 text-center">
          <div className="text-4xl mb-3">{icon}</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {title}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        {/* Step Content */}
        <div className={`mx-auto ${maxWidthClass === 'max-w-full' ? '' : maxWidthClass}`}>
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}