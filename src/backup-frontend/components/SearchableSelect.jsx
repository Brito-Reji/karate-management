"use client";

import { useState, useRef, useEffect } from "react";

const fieldStyle = {
  width: "100%",
  padding: "9px 12px",
  background: "#1c2028",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "8px",
  color: "#c9cfdb",
  fontSize: "13px",
  outline: "none",
  transition: "border-color 0.15s",
};

export default function SearchableSelect({ options, value, onChange, placeholder, required }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between cursor-pointer transition-colors ${isOpen ? 'border-[rgba(232,168,87,0.4)]' : 'hover:border-[rgba(255,255,255,0.12)]'}`}
        style={{...fieldStyle, borderColor: isOpen ? 'rgba(232,168,87,0.4)' : undefined}}
      >
        <span className="truncate pr-2" style={{ color: selectedOption ? "#c9cfdb" : "#545a65" }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0" style={{ color: "#545a65" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </div>

      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-2 rounded-lg overflow-hidden animate-fade-up shadow-xl"
          style={{ background: "#1c2028", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)" }}
        >
          <div className="p-2 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            <input 
              type="text" 
              className="w-full bg-[#16191f] text-[13px] text-[#c9cfdb] px-3 py-2 rounded-md outline-none border border-[rgba(255,255,255,0.04)] focus:border-[rgba(232,168,87,0.3)] placeholder:text-[#545a65] transition-colors"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`px-4 py-2.5 text-[13px] cursor-pointer transition-colors ${
                    value === opt.value 
                      ? "bg-[rgba(232,168,87,0.1)] text-[#e8a857]" 
                      : "text-[#c9cfdb] hover:bg-[rgba(255,255,255,0.03)]"
                  }`}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="px-4 py-4 text-[12px] text-center" style={{ color: "#545a65" }}>
                No matches found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden input to hook into HTML5 native form validation */}
      {required && (
        <input 
          type="text" 
          required 
          value={value || ""} 
          onChange={() => {}} 
          className="absolute inset-0 opacity-0 -z-10 pointer-events-none" 
        />
      )}
    </div>
  );
}
