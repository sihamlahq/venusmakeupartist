"use client";

import type { DateRange, DateRangePreset } from "@/lib/date-range";
import { formatRangeLabel } from "@/lib/date-range";

type Props = {
  range: DateRange;
  customFrom: string;
  customTo: string;
  onPresetChange: (preset: DateRangePreset) => void;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
};

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "past-2-days", label: "Past 2 days" },
  { value: "past-week", label: "Past week" },
  { value: "this-month", label: "This month" },
  { value: "custom", label: "Custom range" },
];

export function SalesDateFilter({
  range,
  customFrom,
  customTo,
  onPresetChange,
  onCustomFromChange,
  onCustomToChange,
}: Props) {
  return (
    <div className="rounded-3xl border border-rose-100 bg-white/80 p-4 shadow-sm sm:p-4">
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-rose-950">Date range</p>
          <p className="mt-1 break-words text-sm text-rose-800/70">{formatRangeLabel(range)}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onPresetChange(preset.value)}
              className={`min-h-11 rounded-full px-3 py-2.5 text-sm leading-snug transition ${
                range.preset === preset.value
                  ? "bg-rose-900 text-white"
                  : "border border-rose-200 text-rose-900 hover:bg-rose-50"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {range.preset === "custom" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-2 block font-medium text-rose-950">From</span>
            <input
              type="date"
              value={customFrom}
              onChange={(event) => onCustomFromChange(event.target.value)}
              className="w-full min-h-11 rounded-xl border border-rose-200 px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-rose-300 sm:text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-2 block font-medium text-rose-950">To</span>
            <input
              type="date"
              value={customTo}
              onChange={(event) => onCustomToChange(event.target.value)}
              className="w-full min-h-11 rounded-xl border border-rose-200 px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-rose-300 sm:text-sm"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
