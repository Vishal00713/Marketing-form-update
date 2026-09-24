import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { FormFieldConfig } from '../../types/form';

interface DynamicFieldProps {
  field: FormFieldConfig;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export const DynamicField: React.FC<DynamicFieldProps> = ({
  field,
  value,
  onChange,
  error
}) => {
  const fieldId = `field-${field.id}`;

  const renderInput = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={fieldId}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-400 dark:border-red-500/80 bg-red-50/20 focus:ring-red-500'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500/30'
            }`}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : undefined}
          />
        );

      case 'select':
        return (
          <div className="relative">
            <select
              id={fieldId}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 appearance-none bg-no-repeat bg-[right_14px_center] pr-10 ${
                error
                  ? 'border-red-400 dark:border-red-500/80 bg-red-50/20 focus:ring-red-500'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500/30'
              }`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundSize: '1.25rem 1.25rem'
              }}
              aria-invalid={!!error}
            >
              <option value="" disabled>-- Select an option --</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} {opt.priceModifier ? `(+$${opt.priceModifier.toFixed(2)})` : ''}
                </option>
              ))}
            </select>
          </div>
        );

      case 'radio':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {field.options?.map((opt) => {
              const isChecked = value === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name={field.id}
                    value={opt.value}
                    checked={isChecked}
                    onChange={() => onChange(opt.value)}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <div className="text-xs">
                    <span className="font-semibold block">{opt.label}</span>
                    {opt.description && (
                      <span className="text-slate-500 dark:text-slate-400 block mt-0.5">{opt.description}</span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        );

      case 'checkbox':
        const checkedList = Array.isArray(value) ? value : (value ? [value] : []);
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {field.options?.map((opt) => {
              const isChecked = checkedList.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    value={opt.value}
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChange([...checkedList, opt.value]);
                      } else {
                        onChange(checkedList.filter((v: string) => v !== opt.value));
                      }
                    }}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-xs font-semibold">{opt.label}</span>
                </label>
              );
            })}
          </div>
        );

      case 'date':
        return (
          <input
            id={fieldId}
            type="date"
            value={value || ''}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-400 dark:border-red-500/80 bg-red-50/20 focus:ring-red-500'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500/30'
            }`}
            aria-invalid={!!error}
          />
        );

      default:
        // text, email, tel, number
        return (
          <input
            id={fieldId}
            type={field.type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-400 dark:border-red-500/80 bg-red-50/20 focus:ring-red-500'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500/30'
            }`}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : undefined}
          />
        );
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={fieldId} className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        {field.category && (
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            {field.category}
          </span>
        )}
      </div>

      {field.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {field.description}
        </p>
      )}

      {renderInput()}

      {field.helpText && !error && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 shrink-0" />
          <span>{field.helpText}</span>
        </p>
      )}

      {error && (
        <p id={`${fieldId}-error`} className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
