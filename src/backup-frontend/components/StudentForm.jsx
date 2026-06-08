"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BELTS } from "@/lib/constants";
import SearchableSelect from "./SearchableSelect";

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

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-[12px] font-medium mb-1.5" style={{ color: "#8b919e" }}>
        {label} {required && <span style={{ color: "#e8a857" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export default function StudentForm({ student = null }) {
  const router = useRouter();
  const isEditing = !!student;

  const [form, setForm] = useState({
    name: "", phone: "", dateOfBirth: "", currentBelt: "White",
    dojoLocation: "", dateOfLastTest: "", beltChangeNotes: "",
  });
  const [dojos, setDojos] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/dojos").then((r) => r.json()).then((d) => setDojos(d.dojos || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (student) {
      setForm({
        name: student.name || "",
        phone: student.phone || "",
        dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split("T")[0] : "",
        currentBelt: student.currentBelt || "White",
        dojoLocation: student.dojoLocation?._id || student.dojoLocation || "",
        dateOfLastTest: student.dateOfLastTest ? new Date(student.dateOfLastTest).toISOString().split("T")[0] : "",
        beltChangeNotes: "",
      });
    }
  }, [student]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const today = new Date();
    if (new Date(form.dateOfBirth) > today) {
      setError("Date of Birth cannot be in the future");
      setLoading(false);
      return;
    }
    if (form.dateOfLastTest && new Date(form.dateOfLastTest) > today) {
      setError("Date of Last Test cannot be in the future");
      setLoading(false);
      return;
    }

    try {
      const url = isEditing ? `/api/students/${student._id}` : "/api/students";
      const method = isEditing ? "PUT" : "POST";
      const body = { ...form };
      if (!body.dateOfLastTest) delete body.dateOfLastTest;
      if (!body.beltChangeNotes) delete body.beltChangeNotes;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save student"); return; }

      router.push(isEditing ? `/students/${student._id}` : "/students");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }



  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div
          className="text-sm rounded-lg px-4 py-3"
          style={{
            background: "rgba(248,113,113,0.07)",
            border: "1px solid rgba(248,113,113,0.2)",
            color: "#f87171",
          }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Full Name" required>
          <input
            name="name" type="text" value={form.name} onChange={handleChange}
            className="focus:border-[rgba(232,168,87,0.4)]"
            style={fieldStyle}
          />
        </Field>

        <Field label="Phone" required>
          <input
            name="phone" type="text" value={form.phone} onChange={handleChange}
            className="focus:border-[rgba(232,168,87,0.4)]"
            style={fieldStyle}
          />
        </Field>

        <Field label="Date of Birth" required>
          <input
            name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange}
            className="focus:border-[rgba(232,168,87,0.4)]"
            required style={fieldStyle}
          />
        </Field>

        <Field label="Current Belt">
          <select
            name="currentBelt" value={form.currentBelt} onChange={handleChange}
            className="focus:border-[rgba(232,168,87,0.4)]"
            style={{ ...fieldStyle, cursor: "pointer" }}
          >
            {BELTS.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
          </select>
        </Field>

        <Field label="Dojo Location" required>
          <SearchableSelect
            options={dojos.map((d) => ({ value: d._id, label: d.name }))}
            value={form.dojoLocation}
            onChange={(val) => setForm({ ...form, dojoLocation: val })}
            placeholder="Select a dojo…"
            required
          />
        </Field>

        <Field label="Date of Last Test">
          <input
            name="dateOfLastTest" type="date" value={form.dateOfLastTest} onChange={handleChange}
            className="focus:border-[rgba(232,168,87,0.4)]"
            style={fieldStyle}
          />
        </Field>
      </div>

      {/* belt change notes */}
      {isEditing && form.currentBelt !== student?.currentBelt && (
        <Field label="Belt Change Notes">
          <textarea
            name="beltChangeNotes" value={form.beltChangeNotes} onChange={handleChange}
            rows={2} placeholder="Reason for belt change…"
            className="focus:border-[rgba(232,168,87,0.4)]"
            style={{ ...fieldStyle, resize: "vertical" }}
          />
        </Field>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer bg-[rgba(232,168,87,0.12)] border border-[rgba(232,168,87,0.25)] text-[#e8a857] disabled:text-[#8b6f3a] disabled:cursor-not-allowed hover:bg-[rgba(232,168,87,0.18)] disabled:hover:bg-[rgba(232,168,87,0.12)]"
        >
          {loading ? "Saving…" : isEditing ? "Save Changes" : "Add Student"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer bg-transparent border border-[rgba(255,255,255,0.07)] text-[#545a65] hover:text-[#8b919e] hover:border-[rgba(255,255,255,0.12)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
