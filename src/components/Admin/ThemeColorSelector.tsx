import React, { useState } from 'react';
import { 
  Palette, 
  Check, 
  RefreshCw, 
  Sparkles, 
  Layout, 
  Type, 
  Eye, 
  CheckCircle2 
} from 'lucide-react';
import { AdminSettings } from '../../types/form';

interface ThemeColorSelectorProps {
  settings: AdminSettings;
  onUpdateSettings: (settings: AdminSettings) => void;
}

export interface PresetTheme {
  id: string;
  name: string;
  hex: string;
  bgHex: string;
  category: 'standard' | 'brand' | 'vibrant';
}

export const PRESET_THEMES: PresetTheme[] = [
  { id: 'google_purple', name: 'Google Purple (Classic)', hex: '#673ab7', bgHex: '#f0ebf8', category: 'standard' },
  { id: 'indigo', name: 'Deep Indigo', hex: '#3f51b5', bgHex: '#ebedf8', category: 'standard' },
  { id: 'google_blue', name: 'Google Blue', hex: '#1a73e8', bgHex: '#e8f0fe', category: 'standard' },
  { id: 'teal', name: 'Teal Turquoise', hex: '#009688', bgHex: '#e0f2f1', category: 'standard' },
  { id: 'emerald', name: 'Forest Emerald', hex: '#0f9d58', bgHex: '#e6f4ea', category: 'standard' },
  { id: 'amber', name: 'Golden Amber', hex: '#f4b400', bgHex: '#fef7e0', category: 'brand' },
  { id: 'coral', name: 'Google Red / Coral', hex: '#db4437', bgHex: '#fce8e6', category: 'standard' },
  { id: 'orange', name: 'Vibrant Orange', hex: '#ff5722', bgHex: '#fbe9e7', category: 'brand' },
  { id: 'rose', name: 'Rose Quartz', hex: '#e91e63', bgHex: '#fce4ec', category: 'vibrant' },
  { id: 'violet', name: 'Royal Violet', hex: '#4a148c', bgHex: '#ede7f6', category: 'vibrant' },
  { id: 'cyan', name: 'Sky Cyan', hex: '#00bcd4', bgHex: '#e0f7fa', category: 'vibrant' },
  { id: 'slate', name: 'Charcoal Slate', hex: '#455a64', bgHex: '#eceff1', category: 'standard' },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  } else if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

