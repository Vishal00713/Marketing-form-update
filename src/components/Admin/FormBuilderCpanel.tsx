import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  MoveUp, 
  MoveDown, 
  Check, 
  X, 
  Sliders, 
  GitBranch, 
  HelpCircle, 
  Save, 
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  FormFieldConfig, 
  FormFieldType, 
  ConditionalRule, 
  ConditionalOperator, 
  SelectOption 
} from '../../types/form';
import { INITIAL_FORM_FIELDS } from '../../services/storage';

interface FormBuilderCpanelProps {
  fields: FormFieldConfig[];
  onSaveFields: (fields: FormFieldConfig[]) => void;
}

const FIELD_TYPES: { type: FormFieldType; label: string }[] = [
  { type: 'text', label: 'Single-line Text' },
  { type: 'textarea', label: 'Multi-line Text Area' },
  { type: 'select', label: 'Dropdown Select' },
  { type: 'checkbox', label: 'Checkboxes (Multi-select)' },
  { type: 'radio', label: 'Radio Buttons (Single-select)' },
  { type: 'number', label: 'Number Input' },
  { type: 'email', label: 'Email Address' },
  { type: 'tel', label: 'Phone Number' },
  { type: 'date', label: 'Date Picker' }
];

const OPERATORS: { op: ConditionalOperator; label: string }[] = [
  { op: 'equals', label: 'is equal to' },
  { op: 'not_equals', label: 'is NOT equal to' },
  { op: 'contains', label: 'contains value' },
  { op: 'greater_than', label: 'is greater than (>)' },
  { op: 'less_than', label: 'is less than (<)' },
  { op: 'is_checked', label: 'is checked / selected' },
  { op: 'is_not_checked', label: 'is NOT checked' }
];

