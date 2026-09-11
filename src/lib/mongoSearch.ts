export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Case-insensitive prefix match so the query can use a leading-bound index. */
export function prefixRegex(value: string) {
  return { $regex: `^${escapeRegex(value)}`, $options: "i" as const };
}