export function blendWithWhite(hex: string, percentWhite: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#f0ebf8';
  const r = Math.round(rgb.r + (255 - rgb.r) * (percentWhite / 100));
  const g = Math.round(rgb.g + (255 - rgb.g) * (percentWhite / 100));
  const b = Math.round(rgb.b + (255 - rgb.b) * (percentWhite / 100));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export const ThemeColorSelector: React.FC<ThemeColorSelectorProps> = ({
  settings,
  onUpdateSettings
}) => {
  const [selectedHex, setSelectedHex] = useState(settings.themeColor || '#673ab7');
  const [selectedBgHex, setSelectedBgHex] = useState(settings.bgColor || '#f0ebf8');
  const [selectedFont, setSelectedFont] = useState<'sans' | 'roboto' | 'serif' | 'playful'>(
    settings.fontFamily || 'sans'
  );
  const [selectedAccentHeight, setSelectedAccentHeight] = useState<number>(
    settings.headerAccentHeight || 10
  );
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Generate dynamic background options based on current theme color
  const bgOptions = [
    { label: 'Harmonic Pastel Tint', value: blendWithWhite(selectedHex, 93) },
    { label: 'Soft Wash Tint', value: blendWithWhite(selectedHex, 86) },
    { label: 'Subtle Off-White', value: '#f8f9fa' },
    { label: 'Pure White', value: '#ffffff' }
  ];

  const handleSelectPreset = (preset: PresetTheme) => {
    setSelectedHex(preset.hex);
    setSelectedBgHex(preset.bgHex);
  };

  const handleCustomColorChange = (color: string) => {
    setSelectedHex(color);
    // Automatically calculate a matching light pastel background tint
    setSelectedBgHex(blendWithWhite(color, 93));
  };

  const handleApplyTheme = () => {
    const updated: AdminSettings = {
      ...settings,
      themeColor: selectedHex,
      bgColor: selectedBgHex,
      fontFamily: selectedFont,
      headerAccentHeight: selectedAccentHeight
    };
    onUpdateSettings(updated);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  const handleResetToGoogleDefault = () => {
    setSelectedHex('#673ab7');
    setSelectedBgHex('#f0ebf8');
    setSelectedFont('sans');
    setSelectedAccentHeight(10);
    const updated: AdminSettings = {
      ...settings,
      themeColor: '#673ab7',
      bgColor: '#f0ebf8',
      fontFamily: 'sans',
      headerAccentHeight: 10
    };
    onUpdateSettings(updated);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md transition-colors"
              style={{ backgroundColor: selectedHex }}
            >
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Google Form Color Theme & Appearance</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Customizer
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the primary accent color, background tint, and typography applied to the public Google Form.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToGoogleDefault}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Default</span>
            </button>
            <button
              type="button"
              onClick={handleApplyTheme}
              className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 hover:opacity-95"
              style={{ backgroundColor: selectedHex }}
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply Theme</span>
            </button>
          </div>
        </div>

        {savedFeedback && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Theme updated! The public Google Form has been updated with your new color palette.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Theme Controls */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Preset Color Swatches */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Google Forms Color Palette</span>
              </label>
              <span className="text-xs font-mono font-bold" style={{ color: selectedHex }}>
                {selectedHex.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {PRESET_THEMES.map(preset => {
                const isSelected = selectedHex.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`group relative flex flex-col items-center p-2 rounded-xl border transition-all text-center ${
                      isSelected
                        ? 'border-slate-800 dark:border-white shadow-md ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-inner transition-transform group-hover:scale-110"
                      style={{ backgroundColor: preset.hex }}
                    >
                      {isSelected && <Check className="w-5 h-5 drop-shadow-md stroke-[3]" />}
                    </div>
                    <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mt-1.5 line-clamp-1 w-full">
                      {preset.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Hex Color Picker */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Or pick any custom corporate brand color:
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedHex}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white dark:bg-slate-800"
                  title="Choose custom color"
                />
                <input
                  type="text"
                  value={selectedHex}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  placeholder="#673ab7"
                  className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono uppercase text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* 2. Background Color / Tint */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-blue-500" />
                <span>Background Color Tint</span>
              </label>
              <span className="text-xs font-mono font-medium text-slate-500">
                {selectedBgHex.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Google Forms uses matching subtle pastel tints behind form cards. Select your preferred tint:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {bgOptions.map((opt, i) => {
                const isSelected = selectedBgHex.toLowerCase() === opt.value.toLowerCase();
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedBgHex(opt.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-slate-800 dark:border-white shadow-md ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <div 
                      className="w-full h-8 rounded-lg border border-slate-300/60 dark:border-slate-700 mb-2 flex items-center justify-center"
                      style={{ backgroundColor: opt.value }}
                    >
                      {isSelected && <Check className="w-4 h-4 text-slate-800" />}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 block">
                      {opt.label}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      {opt.value}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Typography & Header Stripe Thickness */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-purple-500" />
              <span>Typography & Header Stripe</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Font Family Style
                </label>
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none"
                >
                  <option value="sans">Basic / Google Sans (Clean Sans-Serif)</option>
                  <option value="roboto">Roboto (Technical & Crisp)</option>
                  <option value="serif">Formal (Editorial Serif)</option>
                  <option value="playful">Playful / Casual (Friendly Rounded)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Top Header Accent Stripe
                </label>
                <select
                  value={selectedAccentHeight}
                  onChange={(e) => setSelectedAccentHeight(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none"
                >
                  <option value={10}>Standard Google Forms Stripe (10px)</option>
                  <option value={16}>Medium Accent Bar (16px)</option>
                  <option value={24}>Prominent Banner Bar (24px)</option>
                  <option value={6}>Subtle Minimal Line (6px)</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Real-Time Live Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-500" />
                <span>Live Interactive Form Preview</span>
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Real-Time
              </span>
            </div>

            {/* Simulated Google Form Viewport */}
            <div 
              className="p-4 sm:p-5 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors shadow-inner"
              style={{ backgroundColor: selectedBgHex }}
            >
              <div className="space-y-3 max-w-sm mx-auto">
                
                {/* Form Header Card */}
                <div className="rounded-lg bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-slate-800 shadow-xs overflow-hidden">
                  <div 
                    className="w-full transition-all" 
                    style={{ 
                      backgroundColor: selectedHex, 
                      height: `${selectedAccentHeight}px` 
                    }} 
                  />
                  <div className="p-4">
                    <h3 className={`text-base font-medium text-[#202124] dark:text-slate-100 ${
                      selectedFont === 'serif' ? 'font-serif' : selectedFont === 'roboto' ? 'font-mono' : 'font-sans'
                    }`}>
                      {settings.formTitle || 'Weekly Signage / Artwork Quantity Tracker'}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {settings.formDescription || 'Submit weekly signage counts and vendor proofs.'}
                    </p>
                    <div className="mt-2 text-[10px] font-semibold text-[#d93025]">
                      * Indicates required question
                    </div>
                  </div>
                </div>

                {/* Active Question Card (with theme left border & ring) */}
                <div 
                  className="rounded-lg bg-white dark:bg-[#202124] border transition-all p-4 shadow-xs"
                  style={{
                    borderLeftWidth: '5px',
                    borderLeftColor: selectedHex,
                    borderColor: '#dadce0',
                    boxShadow: `0 0 0 1px ${selectedHex}25`
                  }}
                >
                  <label className="block text-xs font-normal text-[#202124] dark:text-slate-100 mb-1">
                    <span>Vendor Name</span>
                    <span className="text-[#d93025] ml-1 font-bold">*</span>
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      readOnly
                      value="Apex Signcraft Media"
                      className="w-full px-3 py-1.5 rounded border text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
                      style={{ borderColor: selectedHex }}
                    />
                  </div>
                </div>

                {/* Radio selection card */}
                <div className="rounded-lg bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-slate-800 p-4 shadow-xs">
                  <label className="block text-xs font-normal text-[#202124] dark:text-slate-100 mb-2">
                    <span>Artwork Type</span>
                  </label>
                  <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="preview_radio" 
                        defaultChecked 
                        style={{ accentColor: selectedHex }} 
                      />
                      <span>Backlit Board (BL)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="preview_radio" 
                        style={{ accentColor: selectedHex }} 
                      />
                      <span>Frontlit Flex Banner</span>
                    </label>
                  </div>
                </div>

                {/* Submit & Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    className="text-white px-4 py-1.5 rounded text-xs font-medium shadow-xs transition-opacity hover:opacity-90"
                    style={{ backgroundColor: selectedHex }}
                  >
                    Submit
                  </button>
                  <span 
                    className="text-[11px] font-semibold cursor-pointer"
                    style={{ color: selectedHex }}
                  >
                    Clear form
                  </span>
                </div>

              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">Live color code:</span>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: selectedHex }} />
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedHex}</span>
              </div>
            </div>

          </div>

          <button
            type="button"
            onClick={handleApplyTheme}
            className="w-full py-3 rounded-2xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:opacity-95"
            style={{ backgroundColor: selectedHex }}
          >
            <Check className="w-4 h-4" />
            <span>Apply Selected Theme to Form</span>
          </button>
        </div>

      </div>

    </div>
  );
};