export const FormBuilderCpanel: React.FC<FormBuilderCpanelProps> = ({
  fields,
  onSaveFields
}) => {
  const [activeStepFilter, setActiveStepFilter] = useState<number | 'all'>('all');
  const [editingField, setEditingField] = useState<FormFieldConfig | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const updated = [...fields];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    onSaveFields(updated);
    showNotification('Field order updated');
  };

  const handleDeleteField = (id: string) => {
    if (confirm('Are you sure you want to delete this form field?')) {
      const updated = fields.filter(f => f.id !== id);
      onSaveFields(updated);
      showNotification('Field deleted successfully');
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all form fields and conditional rules to system default?')) {
      onSaveFields(INITIAL_FORM_FIELDS);
      showNotification('Form fields reset to default');
    }
  };

  const startCreateField = () => {
    const newField: FormFieldConfig = {
      id: `custom_${Date.now()}`,
      label: 'New Question Title',
      type: 'text',
      required: false,
      stepNumber: (activeStepFilter === 'all' ? 1 : activeStepFilter) as 1 | 2 | 3,
      placeholder: 'Enter answer...',
      category: 'custom',
      options: [
        { label: 'Option 1', value: 'opt_1' },
        { label: 'Option 2', value: 'opt_2' }
      ],
      conditionalRules: []
    };
    setEditingField(newField);
    setIsCreatingNew(true);
  };

  const handleSaveEditedField = (updated: FormFieldConfig) => {
    let newFields: FormFieldConfig[];
    if (isCreatingNew) {
      newFields = [...fields, updated];
    } else {
      newFields = fields.map(f => f.id === updated.id ? updated : f);
    }
    onSaveFields(newFields);
    setEditingField(null);
    setIsCreatingNew(false);
    showNotification(`Field "${updated.label}" saved successfully`);
  };

  const filteredFields = fields.filter(f => 
    activeStepFilter === 'all' ? true : f.stepNumber === activeStepFilter
  );

  return (
    <div className="space-y-6">
      
      {/* CPanel Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Form Builder & Conditional Logic Engine</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Customize input types, validation requirements, and dynamic visibility rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={startCreateField}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Field</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Step Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveStepFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeStepFilter === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          All Steps ({fields.length})
        </button>
        <button
          onClick={() => setActiveStepFilter(1)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeStepFilter === 1
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          Step 1: Requester Details ({fields.filter(f => f.stepNumber === 1).length})
        </button>
        <button
          onClick={() => setActiveStepFilter(2)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeStepFilter === 2
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          Step 2: Print Specifications ({fields.filter(f => f.stepNumber === 2).length})
        </button>
        <button
          onClick={() => setActiveStepFilter(3)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeStepFilter === 3
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          Step 3: Finishing & Fulfillment ({fields.filter(f => f.stepNumber === 3).length})
        </button>
      </div>

      {/* Field List Cards */}
      <div className="space-y-3">
        {filteredFields.map((field, index) => {
          const hasRules = field.conditionalRules && field.conditionalRules.length > 0;

          return (
            <div
              key={field.id}
              className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {field.label}
                  </span>
                  {field.required ? (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                      Required
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      Optional
                    </span>
                  )}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                    Type: {field.type}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Step {field.stepNumber}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono text-[11px] text-slate-400">ID: {field.id}</span>
                  {field.placeholder && (
                    <span className="truncate max-w-[200px]">Placeholder: "{field.placeholder}"</span>
                  )}
                </div>

                {/* Conditional Rules Tag */}
                {hasRules && (
                  <div className="pt-1 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-900 w-fit">
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>
                      Conditional: Shows when <strong>{field.conditionalRules![0].fieldId}</strong> {field.conditionalRules![0].operator.replace('_', ' ')} "{String(field.conditionalRules![0].value)}"
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => handleMoveField(index, 'up')}
                  disabled={index === 0}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                  title="Move Up"
                >
                  <MoveUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMoveField(index, 'down')}
                  disabled={index === fields.length - 1}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                  title="Move Down"
                >
                  <MoveDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingField(field);
                    setIsCreatingNew(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-750 flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Configure</span>
                </button>
                <button
                  onClick={() => handleDeleteField(field.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Delete field"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Field Editor Modal */}
      {editingField && (
        <FieldEditorModal
          field={editingField}
          allFields={fields}
          isNew={isCreatingNew}
          onClose={() => setEditingField(null)}
          onSave={handleSaveEditedField}
        />
      )}

    </div>
  );
};

// ================= Field Editor Modal Component =================
interface FieldEditorModalProps {
  field: FormFieldConfig;
  allFields: FormFieldConfig[];
  isNew: boolean;
  onClose: () => void;
  onSave: (field: FormFieldConfig) => void;
}

const FieldEditorModal: React.FC<FieldEditorModalProps> = ({
  field,
  allFields,
  isNew,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<FormFieldConfig>({
    ...field,
    options: field.options || [],
    conditionalRules: field.conditionalRules || []
  });

  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionValue, setNewOptionValue] = useState('');

  const handleAddOption = () => {
    if (!newOptionLabel.trim()) return;
    const value = newOptionValue.trim() || newOptionLabel.trim();
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), { label: newOptionLabel.trim(), value }]
    }));
    setNewOptionLabel('');
    setNewOptionValue('');
  };

  const handleRemoveOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: (prev.options || []).filter((_, i) => i !== index)
    }));
  };

  const handleAddConditionalRule = () => {
    const availableTargets = allFields.filter(f => f.id !== formData.id);
    if (availableTargets.length === 0) return;

    const newRule: ConditionalRule = {
      fieldId: availableTargets[0].id,
      operator: 'equals',
      value: ''
    };

    setFormData(prev => ({
      ...prev,
      conditionalRules: [...(prev.conditionalRules || []), newRule]
    }));
  };

  const handleUpdateRule = (index: number, key: keyof ConditionalRule, val: any) => {
    setFormData(prev => {
      const updatedRules = [...(prev.conditionalRules || [])];
      updatedRules[index] = { ...updatedRules[index], [key]: val };
      return { ...prev, conditionalRules: updatedRules };
    });
  };

  const handleRemoveRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditionalRules: (prev.conditionalRules || []).filter((_, i) => i !== index)
    }));
  };

  const requiresOptions = ['select', 'radio', 'checkbox'].includes(formData.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isNew ? 'Create New Form Field' : `Configure: ${formData.label}`}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-900 dark:text-white mb-1">
                Field Label / Question <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-900 dark:text-white mb-1">
                Internal Field ID (Variable Key) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-900 dark:text-white mb-1">
                Input Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as FormFieldType })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white"
              >
                {FIELD_TYPES.map(t => (
                  <option key={t.type} value={t.type}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-900 dark:text-white mb-1">
                Form Wizard Step
              </label>
              <select
                value={formData.stepNumber}
                onChange={(e) => setFormData({ ...formData, stepNumber: Number(e.target.value) as 1 | 2 | 3 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white"
              >
                <option value={1}>Step 1: Requester & Billing</option>
                <option value={2}>Step 2: Print Specifications</option>
                <option value={3}>Step 3: Finishing & Delivery</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 dark:text-white">
                <input
                  type="checkbox"
                  checked={formData.required}
                  onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                  className="rounded text-indigo-600 h-4 w-4"
                />
                <span>Mandatory / Required</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-900 dark:text-white mb-1">
              Placeholder / Hint Text
            </label>
            <input
              type="text"
              value={formData.placeholder || ''}
              onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white"
              placeholder="e.g. Enter details..."
            />
          </div>

          {/* Options Manager for Select / Radio / Checkbox */}
          {requiresOptions && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
              <label className="block font-bold text-slate-900 dark:text-white">
                Input Options ({formData.options?.length || 0})
              </label>

              <div className="space-y-2">
                {formData.options?.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-slate-900 dark:text-white flex-1">{opt.label}</span>
                    <span className="font-mono text-slate-400 text-xs">{opt.value}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(i)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Option display label"
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                />
                <input
                  type="text"
                  placeholder="Stored value (optional)"
                  value={newOptionValue}
                  onChange={(e) => setNewOptionValue(e.target.value)}
                  className="w-36 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-xl text-xs"
                >
                  Add Option
                </button>
              </div>
            </div>
          )}

          {/* Conditional Visibility Logic Builder */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-900 dark:text-amber-200 block flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-amber-600" />
                  <span>Conditional Visibility Rules</span>
                </span>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Decide whether to show this field based on previous user answers.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddConditionalRule}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rule</span>
              </button>
            </div>

            {formData.conditionalRules && formData.conditionalRules.length > 0 ? (
              <div className="space-y-3 pt-2">
                {formData.conditionalRules.map((rule, idx) => (
                  <div key={idx} className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Show only IF:</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(idx)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={rule.fieldId}
                        onChange={(e) => handleUpdateRule(idx, 'fieldId', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                      >
                        {allFields.filter(f => f.id !== formData.id).map(f => (
                          <option key={f.id} value={f.id}>{f.label} ({f.id})</option>
                        ))}
                      </select>

                      <select
                        value={rule.operator}
                        onChange={(e) => handleUpdateRule(idx, 'operator', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                      >
                        {OPERATORS.map(op => (
                          <option key={op.op} value={op.op}>{op.label}</option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="Expected value (e.g. shipping)"
                        value={String(rule.value)}
                        onChange={(e) => handleUpdateRule(idx, 'value', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80 italic">
                No conditional rules defined. This field will always be visible in Step {formData.stepNumber}.
              </p>
            )}
          </div>

        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(formData)}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Field Configuration</span>
          </button>
        </div>

      </div>
    </div>
  );
};
