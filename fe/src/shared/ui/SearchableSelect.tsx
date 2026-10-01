"use client";

import { useEffect, useRef, useState } from "react";

type Props<T, V extends string | number> = {
  options: T[];
  value: V | undefined;
  onChange: (value: V | undefined) => void;
  getLabel: (option: T) => string;
  getValue: (option: T) => V;
  placeholder?: string;
  className?: string;
};

export function SearchableSelect<T, V extends string | number>({
  options,
  value,
  onChange,
  getLabel,
  getValue,
  placeholder = "Tất cả",
  className = "",
}: Props<T, V>) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => getValue(option) === value);

  // Đồng bộ ô hiển thị khi giá trị chọn bị đổi từ bên ngoài (VD nút "Xóa lọc").
  useEffect(() => {
    setQuery(selected ? getLabel(selected) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(selected ? getLabel(selected) : "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const filtered = query.trim()
    ? options.filter((option) => getLabel(option).toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  function handleSelect(option: T | null) {
    if (option) {
      onChange(getValue(option));
      setQuery(getLabel(option));
    } else {
      onChange(undefined);
      setQuery("");
    }
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && filtered.length > 0) {
            e.preventDefault();
            handleSelect(filtered[0]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
      />

      {open && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="block w-full px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
          >
            {placeholder}
          </button>
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400">Không tìm thấy</div>
          ) : (
            filtered.map((option) => {
              const optionValue = getValue(option);
              return (
                <button
                  key={optionValue}
                  type="button"
                  onClick={() => handleSelect(option)}
                  title={getLabel(option)}
                  className={`block w-full truncate px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                    optionValue === value ? "bg-blue-50 font-medium text-blue-600" : "text-slate-700"
                  }`}
                >
                  {getLabel(option)}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
