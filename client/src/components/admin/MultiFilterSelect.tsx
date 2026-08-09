import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

export interface MultiFilterOption {
  value: string;
  label: string;
}

interface MultiFilterSelectProps {
  label: string;
  options: MultiFilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  /** Shown on the closed button when nothing is selected. */
  emptyLabel?: string;
  className?: string;
  minWidthClassName?: string;
}

export function MultiFilterSelect({
  label,
  options,
  selected,
  onChange,
  emptyLabel = "All",
  className = "",
  minWidthClassName = "min-w-[180px]",
}: MultiFilterSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const summary = () => {
    if (selected.length === 0) return emptyLabel;
    if (selected.length === 1) {
      return options.find((o) => o.value === selected[0])?.label || selected[0];
    }
    return `${selected.length} selected`;
  };

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <label className="label">{label}</label>
      <button
        type="button"
        className={`input-field flex ${minWidthClassName} items-center justify-between gap-2 text-left`}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={selected.length ? "text-zinc-100" : "text-zinc-400"}>{summary()}</span>
        <span className="flex shrink-0 items-center gap-1">
          {selected.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              className="rounded p-0.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              title="Clear"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange([]);
                }
              }}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-zinc-500 transition ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && (
        <div
          id={listId}
          className="absolute z-30 mt-1 max-h-56 w-full min-w-[200px] overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-950 py-1 shadow-xl"
        >
          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-zinc-500">No options</p>
          ) : (
            options.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-zinc-900"
              >
                <input
                  type="checkbox"
                  className="rounded border-zinc-700 text-brand-600 focus:ring-brand-500"
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                />
                <span className="text-sm text-zinc-300">{opt.label}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** True when no filter values are set, or the item matches at least one. */
export function matchesAnyFilter(selected: string[], itemValues: string[]): boolean {
  if (selected.length === 0) return true;
  return selected.some((v) => itemValues.includes(v));
}
