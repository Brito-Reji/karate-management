"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const fieldStyle = {
  width: "100%",
  padding: "10px 14px",
  background: "#16191f",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "8px",
  color: "#c9cfdb",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.15s",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      router.push("/dashboard");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: "380px", padding: "0 16px" }}>
      <div
        style={{
          background: "#16191f",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
          padding: "40px 36px",
        }}
      >
        {/* logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 text-xl"
            style={{ background: "rgba(232,168,87,0.1)", border: "1px solid rgba(232,168,87,0.2)" }}
          >
            🥋
          </div>
          <h1 className="text-lg font-semibold" style={{ color: "#f0f2f5" }}>
            Karate Management
          </h1>
          <p className="text-sm mt-1" style={{ color: "#545a65" }}>Sign in to continue</p>
        </div>

        {error && (
          <div
            className="text-sm rounded-lg px-4 py-3 mb-5"
            style={{
              background: "rgba(248,113,113,0.07)",
              border: "1px solid rgba(248,113,113,0.2)",
              color: "#f87171",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[12px] font-medium mb-1.5" style={{ color: "#8b919e" }}>
              Email or Username
            </label>
            <input
              id="email"
              type="text"
              name="username"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@karate.com"
              className="focus:border-[rgba(232,168,87,0.4)]"
              style={fieldStyle}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[12px] font-medium mb-1.5" style={{ color: "#8b919e" }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="focus:border-[rgba(232,168,87,0.4)]"
              style={fieldStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 mt-2 cursor-pointer bg-[rgba(232,168,87,0.12)] border border-[rgba(232,168,87,0.25)] text-[#e8a857] disabled:bg-[rgba(232,168,87,0.08)] disabled:text-[#8b6f3a] disabled:cursor-not-allowed hover:bg-[rgba(232,168,87,0.18)] disabled:hover:bg-[rgba(232,168,87,0.08)]"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
