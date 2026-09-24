import React, { useState, useEffect } from 'react';
import { Minus, Plus, Sparkles, Tag, TrendingDown } from 'lucide-react';

interface QuantitySelectorProps {
  value: number;
  onChange: (quantity: number) => void;
  baseUnitCost?: number;
}

const PRESET_QUANTITIES = [25, 50, 100, 250, 500, 1000, 2500];

export function getVolumeDiscountTier(qty: number): { percent: number; label: string } {
  if (qty >= 1000) return { percent: 35, label: '35% Bulk Volume Discount' };
  if (qty >= 500) return { percent: 25, label: '25% Volume Discount' };
  if (qty >= 250) return { percent: 15, label: '15% Volume Discount' };
  if (qty >= 100) return { percent: 10, label: '10% Tier Discount' };
  return { percent: 0, label: 'Standard Rate' };
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChange,
  baseUnitCost = 0.25
}) => {
  const [customInput, setCustomInput] = useState<string>(String(value || 100));
  const [isCustomMode, setIsCustomMode] = useState<boolean>(!PRESET_QUANTITIES.includes(value));

  useEffect(() => {
    setCustomInput(String(value));
    setIsCustomMode(!PRESET_QUANTITIES.includes(value));
  }, [value]);

  const handlePresetClick = (qty: number) => {
    setIsCustomMode(false);
    setCustomInput(String(qty));
    onChange(qty);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCustomInput(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(Math.min(parsed, 100000));
    }
  };

  const adjustQuantity = (delta: number) => {
    const next = Math.max(1, (value || 0) + delta);
    setCustomInput(String(next));
    onChange(next);
  };

  const discount = getVolumeDiscountTier(value);
  const discountedUnitCost = baseUnitCost * (1 - discount.percent / 100);
  const estTotal = value * discountedUnitCost;

  return (
    <div className="bg-slate-50 dark:bg-slate-850 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-bold text-slate-900 dark:text-white">
            Print Quantity Selection <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Choose a standard run or enter custom quantity. Tier discounts apply automatically.
          </p>
        </div>

        {discount.percent > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800 animate-pulse">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{discount.label}</span>
          </div>
        )}
      </div>

      {/* Preset Quantity Pills */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {PRESET_QUANTITIES.map((qty) => {
          const isSelected = !isCustomMode && value === qty;
          const tier = getVolumeDiscountTier(qty);

          return (
            <button
              key={qty}
              type="button"
              onClick={() => handlePresetClick(qty)}
              className={`relative py-2.5 px-2 rounded-xl text-center text-xs font-semibold transition-all border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 ring-2 ring-blue-400 dark:ring-blue-500'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-750'
              }`}
            >
              <div className="font-bold text-sm sm:text-base">{qty.toLocaleString()}</div>
              {tier.percent > 0 && (
                <div className={`text-[10px] font-medium mt-0.5 ${isSelected ? 'text-blue-100' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  -{tier.percent}%
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Quantity Stepper & Direct Input */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
            Custom Amount:
          </span>
          <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => adjustQuantity(-10)}
              className="px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
              title="Decrease 10 copies"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              min="1"
              max="100000"
              value={customInput}
              onChange={handleCustomChange}
              onFocus={() => setIsCustomMode(true)}
              className="w-24 text-center font-bold text-slate-900 dark:text-white py-1.5 focus:outline-none bg-transparent text-sm"
              placeholder="Qty"
            />
            <button
              type="button"
              onClick={() => adjustQuantity(10)}
              className="px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
              title="Increase 10 copies"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">units</span>
        </div>

        {/* Live Subtotal Badge */}
        <div className="flex items-center justify-between sm:justify-end gap-3 bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Est. Base Total</div>
            <div className="text-sm sm:text-base font-extrabold text-blue-600 dark:text-blue-400">
              ${estTotal.toFixed(2)}
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-3">
            <div>${discountedUnitCost.toFixed(3)} / ea</div>
            {discount.percent > 0 && (
              <div className="text-emerald-600 dark:text-emerald-400 font-semibold line-through opacity-70">
                ${baseUnitCost.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
