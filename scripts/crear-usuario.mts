// Crea (o cambia la clave de) un usuario del panel de Trasladarte.
//
//   CLAVE_USUARIO='la-clave' npx vite-node scripts/crear-usuario.mts -- correo@dominio.cl [--remote] [--rol user]
//
// Sin --remote escribe en la base LOCAL (la de `wrangler dev`). Con --remote, en la
// D1 de producción. La clave va por la variable de entorno CLAVE_USUARIO (así no queda
// en el historial de la consola); si no está, se pasa como segundo argumento.
//
// El hash sale de worker/clave.ts: es el MISMO código que usa el Worker para verificarlo,
// con las mismas vueltas (100.000, el tope de Workers). No hay una copia aparte.

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hashearClave } from "../worker/clave";

const args = process.argv.slice(2).filter((a) => a !== "--");
const remoto = args.includes("--remote");
const iRol = args.indexOf("--rol");
const rol = iRol >= 0 ? args[iRol + 1] : "admin";
const posicionales = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--rol");
const email = (posicionales[0] ?? "").trim().toLowerCase();
const clave = process.env.CLAVE_USUARIO ?? posicionales[1] ?? "";

if (!/^[^\s'"@]+@[^\s'"@]+\.[^\s'"@]+$/.test(email)) {
  console.error("Falta un correo válido. Uso: crear-usuario.mts correo@dominio.cl [--remote] [--rol admin|user]");
  process.exit(1);
}
if (!["admin", "user"].includes(rol)) {
  console.error('El rol tiene que ser "admin" o "user".');
  process.exit(1);
}
if (clave.length < 8) {
  console.error("La clave tiene que tener al menos 8 caracteres (variable CLAVE_USUARIO).");
  process.exit(1);
}

const hash = await hashearClave(clave);
const sql =
  `INSERT INTO users (email, password_hash, role) VALUES ('${email}', '${hash}', '${rol}')\n` +
  `ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, role = excluded.role;\n` +
  // El panel muestra el nombre desde profiles; el id del perfil es el mismo del usuario.
  `INSERT INTO profiles (id, user_id, email) SELECT id, id, email FROM users WHERE email = '${email}'\n` +
  `ON CONFLICT(id) DO NOTHING;\n`;

const carpeta = mkdtempSync(join(tmpdir(), "trasladarte-usuario-"));
const archivo = join(carpeta, "usuario.sql");
writeFileSync(archivo, sql);
try {
  execFileSync(
    "npx",
    ["wrangler", "d1", "execute", "trasladarte", remoto ? "--remote" : "--local", "--file", archivo],
    {
      stdio: "inherit",
      shell: true,
      env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: "4348d418d61283075685bc8bd4caeaae" },
    },
  );
  console.log(`Listo: ${email} (${rol}) en la base ${remoto ? "REMOTA" : "local"}.`);
} finally {
  rmSync(carpeta, { recursive: true, force: true });
}
