type RowIndexBadgeProps = {
  index: number;
  offset?: number;
};

export function RowIndexBadge({ index, offset = 0 }: RowIndexBadgeProps) {
  return (
    <span className="mt-0.5 flex h-6 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02] text-[10px] font-mono text-zinc-500">
      {offset + index + 1}
    </span>
  );
}

export default RowIndexBadge;
