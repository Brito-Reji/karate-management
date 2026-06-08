"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import StudentTable from "@/components/StudentTable";
import { BELTS } from "@/lib/constants";

const inputStyle = {
  background: "#16191f",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "8px",
  color: "#c9cfdb",
  fontSize: "13px",
  padding: "8px 12px",
  width: "100%",
  outline: "none",
  transition: "border-color 0.15s",
};

function StudentsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [students, setStudents] = useState([]);
  const [dojos, setDojos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [beltFilter, setBeltFilter] = useState("");
  const [dojoFilter, setDojoFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    fetch("/api/dojos")
      .then((r) => r.json())
      .then((d) => setDojos(d.dojos || []))
      .catch(() => {});
  }, []);

  // sync from URL
  useEffect(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    const s = searchParams.get("search") || "";
    const b = searchParams.get("belt") || "";
    const d = searchParams.get("dojo") || "";
    setPage(p); setSearch(s); setSearchInput(s); setBeltFilter(b); setDojoFilter(d);
  }, [searchParams]);

  // fetch students
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (beltFilter) params.set("belt", beltFilter);
    if (dojoFilter) params.set("dojo", dojoFilter);
    params.set("page", page.toString());
    params.set("limit", "10");

    fetch(`/api/students?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setStudents(d.students || []);
        setTotalPages(d.totalPages || 1);
        setTotalStudents(d.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, beltFilter, dojoFilter, page]);

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) pushFilters({ newSearch: searchInput, newPage: 1 });
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  function pushFilters({ newSearch, newBelt, newDojo, newPage }) {
    const params = new URLSearchParams();
    const s = newSearch !== undefined ? newSearch : search;
    const b = newBelt !== undefined ? newBelt : beltFilter;
    const d = newDojo !== undefined ? newDojo : dojoFilter;
    const p = newPage !== undefined ? newPage : 1;
    if (s) params.set("search", s);
    if (b) params.set("belt", b);
    if (d) params.set("dojo", d);
    if (p > 1) params.set("page", p.toString());
    router.push(`${pathname}?${params}`);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "#f0f2f5" }}>Students</h1>
          <p className="text-sm mt-1" style={{ color: "#545a65" }}>
            {totalStudents} member{totalStudents !== 1 ? "s" : ""} registered
          </p>
        </div>
        <Link
          href="/students/new"
          className="text-[13px] font-medium px-4 py-2 rounded-lg transition-all duration-150 shrink-0 bg-[rgba(232,168,87,0.1)] border border-[rgba(232,168,87,0.2)] text-[#e8a857] hover:bg-[rgba(232,168,87,0.16)]"
        >
          + Add Student
        </Link>
      </div>

      {/* filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#3d4249" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or phone..."
            className="focus:border-[rgba(232,168,87,0.35)]"
            style={{ ...inputStyle, paddingLeft: "36px" }}
          />
        </div>
        <select
          value={beltFilter}
          onChange={(e) => pushFilters({ newBelt: e.target.value, newPage: 1 })}
          className="focus:border-[rgba(232,168,87,0.35)]"
          style={{ ...inputStyle, width: "auto", paddingRight: "28px", cursor: "pointer" }}
        >
          <option value="">All Belts</option>
          {BELTS.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
        </select>
        <select
          value={dojoFilter}
          onChange={(e) => pushFilters({ newDojo: e.target.value, newPage: 1 })}
          className="focus:border-[rgba(232,168,87,0.35)]"
          style={{ ...inputStyle, width: "auto", paddingRight: "28px", cursor: "pointer" }}
        >
          <option value="">All Dojos</option>
          {dojos.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
      </div>

      {/* table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-12" />)}
        </div>
      ) : (
        <>
          <StudentTable students={students} />

          {/* pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[12px]" style={{ color: "#545a65" }}>
                Showing <span style={{ color: "#8b919e" }}>{Math.min((page - 1) * 10 + 1, totalStudents)}</span>–<span style={{ color: "#8b919e" }}>{Math.min(page * 10, totalStudents)}</span> of <span style={{ color: "#8b919e" }}>{totalStudents}</span>
              </p>
              <div className="flex items-center gap-1.5">
                <PaginationBtn onClick={() => pushFilters({ newPage: page - 1 })} disabled={page === 1}>
                  ← Prev
                </PaginationBtn>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => pushFilters({ newPage: p })}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      p === page
                        ? "bg-[rgba(232,168,87,0.12)] border border-[rgba(232,168,87,0.3)] text-[#e8a857]"
                        : "bg-transparent border border-transparent text-[#545a65] hover:text-[#8b919e] hover:border-[rgba(255,255,255,0.07)]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <PaginationBtn onClick={() => pushFilters({ newPage: page + 1 })} disabled={page === totalPages}>
                  Next →
                </PaginationBtn>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PaginationBtn({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 h-8 rounded-lg text-[12px] font-medium transition-all duration-150 bg-transparent border border-[rgba(255,255,255,0.06)] disabled:text-[#3d4249] disabled:cursor-not-allowed disabled:hover:border-[rgba(255,255,255,0.06)] text-[#8b919e] cursor-pointer hover:border-[rgba(255,255,255,0.1)]"
    >
      {children}
    </button>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-10 w-full" />
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-12" />)}</div>
      </div>
    }>
      <StudentsPageContent />
    </Suspense>
  );
}
