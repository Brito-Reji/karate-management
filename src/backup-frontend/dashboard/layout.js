import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen" style={{ background: "#0e1014" }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto animate-fade-up" style={{ padding: "2.5rem 2.75rem" }}>
        {children}
      </main>
    </div>
  );
}
