export default function StatsCard({ title, value, icon }) {
  return (
    <div
      className="group relative overflow-hidden rounded-xl p-5 transition-all duration-200 cursor-default bg-[#16191f] border border-[rgba(255,255,255,0.06)] hover:bg-[#1c2028] hover:border-[rgba(255,255,255,0.1)]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#545a65" }}>
            {title}
          </p>
          <p className="text-3xl font-light tracking-tight" style={{ color: "#f0f2f5" }}>
            {value}
          </p>
        </div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{
            background: "rgba(232,168,87,0.08)",
            border: "1px solid rgba(232,168,87,0.15)",
            color: "#e8a857",
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
