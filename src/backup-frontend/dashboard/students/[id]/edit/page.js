"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import StudentForm from "@/components/StudentForm";

export default function EditStudentPage({ params }) {
  const { id } = use(params);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/students/${id}`)
      .then((r) => r.json())
      .then((d) => setStudent(d.student))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-80 rounded-xl" />
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "#f0f2f5" }}>Edit Student</h1>
        <p className="text-sm mt-0.5" style={{ color: "#545a65" }}>
          Updating details for {student.name}
        </p>
      </div>

      <div
        style={{
          background: "#16191f",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          padding: "2rem",
        }}
      >
        <StudentForm student={student} />
      </div>
    </div>
  );
}
