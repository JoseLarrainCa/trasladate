#!/usr/bin/env node
/**
 * Gate: un formulario que pide datos tiene que avisarle a alguien, y el teléfono
 * tiene que ser obligatorio.
 *
 * Por qué existe: la regla estaba escrita en la skill desde el 2026-09-15 y TecnoCama
 * igual quedó afuera. Tenía dos formularios que pedían nombre, teléfono y correo, se
 * clasificó como "solo botón de WhatsApp", y durante ocho días todo lo que la gente
 * escribía se perdía si no apretaba enviar en WhatsApp. La prosa no lo atajó; esto sí.
 *
 * Corre en `prebuild`, al lado de `marca:check`. Falla el build.
 *
 * Uso:
 *   node scripts/formularios.mjs            # revisa y falla si algo está mal
 *   node scripts/formularios.mjs --lista    # solo muestra qué encontró
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const RAIZ = process.cwd();
const SRC = join(RAIZ, "src");
const CONFIG = join(RAIZ, ".formularios-check.json");
const soloLista = process.argv.includes("--lista");

/**
 * Los campos que convierten un `<form>` en captura de contacto.
 *
 * Se buscan como texto entre comillas y no como atributo JSX: en la flota los campos
 * casi nunca se escriben `name="telefono"` sueltos — salen de un arreglo de definiciones
 * (`{ id: "telefono", autoComplete: "tel" }`) que el componente recorre. Buscar el
 * atributo literal daba verde en un formulario que sí pedía los tres datos.
 */
