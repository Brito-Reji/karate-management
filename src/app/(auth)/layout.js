export default function AuthLayout({ children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#0e1014" }}
    >
      {children}
    </div>
  );
}
