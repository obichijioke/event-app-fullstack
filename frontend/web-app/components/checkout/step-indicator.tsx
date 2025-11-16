'use client';

import { Check } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  subtitle: string;
}

interface StepIndicatorProps {
  currentStep: number;
  steps: Step[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="mb-10 rounded-2xl border border-border/60 bg-card px-4 py-6 shadow-sm">
      <ol className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {steps.map((step, index) => {
          const isComplete = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <li key={step.id} className="flex flex-1 items-center">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-lg font-semibold transition-all ${
                    isComplete
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isActive
                        ? 'border-primary text-primary'
                        : 'border-border text-muted-foreground'
                  }`}
                >
                  {isComplete ? <Check className="h-6 w-6" /> : step.id}
                </div>
                <div className="text-left">
                  <p
                    className={`text-sm font-semibold ${
                      isComplete || isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.subtitle}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`hidden flex-1 border-t md:ml-4 md:block ${
                    currentStep > step.id ? 'border-primary' : 'border-border/70'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
