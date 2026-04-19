"use client";
import React from "react";

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
  suffix?: string;
  className?: string;
}

export function Field({ label, hint, children, suffix, className = "" }: FieldProps) {
  return (
    <div className={className}>
      <label className="label-base block">{label}</label>
      <div className="relative flex items-center">
        {children}
        {suffix && (
          <span className="absolute right-3 text-sm text-slate-400 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

interface NumInputProps {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
  placeholder?: string;
}

export function NumInput({
  value,
  onChange,
  step,
  min,
  max,
  className = "",
  placeholder,
}: NumInputProps) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        onChange(Number.isFinite(v) ? v : 0);
      }}
      step={step}
      min={min}
      max={max}
      placeholder={placeholder}
      className={`input-base ${className}`}
    />
  );
}

interface SelectInputProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}

export function SelectInput<T extends string>({
  value,
  onChange,
  options,
  className = "",
}: SelectInputProps<T>) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={`input-base ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input-base"
    />
  );
}
