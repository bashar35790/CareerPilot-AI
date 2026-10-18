import bcrypt from 'bcryptjs';

export const SALT_ROUNDS = 12;

export async function hashPassword(plainPassword: string): Promise<string> {
  if (typeof plainPassword !== 'string' || plainPassword.length === 0) {
    throw new Error('Password to hash must be a non-empty string');
  }
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function verifyPassword(
  plainPassword: string,
  passwordHash: string
): Promise<boolean> {
  if (
    typeof plainPassword !== 'string' ||
    plainPassword.length === 0 ||
    typeof passwordHash !== 'string' ||
    passwordHash.length === 0
  ) {
    return false;
  }

  try {
    return await bcrypt.compare(plainPassword, passwordHash);
  } catch {
    return false;
  }
}
