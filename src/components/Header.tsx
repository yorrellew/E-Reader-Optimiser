import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, HelpCircle, HardDrive, Smartphone, MonitorSmartphone, ChevronDown } from 'lucide-react';
import { EinkPreset } from '../types';
import { EINK_DEVICE_PRESETS, EINK_BRANDS, getPresetsByBrand } from '../utils/presets';

interface HeaderProps {
  currentPreset: EinkPreset;
  onSelectPreset: (preset: EinkPreset) => void;
  onOpenGuide: () => void;
  onLoadSample: () => void;
  documentCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPreset,
  onSelectPreset,
  onOpenGuide,
  onLoadSample,
  documentCount,
}) => {
  const [selectedBrand, setSelectedBrand] = useState<string>(currentPreset.brand || 'all');

  // Keep selected brand in sync if preset changes externally
  useEffect(() => {
    if (currentPreset?.brand) {
      setSelectedBrand(currentPreset.brand);
    }
  }, [currentPreset]);

  // Filter device models for the selected brand
  const availableModels = selectedBrand === 'all' 
    ? EINK_DEVICE_PRESETS 
    : EINK_DEVICE_PRESETS.filter((p) => p.brand.toLowerCase() === selectedBrand.toLowerCase());

  const handleBrandChange = (newBrand: string) => {
    setSelectedBrand(newBrand);
    const brandPresets = getPresetsByBrand(newBrand);
    if (brandPresets.length > 0) {
      // If current preset isn't in this brand, switch to first model of brand
      const exists = brandPresets.some((p) => p.id === currentPreset.id);
      if (!exists) {
        onSelectPreset(brandPresets[0]);
      }
    }
  };

  const handleModelChange = (modelId: string) => {
    const found = EINK_DEVICE_PRESETS.find((p) => p.id === modelId);
    if (found) {
      onSelectPreset(found);
      setSelectedBrand(found.brand);
    }
  };

  return (
    <header className="border-b border-white/10 bg-[#111114]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo & Identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white font-sans">
                  E-Reader Cover & Metadata Studio
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Universal & E-Ink
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-serif">
                EPUB & PDF Cover Fixer, Title Formatter & E-Ink Optimizer
              </p>
            </div>
          </div>

          {/* Quick Info & Help on Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenGuide}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
              title="E-Reader Cover Guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Device Profile & Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Target E-Reader Selector: Brand + Model/Device (Focused element) */}
          <div className="flex items-center gap-2 bg-[#16161a] border border-white/10 rounded-xl px-2.5 py-1.5 shadow-2xs text-xs">
            <MonitorSmartphone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            
            {/* 1. Select by Brand */}
            <div className="flex items-center gap-1">
              <label htmlFor="header-brand-select" className="text-zinc-400 text-[11px] font-medium hidden sm:inline">
                Brand:
              </label>
              <select
                id="header-brand-select"
                value={selectedBrand}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="bg-[#111114] border border-white/10 rounded-lg px-2 py-1 font-semibold text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs"
              >
                {EINK_BRANDS.map((brand) => (
                  <option key={brand.id} value={brand.id} className="bg-[#16161a] text-zinc-200">
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-zinc-600 hidden sm:inline">/</span>

            {/* 2. Select by Model/Device */}
            <div className="flex items-center gap-1">
              <label htmlFor="header-model-select" className="text-zinc-400 text-[11px] font-medium hidden sm:inline">
                Device:
              </label>
              <select
                id="header-model-select"
                value={currentPreset.id}
                onChange={(e) => handleModelChange(e.target.value)}
                className="bg-[#111114] border border-white/10 rounded-lg px-2 py-1 font-semibold text-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs max-w-[180px] sm:max-w-[220px] truncate"
              >
                {availableModels.map((preset) => (
                  <option key={preset.id} value={preset.id} className="bg-[#16161a] text-zinc-200">
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Load Sample Book Button */}
          {documentCount === 0 && (
            <button
              onClick={onLoadSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#16161a] hover:bg-[#202026] text-zinc-200 border border-white/10 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Sample EPUB</span>
            </button>
          )}

          {/* E-Reader Guide Modal Trigger */}
          <button
            onClick={onOpenGuide}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-zinc-400" />
            <span>E-Reader Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
