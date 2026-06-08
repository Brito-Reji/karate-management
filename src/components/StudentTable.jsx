"use client";

import Link from "next/link";
import BeltBadge from "./BeltBadge";

const thStyle = {
  padding: "10px 16px",
  textAlign: "left",
  fontSize: "10px",
  fontWeight: "600",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#3d4249",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px 16px",
  fontSize: "13px",
  color: "#8b919e",
  borderBottom: "1px solid rgba(255,255,255,0.04)",
  verticalAlign: "middle",
};

export default function StudentTable({ students }) {
  if (!students?.length) {
    return (
      <div
        className="text-center py-20"
        style={{
          background: "#16191f",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
        }}
      >
        <p className="text-3xl mb-3">🥋</p>
        <p className="text-sm font-medium mb-4" style={{ color: "#545a65" }}>No students registered</p>
        <Link
          href="/students/new"
          className="inline-block text-[13px] font-medium px-4 py-2 rounded-lg transition-all duration-150"
          style={{
            background: "rgba(232,168,87,0.08)",
            border: "1px solid rgba(232,168,87,0.2)",
            color: "#e8a857",
          }}
        >
          Add first student
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#16191f",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: "#13161c" }}>
              <th style={thStyle}>Student</th>
              <th style={thStyle}>Phone</th>
              <th style={thStyle}>Belt</th>
              <th style={thStyle}>Dojo</th>
              <th style={thStyle}>Last Test</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => (
              <tr
                key={student._id}
                className="group bg-transparent transition-colors duration-150 hover:bg-[rgba(255,255,255,0.018)]"
              >
                {/* name */}
                <td style={{ ...tdStyle, borderBottom: idx === students.length - 1 ? "none" : tdStyle.borderBottom }}>
                  <Link href={`/students/${student._id}`} className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-semibold shrink-0"
                      style={{ background: "#1c2028", color: "#545a65" }}
                    >
                      {student.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="font-medium transition-colors duration-100 text-[#c9cfdb] hover:text-[#e8a857]">
                      {student.name}
                    </span>
                  </Link>
                </td>

                <td style={{ ...tdStyle, borderBottom: idx === students.length - 1 ? "none" : tdStyle.borderBottom }}>
                  {student.phone}
                </td>

                <td style={{ ...tdStyle, borderBottom: idx === students.length - 1 ? "none" : tdStyle.borderBottom }}>
                  <BeltBadge belt={student.currentBelt} />
                </td>

                <td style={{ ...tdStyle, borderBottom: idx === students.length - 1 ? "none" : tdStyle.borderBottom }}>
                  {student.dojoLocation?.name || "—"}
                </td>

                <td style={{ ...tdStyle, borderBottom: idx === students.length - 1 ? "none" : tdStyle.borderBottom }}>
                  {student.dateOfLastTest
                    ? new Date(student.dateOfLastTest).toLocaleDateString()
                    : <span style={{ color: "#3d4249" }}>—</span>}
                </td>

                <td style={{ ...tdStyle, textAlign: "right", borderBottom: idx === students.length - 1 ? "none" : tdStyle.borderBottom }}>
                  <Link
                    href={`/students/${student._id}/edit`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 bg-transparent border border-[rgba(255,255,255,0.06)] text-[#545a65] hover:text-[#e8a857] hover:border-[rgba(232,168,87,0.25)] hover:bg-[rgba(232,168,87,0.06)]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 20.013a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                    </svg>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
