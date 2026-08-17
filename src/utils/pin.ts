/**
 * O PIN nunca é guardado em texto aberto.
 *
 * Isto protege contra alguém que abra o armazenamento local por curiosidade
 * (que é exatamente o risco aqui: uma criança de 7 anos). Não é, nem pretende
 * ser, segurança contra um atacante — a app é 100% local e sem contas.
 */

const SALT = 'missoes-do-nicolas::v1'

function fallbackHash(value: string): string {
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i)
    h1 = Math.imul(h1 ^ code, 16777619) >>> 0
    h2 = Math.imul(h2 + code, 2654435761) >>> 0
  }
  return `fb${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`
}

export async function hashPin(pin: string): Promise<string> {
  const value = `${SALT}::${pin}`
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const bytes = new TextEncoder().encode(value)
      const digest = await crypto.subtle.digest('SHA-256', bytes)
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    } catch {
      // Contexto não seguro (ex.: http simples) — cai para o hash simples.
    }
  }
  return fallbackHash(value)
}

export async function verifyPin(pin: string, hash: string | null): Promise<boolean> {
  if (!hash) return false
  return (await hashPin(pin)) === hash
}

export function isValidPinFormat(pin: string): boolean {
  return /^\d{4}$/.test(pin)
}
