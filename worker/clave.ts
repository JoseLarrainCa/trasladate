// Claves de los usuarios del panel.
//
// PBKDF2-SHA256 con sal propia, guardada como `pbkdf2$<vueltas>$<sal>$<hash>`.
//
// 🔴 100.000 vueltas es el TECHO del runtime de Workers: por encima, el login
// responde 500 (NotSupportedError). Node no tiene ese tope, así que un script de
// alta que hasheara con más vueltas guardaría la clave sin quejarse y recién
// fallaría en producción. Por eso este módulo es el ÚNICO lugar donde viven las
// vueltas, y el script scripts/crear-usuario.mts importa `hashearClave` de acá en
// vez de tener su propia copia (y un test fija el número).

export const VUELTAS = 100_000;

const enc = new TextEncoder();

function aHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function deHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function derivar(clave: string, sal: Uint8Array, vueltas: number): Promise<Uint8Array> {
  const base = await crypto.subtle.importKey("raw", enc.encode(clave), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: vueltas },
    base,
    256,
  );
  return new Uint8Array(bits);
}

/** Compara sin filtrar la respuesta por el tiempo que tarda. */
export function igualSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

export async function hashearClave(clave: string): Promise<string> {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivar(clave, sal, VUELTAS);
  return `pbkdf2$${VUELTAS}$${aHex(sal)}$${aHex(hash)}`;
}

export async function verificarClave(clave: string, guardada: string): Promise<boolean> {
  const partes = guardada.split("$");
  if (partes.length !== 4 || partes[0] !== "pbkdf2") return false;
  const vueltas = Number(partes[1]);
  if (!Number.isInteger(vueltas) || vueltas < 1 || vueltas > VUELTAS) return false;
  const hash = await derivar(clave, deHex(partes[2]), vueltas);
  return igualSeguro(aHex(hash), partes[3]);
}

/**
 * Para que "este correo no existe" tarde lo mismo que "la clave está mala": sin
 * esto, medir el tiempo de la respuesta delata qué correos tienen cuenta.
 */
export async function gastarTiempoDeVerificacion(clave: string): Promise<void> {
  await derivar(clave, new Uint8Array(16), VUELTAS);
}
