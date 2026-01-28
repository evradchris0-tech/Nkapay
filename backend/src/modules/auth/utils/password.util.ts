/**
 * Utilitaires de gestion des mots de passe
 * Hashage et verification avec bcrypt
 */

import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/**
 * Hash un mot de passe en clair
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifie si un mot de passe correspond au hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Genere un mot de passe temporaire aleatoire
 */
export function generateTemporaryPassword(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
