"use client";

import { useState, useEffect } from "react";
import StatsCard from "@/components/StatsCard";
import BeltBadge from "@/components/BeltBadge";
import Link from "next/link";
import { BELTS } from "@/lib/constants";

// skeleton loader
function Skeleton({ className }) {
  return <div className={`skeleton ${className}`} />;
}

// section heading
function SectionHeading({ children }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "#545a65" }}>
      {children}
    </h2>
  );
}

// card wrapper
const card = {
  background: "#16191f",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "12px",
  padding: "1.5rem",
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <Skeleton className="h-7 w-48 mb-1.5" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-60" />
          <Skeleton className="h-60" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "#f0f2f5" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "#545a65" }}>
            {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link
          href="/students/new"
          className="text-[13px] font-medium px-4 py-2 rounded-lg transition-all duration-150 bg-[rgba(232,168,87,0.1)] border border-[rgba(232,168,87,0.2)] text-[#e8a857] hover:bg-[rgba(232,168,87,0.16)]"
        >
          + New Student
        </Link>
      </div>

      {/* stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Total Students"
          value={data?.totalStudents ?? 0}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[17px] h-[17px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          }
        />
        <StatsCard
          title="Dojo Locations"
          value={data?.totalDojos ?? 0}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[17px] h-[17px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          }
        />
        <StatsCard
          title="Belt Ranks"
          value={data?.beltDistribution?.length ?? 0}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[17px] h-[17px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
          }
        />
      </div>

      {/* grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* belt distribution */}
        <div style={card}>
          <SectionHeading>Belt Distribution</SectionHeading>
          <div className="space-y-3.5">
            {data?.beltDistribution?.map((item) => {
              const beltData = BELTS.find((b) => b.name === item._id);
              const maxCount = Math.max(...(data.beltDistribution?.map((i) => i.count) || [1]));
              const percent = (item.count / maxCount) * 100;
              return (
                <div key={item._id} className="flex items-center gap-3">
                  <div className="w-24 shrink-0">
                    <BeltBadge belt={item._id} size="sm" />
                  </div>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: beltData?.color === "#000000" ? "#374151" : beltData?.color || "#888",
                        opacity: 0.75,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium w-5 text-right shrink-0" style={{ color: "#545a65" }}>
                    {item.count}
                  </span>
                </div>
              );
            })}
            {(!data?.beltDistribution || data.beltDistribution.length === 0) && (
              <p className="text-sm py-6 text-center" style={{ color: "#545a65" }}>No data yet</p>
            )}
          </div>
        </div>

        {/* recent registrations */}
        <div style={card}>
          <div className="flex items-center justify-between mb-4">
            <SectionHeading>Recent Registrations</SectionHeading>
            <Link
              href="/students"
              className="text-[11px] font-semibold uppercase tracking-wider transition-colors"
              style={{ color: "#e8a857" }}
            >
              View all
            </Link>
          </div>
          <div className="space-y-1">
            {data?.recentStudents?.map((student) => (
              <Link
                key={student._id}
                href={`/students/${student._id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-all duration-150 hover:bg-[rgba(255,255,255,0.03)]"
                style={{ color: "inherit" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{ background: "#1c2028", color: "#8b919e" }}
                >
                  {student.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate" style={{ color: "#c9cfdb" }}>
                    {student.name}
                  </p>
                  <p className="text-[11px]" style={{ color: "#545a65" }}>
                    {student.dojoLocation?.name || "—"}
                  </p>
                </div>
                <BeltBadge belt={student.currentBelt} size="sm" />
              </Link>
            ))}
            {(!data?.recentStudents || data.recentStudents.length === 0) && (
              <p className="text-sm py-6 text-center" style={{ color: "#545a65" }}>No students yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
