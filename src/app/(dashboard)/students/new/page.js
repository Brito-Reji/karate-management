import StudentForm from "@/components/StudentForm";

export default function NewStudentPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "#f0f2f5" }}>Add Student</h1>
        <p className="text-sm mt-0.5" style={{ color: "#545a65" }}>
          Register a new student into the system
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
        <StudentForm />
      </div>
    </div>
  );
}
