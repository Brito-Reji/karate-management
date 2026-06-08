import { BELTS } from "@/lib/constants";

export default function BeltBadge({ belt, size = "sm" }) {
  const beltData = BELTS.find((b) => b.name === belt);
  const color = beltData?.color || "#888";
  const isWhite = belt === "White";
  const isDark = ["Black", "Brown", "Brown 1st", "Brown 2nd"].includes(belt) ||
    belt?.includes("Dan");

  const sizeClasses = {
    sm: "text-xs px-2.5 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${color}20`,
        color: isWhite ? "#64748b" : isDark ? "#e2e8f0" : color,
        border: `1px solid ${isWhite ? "#e2e8f0" : color}40`,
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color, border: isWhite ? "1px solid #cbd5e1" : "none" }}
      />
      {belt}
    </span>
  );
}
