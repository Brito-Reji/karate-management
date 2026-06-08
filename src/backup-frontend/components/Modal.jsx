"use client";

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* sheet */}
      <div
        className="relative mx-4 w-full animate-fade-up"
        style={{
          maxWidth: "400px",
          background: "#16191f",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "14px",
          padding: "1.5rem",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-semibold" style={{ color: "#f0f2f5" }}>{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150 cursor-pointer bg-transparent text-[#545a65] hover:text-[#8b919e] hover:bg-[rgba(255,255,255,0.05)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
