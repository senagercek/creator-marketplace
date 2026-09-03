"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  minDate?: string;
  error?: string;
  className?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker({
  value,
  onChange,
  label,
  minDate,
  error,
  className = "",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial selected date or default to today
  const selectedDate = value ? new Date(value + "T00:00:00") : null;

  const [viewYear, setViewYear] = useState(() =>
    selectedDate ? selectedDate.getFullYear() : new Date().getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(() =>
    selectedDate ? selectedDate.getMonth() : new Date().getMonth()
  );

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Generate calendar grid days
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const days = [];

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    days.push({
      day: daysInPrevMonth - i,
      month: viewMonth - 1,
      year: viewMonth === 0 ? viewYear - 1 : viewYear,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    days.push({
      day: i,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true,
    });
  }

  // Next month leading days (to fill 35 or 42 cells)
  const remainingCells = 42 - days.length >= 7 ? 35 - days.length : 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      day: i,
      month: viewMonth + 1,
      year: viewMonth === 11 ? viewYear + 1 : viewYear,
      isCurrentMonth: false,
    });
  }

  const handleSelect = (y: number, m: number, d: number) => {
    const formatted = `${y}-${String(m + 1).padStart(2, "0")}-${String(
      d
    ).padStart(2, "0")}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const formatDisplay = (val?: string) => {
    if (!val) return "Select date...";
    const dateObj = new Date(val + "T00:00:00");
    if (isNaN(dateObj.getTime())) return val;
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isToday = (y: number, m: number, d: number) => {
    const today = new Date();
    return (
      today.getFullYear() === y &&
      today.getMonth() === m &&
      today.getDate() === d
    );
  };

  const isSelected = (y: number, m: number, d: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === y &&
      selectedDate.getMonth() === m &&
      selectedDate.getDate() === d
    );
  };

  const isBeforeMin = (y: number, m: number, d: number) => {
    if (!minDate) return false;
    const minObj = new Date(minDate + "T00:00:00");
    const currentObj = new Date(y, m, d);
    return currentObj < minObj;
  };

  return (
    <div className={`relative space-y-1 ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 block">
          {label}
        </label>
      )}

      {/* Input Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-left shadow-2xs transition-all cursor-pointer ${
          error
            ? "border-rose-300 ring-1 ring-rose-300 text-rose-900"
            : isOpen
            ? "border-slate-900 ring-1 ring-slate-900 text-slate-900"
            : "border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50/50"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="h-4 w-4 text-slate-500 shrink-0" />
          <span className={value ? "font-medium" : "text-slate-400"}>
            {formatDisplay(value)}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0">
          {value ? value : "YYYY-MM-DD"}
        </span>
      </button>

      {error && <p className="text-[11px] text-rose-600">{error}</p>}

      {/* Calendar Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 z-50 mt-1 w-full max-w-[320px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95">
          {/* Header (Month & Year) */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels (English) */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_NAMES.map((wd) => (
              <span
                key={wd}
                className="text-[10px] font-bold text-slate-400 uppercase"
              >
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {days.map((item, index) => {
              const selected = isSelected(item.year, item.month, item.day);
              const today = isToday(item.year, item.month, item.day);
              const disabled = isBeforeMin(item.year, item.month, item.day);

              return (
                <button
                  key={index}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    handleSelect(item.year, item.month, item.day)
                  }
                  className={`h-7 w-7 sm:h-8 sm:w-8 mx-auto flex items-center justify-center rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    disabled
                      ? "opacity-30 cursor-not-allowed text-slate-400"
                      : selected
                      ? "bg-slate-900 text-white font-bold shadow-xs"
                      : today
                      ? "border border-slate-900 text-slate-900 font-semibold hover:bg-slate-100"
                      : item.isCurrentMonth
                      ? "text-slate-700 hover:bg-slate-100"
                      : "text-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Actions */}
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-[11px]">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                handleSelect(now.getFullYear(), now.getMonth(), now.getDate());
              }}
              className="font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
