import React from 'react';
import { UserCheck, Layers, FileUp, CheckCircle, ShieldAlert } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

interface ProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
  completedSteps: number[];
}

const STEPS: Step[] = [
  { id: 1, title: 'Requester Info', subtitle: 'Billing & Contact', icon: UserCheck },
  { id: 2, title: 'Print Specs', subtitle: 'Media & Quantity', icon: Layers },
  { id: 3, title: 'Finishing & Files', subtitle: 'Artwork & Delivery', icon: FileUp },
  { id: 4, title: 'Review & Submit', subtitle: 'Pricing & Proof', icon: CheckCircle }
];

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  currentStep,
  onStepClick,
  completedSteps
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8 px-4">
      {/* Progress Bar Line */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 z-0 rounded-full" />
        <div 
          className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 -translate-y-1/2 z-0 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />

        {/* Step Nodes */}
        <div className="relative z-10 flex justify-between items-center">
          {STEPS.map((step) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            const isClickable = onStepClick && (isCompleted || step.id <= currentStep);
            const Icon = step.icon;

            let circleClass = 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500';
            if (isCompleted && !isCurrent) {
              circleClass = 'bg-blue-600 text-white border-2 border-blue-600 shadow-md shadow-blue-500/20';
            } else if (isCurrent) {
              circleClass = 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white border-4 border-blue-100 dark:border-blue-900/60 ring-2 ring-blue-500 shadow-lg';
            }

            return (
              <button
                key={step.id}
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(step.id)}
                className={`flex flex-col items-center group transition-transform ${
                  isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                }`}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${circleClass}`}>
                  {isCompleted && !isCurrent ? (
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
                  )}
                </div>

                <div className="mt-2 text-center hidden sm:block">
                  <span className={`text-xs font-bold block ${
                    isCurrent 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : isCompleted 
                        ? 'text-slate-900 dark:text-white' 
                        : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {step.title}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {step.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