const CAMPOS = {
  nombre: /["'`](nombre|name|fullname|full_name)["'`]/i,
  telefono: /["'`](telefono|tel[eé]fono|tel|phone|whatsapp|celular|movil|m[oó]vil)["'`]/i,
  correo: /["'`](correo|email|mail|e-mail)["'`]/i,
};
/**
 * Señales de que ese archivo manda el lead a alguna parte.
 *
 * Se buscan LLAMADAS, no imports: un `import` que nadie invoca deja el formulario
 * perdiendo leads con el gate en verde. Se probó mutando el componente de TecnoCama —
 * con la versión que miraba el import, el mutante sobrevivía.
 */
const AVISA = [
  /\b(avisar|enviarAviso|enviarCorreo|enviarLead|enviarCotizacion|notificar)[A-Za-z]*\s*\(/i,
  /fetch\(\s*["'`]\/api\//i,
  /createServerFn/,
  /\.insert\(|env\.DB\b|supabase\s*\.\s*from\(/i,
];

/**
 * Los nombres de la flota no son uniformes (`enviarSolicitud`, `crearLead`,
 * `guardarContacto`…), así que además se mira qué importa el archivo: si trae algo
 * desde un módulo de lead/correo/aviso Y lo invoca, cuenta como que avisa. Sin esto el
 * barrido marcaba en rojo a Jardines Medina y METTA, que sí avisan.
 */
const MODULO_DE_ENVIO = /from\s+["'][^"']*(lead|correo|aviso|mail|notif|contacto|solicitud|cotiza|agenda|reserva)[^"']*["']/i;

function invocaAlgoImportadoDeEnvio(texto) {
  const lineas = texto.split("\n").filter((l) => MODULO_DE_ENVIO.test(l));
  for (const linea of lineas) {
    const llaves = linea.match(/\{([^}]*)\}/);
    const nombres = llaves
      ? llaves[1].split(",").map((n) => n.replace(/\bas\b.*/, "").trim()).filter(Boolean)
      : [];
    const porDefecto = linea.match(/import\s+([A-Za-z_$][\w$]*)\s*(,|from)/);
    if (porDefecto) nombres.push(porDefecto[1]);
    for (const nombre of nombres) {
      if (!/^[A-Za-z_$][\w$]*$/.test(nombre)) continue;
      // Los escapes se arman con fromCharCode: una RegExp de string con barras
      // invertidas no sobrevive a copiar y pegar este archivo entre repos, y el
      // error (`Unterminated group`) tumba el gate COMPLETO, no solo ese archivo.
      const B = String.fromCharCode(92);
      const usado = new RegExp(B + "b" + nombre + B + "s*" + B + "(");
      if (usado.test(texto)) return true;
    }
  }
  return false;
}

/**
 * Un panel interno no es captura pública: sus formularios los llena el propio negocio
 * y lo que escriben ya queda guardado en su base. Avisar por correo ahí sería mandarle
 * un correo al cliente por cada cosa que él mismo escribe.
 */
const ES_PANEL = /(^|\/)(admin|panel|dashboard)([./]|$)/i;

/** Un teléfono marcado como opcional es el mismo agujero con otra cara. */
const TELEFONO_OPCIONAL = /(telefono|teléfono|fono|whatsapp|celular)[^\n]{0,80}\(opcional\)/i;

function archivosFuente(dir) {
  if (!existsSync(dir)) return [];
  const salida = [];
  for (const entrada of readdirSync(dir)) {
    if (entrada === "node_modules" || entrada === "ui") continue;
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) salida.push(...archivosFuente(ruta));
    else if (/\.(tsx|jsx)$/.test(entrada)) salida.push(ruta);
  }
  return salida;
}

function exenciones() {
  if (!existsSync(CONFIG)) return new Map();
  try {
    const cfg = JSON.parse(readFileSync(CONFIG, "utf8"));
    const mapa = new Map();
    for (const e of cfg.exenciones ?? []) {
      // Sin razón escrita no hay exención: si no se puede explicar, no se exime.
      if (e?.archivo && typeof e.razon === "string" && e.razon.trim().length >= 15) {
        mapa.set(e.archivo.split(String.fromCharCode(92)).join("/"), e.razon.trim());
      }
    }
    return mapa;
  } catch {
    console.error("✗ .formularios-check.json no es JSON válido.");
    process.exit(1);
  }
}

const eximidos = exenciones();
const problemas = [];
const encontrados = [];

for (const ruta of archivosFuente(SRC)) {
  const texto = readFileSync(ruta, "utf8");
  // También <motion.form> de framer-motion: con `<form\b` a secas ese formulario quedaba invisible al gate.
  if (!/<(?:[A-Za-z]+\.)?form\b/i.test(texto)) continue;

  const campos = Object.entries(CAMPOS)
    .filter(([, re]) => re.test(texto))
    .map(([nombre]) => nombre);
  // Un solo campo suele ser un buscador, no un contacto. Dos o más ya es un lead.
  if (campos.length < 2) continue;

  const rel = relative(RAIZ, ruta).split(String.fromCharCode(92)).join("/");
  if (ES_PANEL.test(rel)) continue;
  encontrados.push({ rel, campos });

  const razon = eximidos.get(rel);
  if (razon) {
    console.log(`○ ${rel} — eximido: ${razon}`);
    continue;
  }

  if (!AVISA.some((re) => re.test(texto)) && !invocaAlgoImportadoDeEnvio(texto)) {
    problemas.push(
      `✗ ${rel} pide ${campos.join(", ")} y no le avisa a nadie.\n` +
        `  Lo que escriba la persona se pierde si no aprieta enviar en WhatsApp.\n` +
        `  Conéctalo por correo (Fase 5b de la skill onboarding-cliente) o declara la\n` +
        `  exención con su razón en .formularios-check.json.`,
    );
  }

  if (TELEFONO_OPCIONAL.test(texto)) {
    problemas.push(
      `✗ ${rel} marca el teléfono como opcional.\n` +
        `  Sin teléfono el lead no se puede contactar: un nombre suelto no sirve de nada.`,
    );
  }
}

/**
 * Una página conectada al software de agencias (`npm run agencia:conectar` le copia
 * `src/lib/cliente-software.ts`) manda su cotización por `enviarCotizacion()`, casi siempre
 * desde una ruta del servidor (`.ts`) que el barrido de arriba no mira: el formulario llama a
 * su propia ruta y el gate le daba verde aunque esa ruta no le mandara nada al software.
 * Por eso, si el cliente está copiado, alguien en src/ tiene que invocarlo.
 */
const CLIENTE_SOFTWARE = join(SRC, "lib", "cliente-software.ts");
if (existsSync(CLIENTE_SOFTWARE)) {
  // Sin comentarios: un `enviarCotizacion()` citado en un comentario no manda nada (le pasó a la
  // portada de Calisto el 2026-09-26: el gate daba verde por la línea que explicaba la ruta).
  const sinComentarios = (texto) => texto.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
  const invoca = archivosServidor(SRC).some(
    (ruta) => ruta !== CLIENTE_SOFTWARE && /\b(enviarCotizacion|enviarSolicitud)\s*\(/.test(sinComentarios(readFileSync(ruta, "utf8"))),
  );
  if (!invoca) {
    problemas.push(
      `✗ src/lib/cliente-software.ts está copiado y nadie en src/ llama a enviarCotizacion() (agencias) ni a enviarSolicitud() (climatización).\n` +
        `  La página está conectada al software, pero su formulario no le llega.\n` +
        `  Llámalo desde la ruta del servidor que recibe el formulario (ver\n` +
        `  docs/CONECTAR-UNA-PAGINA.md del repo omnis-agencias).`,
    );
  }
}

function archivosServidor(dir) {
  if (!existsSync(dir)) return [];
  const salida = [];
  for (const entrada of readdirSync(dir)) {
    if (entrada === "node_modules") continue;
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) salida.push(...archivosServidor(ruta));
    else if (/\.(ts|tsx)$/.test(entrada)) salida.push(ruta);
  }
  return salida;
}

if (soloLista) {
  if (encontrados.length === 0) console.log("No hay formularios de contacto en src/.");
  for (const f of encontrados) console.log(`· ${f.rel} → ${f.campos.join(", ")}`);
  process.exit(0);
}

if (problemas.length > 0) {
  console.error("\nFormularios que pierden leads:\n");
  console.error(problemas.join("\n\n"));
  console.error("");
  process.exit(1);
}

console.log(
  encontrados.length === 0
    ? "✓ formularios: no hay formularios de contacto que revisar."
    : `✓ formularios: ${encontrados.length} revisado(s), todos avisan y piden teléfono.`,
);
