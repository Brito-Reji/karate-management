"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import Link from "next/link";
import BeltBadge from "@/components/BeltBadge";
import Modal from "@/components/Modal";

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span className="text-[12px] font-medium shrink-0" style={{ color: "#545a65" }}>{label}</span>
      <span className="text-[13px] text-right" style={{ color: "#c9cfdb" }}>{value}</span>
    </div>
  );
}

export default function StudentDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/students/${id}`)
      .then((r) => r.json())
      .then((d) => setStudent(d.student))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/students");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="skeleton h-16 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="skeleton h-60 rounded-xl" />
          <div className="skeleton h-60 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <p style={{ color: "#545a65" }}>Student not found</p>
      </div>
    );
  }

  const age = student.dateOfBirth
    ? Math.max(0, Math.floor((Date.now() - new Date(student.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
    : null;

  const card = {
    background: "#16191f",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    padding: "1.5rem",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-semibold shrink-0"
            style={{ background: "#1c2028", color: "#8b919e" }}
          >
            {student.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: "#f0f2f5" }}>{student.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <BeltBadge belt={student.currentBelt} size="sm" />
              <span className="text-[12px]" style={{ color: "#3d4249" }}>·</span>
              <span className="text-[12px]" style={{ color: "#545a65" }}>{student.dojoLocation?.name || "No dojo"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/students/${id}/edit`}
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 bg-[rgba(232,168,87,0.08)] border border-[rgba(232,168,87,0.2)] text-[#e8a857] hover:bg-[rgba(232,168,87,0.14)]"
          >
            Edit
          </Link>
          <button
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer bg-transparent border border-[rgba(255,255,255,0.06)] text-[#545a65] hover:text-[#f87171] hover:border-[rgba(248,113,113,0.25)] hover:bg-[rgba(248,113,113,0.06)]"
          >
            Delete
          </button>
        </div>
      </div>

      {/* info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* details */}
        <div style={card}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: "#3d4249" }}>
            Student Details
          </p>
          <div>
            <InfoRow label="Phone" value={student.phone} />
            <InfoRow
              label="Date of Birth"
              value={student.dateOfBirth
                ? `${new Date(student.dateOfBirth).toLocaleDateString()}${age !== null ? ` · ${age} yrs` : ""}`
                : "—"}
            />
            <InfoRow label="Dojo" value={student.dojoLocation?.name || "—"} />
            <InfoRow
              label="Last Promotion Test"
              value={student.dateOfLastTest ? new Date(student.dateOfLastTest).toLocaleDateString() : "—"}
            />
            <InfoRow label="Registered" value={new Date(student.createdAt).toLocaleDateString()} />
          </div>
        </div>

        {/* belt history */}
        <div style={card}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: "#3d4249" }}>
            Belt Progression
          </p>
          {student.beltHistory?.length > 0 ? (
            <div className="space-y-3 relative" style={{ paddingLeft: "20px" }}>
              <div
                className="absolute left-0 top-2 bottom-2 w-px"
                style={{ background: "rgba(255,255,255,0.05)" }}
              />
              {/* current */}
              <div className="flex items-center gap-3 relative">
                <div
                  className="absolute -left-5 w-2.5 h-2.5 rounded-full"
                  style={{ background: "#e8a857", top: "50%", transform: "translateY(-50%)" }}
                />
                <BeltBadge belt={student.currentBelt} size="sm" />
                <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: "rgba(232,168,87,0.08)", color: "#e8a857", border: "1px solid rgba(232,168,87,0.2)" }}>
                  Current
                </span>
              </div>
              {[...student.beltHistory].reverse().map((entry, i) => (
                <div key={i} className="flex items-center gap-3 relative justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="absolute -left-5 w-2 h-2 rounded-full"
                      style={{ background: "#2a2f38", border: "1px solid rgba(255,255,255,0.08)", top: "50%", transform: "translateY(-50%)" }}
                    />
                    <BeltBadge belt={entry.belt} size="sm" />
                  </div>
                  <span className="text-[11px] shrink-0" style={{ color: "#545a65" }}>
                    {entry.dateEarned ? new Date(entry.dateEarned).toLocaleDateString() : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm py-6 text-center" style={{ color: "#545a65" }}>No history recorded</p>
          )}
        </div>
      </div>

      {/* delete modal */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Student">
        <p className="text-sm leading-relaxed mb-6" style={{ color: "#8b919e" }}>
          Are you sure you want to permanently delete <strong style={{ color: "#c9cfdb" }}>{student.name}</strong>? All belt history and records will be removed.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setShowDelete(false)}
            className="px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-all bg-transparent border border-[rgba(255,255,255,0.07)] text-[#545a65] hover:text-[#8b919e]"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer transition-all bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.25)] text-[#f87171] disabled:opacity-50 hover:bg-[rgba(248,113,113,0.16)] disabled:hover:bg-[rgba(248,113,113,0.1)]"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
