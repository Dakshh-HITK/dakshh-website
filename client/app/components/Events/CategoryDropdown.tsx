"use client";

import { useRef, useEffect, useState } from "react";

const CATEGORIES = ["All", "Software", "Hardware", "Entrepreneurship", "Quiz", "Gaming", "Design and Prototyping"] as const;
export type Category = (typeof CATEGORIES)[number];

type Props = {
  value: Category;
  onChange: (value: Category) => void;
};

export default function CategoryDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue = value === "All" ? "All Categories" : value;

  return (
    <div ref={ref} className="relative w-full sm:w-55">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-open={open}
        className="hand-drawn-dropdown-trigger w-full text-left flex items-center justify-between gap-2"
      >
        <span>{displayValue}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path fill="#00FFFF" d="M6 8L2 4h8z" />
        </svg>
      </button>

      {open && (
        <div className="hand-drawn-dropdown absolute top-full left-0 right-0 mt-2 z-50">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                onChange(cat);
                setOpen(false);
              }}
              className={`hand-drawn-dropdown-option w-full text-left px-4 py-2.5 text-sm first:rounded-t-[11px] last:rounded-b-[11px] ${
                value === cat ? "hand-drawn-dropdown-option-selected" : ""
              }`}
            >
              {cat === "All" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
