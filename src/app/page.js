export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-radial from-[#1a1f29] to-[#0e1014]">
      <div className="max-w-md w-full bg-[#16191f] border border-white/5 rounded-2xl p-8 text-center shadow-2xl">
        <h1 className="text-2xl font-bold text-[#e8a857] mb-2">Karate Management</h1>
        <p className="text-[#8b919e] text-sm mb-6">Frontend cleaned and ready for restructuring.</p>
        <div className="text-xs text-[#545a65] border-t border-white/5 pt-4">
          Old frontend code is backed up in <code className="bg-[#1c2028] px-1.5 py-0.5 rounded text-[#f0f2f5]">src/backup-frontend/</code>
        </div>
      </div>
    </div>
  );
}
