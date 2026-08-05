import bcrypt from "bcryptjs";

const ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(
  plain: string,
  stored: string | undefined | null
): Promise<boolean> {
  if (!stored) return false;

  // bcrypt hashes start with $2a$, $2b$, or $2y$
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
    return bcrypt.compare(plain, stored);
  }

  // legacy plain-text passwords (pre-hash migration)
  return plain === stored;
}

export function isHashedPassword(stored: string | undefined | null): boolean {
  if (!stored) return false;
  return (
    stored.startsWith("$2a$") ||
    stored.startsWith("$2b$") ||
    stored.startsWith("$2y$")
  );
}
