#!/usr/bin/env node
/**
 * marca.mjs — genera y verifica los assets de marca y SEO del sitio.
 *
 *   node scripts/marca.mjs              genera todo (necesita sharp)
 *   node scripts/marca.mjs --sin-logo   genera solo lo que no depende del logo
 *   node scripts/marca.mjs --check      verifica; NO necesita sharp; exit 0/1
 *
 * Todo sale de `brand.config.json`. Los archivos generados se COMMITEAN:
 * `sharp` es un binario nativo y este repo lo buildea tambien Lovable (bun),
 * asi que la generacion nunca corre en un hook de build. Ver el plan, § T1.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);

/* ------------------------------------------------------------------ *
 * Lista negra: los favicon default de Lovable.
 * Medido el 2026-07-30 sobre los 8 repos de la flota — 5 comparten el A,
 * 2 comparten el B, 0 tenian uno propio. Publicar con cualquiera de estos
 * significa que dos enlaces de clientes distintos salen con el mismo icono
 * en WhatsApp. Es el UNICO error que detiene el build.
 * ------------------------------------------------------------------ */
const DEFAULTS_LOVABLE = {
  dd821076a9b03adc2173c93956226aea3d92482d7578fc4339c5d3a2e9c24586: "default Lovable A",
  b46fb9c4f87a1addff88a2cea1710c296f151fae55abedec3843924dd731039b: "default Lovable B",
};

const RELLENO = [
  /^[\s…._-]*$/,
  /\+?56\s*9\s*0000\s*0000/,
  /ejemplo|example|placeholder/i,
  // TODO/XXX/FIXME van case-SENSITIVE y con limite de palabra A PROPOSITO: con la
  // bandera `i`, /TODO/ matchea la palabra española "todo" y cualquier copy que
  // diga "en todo Chile" o "todo tipo de" dispara un aviso falso. Un linter que
  // grita en falso es un linter que se ignora, que es justo lo que no queremos
  // del muro que protege el favicon.
  /\b(TODO|XXX|FIXME)\b/,
  /lovable\.app|lovableproject\.com|pub-[a-z0-9]+\.r2\.dev/i,
];

const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const rojo = (s) => `\x1b[31m${s}\x1b[0m`;
const amar = (s) => `\x1b[33m${s}\x1b[0m`;
const verde = (s) => `\x1b[32m${s}\x1b[0m`;

const errores = [];
const avisos = [];
const err = (m) => errores.push(m);
const avisar = (m) => avisos.push(m);

/* ------------------------------------------------------------------ *
 * Config
 * ------------------------------------------------------------------ */
function leerConfig() {
  if (!existsSync(p("brand.config.json"))) {
    console.error(
      rojo("✗ marca: no hay brand.config.json en la raiz del repo") +
        `

  Es la unica fuente de verdad de marca y SEO de este sitio.

  Obligatorios: nombre, descripcion, dominioCanonico, logoPath,
                colorMarca, rutasPublicas
  Opcionales:   tagline, rubro, ciudad, icono, negocio.*

  Si el cliente no entrego un dato, OMITE la clave.
  No la dejes vacia ni con relleno.
`,
    );
    process.exit(1);
  }
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(p("brand.config.json"), "utf8"));
  } catch (e) {
    console.error(rojo(`✗ marca: brand.config.json no es JSON valido — ${e.message}`));
    process.exit(1);
  }

  const req = ["nombre", "descripcion", "dominioCanonico", "logoPath", "colorMarca", "rutasPublicas"];
  for (const k of req) {
    if (cfg[k] === undefined || cfg[k] === null || cfg[k] === "") err(`brand.config.json: falta el campo obligatorio "${k}"`);
  }
  if (cfg.dominioCanonico && !/^https:\/\/[^/]+$/.test(cfg.dominioCanonico)) {
    err(`dominioCanonico debe ser "https://host" sin barra final — es "${cfg.dominioCanonico}"`);
  }
  if (cfg.descripcion && cfg.descripcion.length > 160) {
    avisar(`la descripcion mide ${cfg.descripcion.length} caracteres (tope 160). Google y WhatsApp la truncan.`);
  }

  // Relleno: nunca puede llegar a datos estructurados.
  const revisar = (obj, ruta = "") => {
    for (const [k, v] of Object.entries(obj ?? {})) {
      const donde = ruta ? `${ruta}.${k}` : k;
      if (typeof v === "string" && RELLENO.some((re) => re.test(v))) {
        avisar(
          `brand.config.json tiene un valor de relleno en ${donde} = "${v}"\n` +
            `    Publicar un dato falso como dato estructurado es peor que no publicarlo:\n` +
            `    Google lo indexa. Pon el valor real, o borra la clave para omitirlo.`,
        );
      } else if (v && typeof v === "object" && !Array.isArray(v)) revisar(v, donde);
    }
  };
  revisar(cfg);

  return cfg;
}

/* ------------------------------------------------------------------ *
 * Archivos de texto (no dependen del logo → tambien corren con --sin-logo)
 * ------------------------------------------------------------------ */
function generarTexto(cfg) {
  const base = cfg.dominioCanonico.replace(/\/$/, "");

  // robots.txt — SIN mencionar /admin.
  // Un Disallow publicaria la puerta de un panel sin contrasena, y ademas
  // anularia el noindex: si bloqueas el rastreo, Googlebot nunca lo lee.
  const robots = `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`;
  writeFileSync(p("public", "robots.txt"), robots, "utf8");

  const hoy = new Date().toISOString().slice(0, 10);
  void hoy; // sin <lastmod>: generado en runtime cambia en cada request
  const urls = cfg.rutasPublicas
    .map((r) => `  <url><loc>${base}${r === "/" ? "/" : r}</loc></url>`)
    .join("\n");
  writeFileSync(
    p("public", "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
    "utf8",
  );

  // El config como modulo TS, no como import de JSON.
  // `tsconfig.json` no declara `resolveJsonModule` y su `include` ni siquiera
  // cubre la raiz del repo, asi que `import cfg from "../../brand.config.json"`
  // no compila. Emitir un .ts tipado evita tocar el tsconfig y sirve igual en
  // el bundle del servidor y en el del cliente.
  if (!existsSync(p("src", "lib"))) mkdirSync(p("src", "lib"), { recursive: true });
  writeFileSync(
    p("src", "lib", "brand.generated.ts"),
    `// GENERADO POR scripts/marca.mjs — NO EDITAR A MANO.
// Edita brand.config.json y corre: npm run marca

export type BrandConfig = {
  marcaVersion: string;
  nombre: string;
  descripcion: string;
  dominioCanonico: string;
  logoPath: string;
  colorMarca: string;
  rutasPublicas: string[];
  tagline?: string;
  rubro?: string;
  ciudad?: string;
  locale?: string;
  logoIncluyeNombre?: boolean;
  colorFondoOg?: string;
  ogLogoAlto?: number;
  urlRespaldo?: string;
  redirigirHosts?: string[];
  rutasExcluidas?: string[];
  omitir?: string[];
  icono?: { recorte?: number[]; margen?: number; fondo?: string };
  /**
   * Huella de brand.config.json + el logo, generada aca. Sirve para versionar la URL
   * de los iconos y de la tarjeta social: el navegador cachea el favicon con una
   * agresividad que no respeta el deploy, y Chrome lo guarda en una base propia que
   * sobrevive al recargado duro. Sin ?v=<hash> el logo nuevo no aparece nunca.
   */
  assetsHash?: string;
  negocio?: {
    direccion?: string;
    ciudad?: string;
    region?: string;
    codigoPostal?: string;
    pais?: string;
    telefono?: string;
    horario?: { dias: string[]; abre: string; cierra: string }[];
    instagram?: string;
    whatsapp?: string;
  };
};

export const brand: BrandConfig = ${JSON.stringify({ ...cfg, assetsHash: hashFuentes(cfg).slice(0, 12) }, null, 2)};
`,
    "utf8",
  );

  return ["public/robots.txt", "public/sitemap.xml", "src/lib/brand.generated.ts"];
}

/* ------------------------------------------------------------------ *
 * ICO: contenedor simple alrededor de PNGs (16, 32 y 48 px).
 * El favicon actual de la flota es UN solo frame de 256 px, y el navegador
 * lo reduce con un filtro peor que el nuestro. Por eso van los tres tamanos.
 * El de 48 NO es decorativo: Google exige un frame de 48x48 (o multiplo) para
 * mostrar el favicon en resultados de busqueda. Sin el sale el globo gris.
 * ------------------------------------------------------------------ */
function construirIco(pngs) {
  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2);
  dir.writeUInt16LE(pngs.length, 4);
  let offset = 6 + pngs.length * 16;
  const entradas = [];
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entradas.push(e);
  }
  return Buffer.concat([dir, ...entradas, ...pngs.map((x) => x.data)]);
}

/* ------------------------------------------------------------------ *
 * Generacion de imagenes
 * ------------------------------------------------------------------ */
async function generarImagenes(cfg) {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error(
      rojo("✗ marca: falta sharp") +
        `

  Se usa solo para generar; no es dependencia del build.
  Instalalo con:  npm install --save-dev --legacy-peer-deps sharp
`,
    );
    process.exit(1);
  }

  const logo = p(cfg.logoPath);
  if (!existsSync(logo)) {
    console.error(
      rojo(`✗ marca: no encuentro el logo en ${cfg.logoPath}`) +
        `

  De ahi salen favicon.ico, apple-touch-icon.png, icon-192.png,
  icon-512.png y og-image.png. Sin el no se genera ninguno.

  Arreglos:
    1. Pon el logo del cliente ahi (cuadrado, >=512 px).
    2. O apunta "logoPath" a donde este.

  Si el cliente todavia no lo entrega: NO uses el default de Lovable.
  Corre  npm run marca -- --sin-logo  para generar lo que no depende de el.
`,
    );
    process.exit(1);
  }

  const meta = await sharp(logo).metadata();
  const escritos = [];

  // Fondo: se DERIVA del borde del logo, no se elige aparte.
  // 4 de 5 logos de la flota traen fondo propio; componerlos sobre el color
  // de marca produce un recorte flotando, que se lee como imagen rota.
  const fondoOg = cfg.colorFondoOg ?? (await colorDelBorde(sharp, logo));
  const fondoIcono = cfg.icono?.fondo ?? fondoOg;

  /* --- fuente del icono: recorte declarado, o el logo entero con aviso --- */
  let fuenteIcono = sharp(logo);
  if (cfg.icono?.recorte) {
    const [left, top, width, height] = cfg.icono.recorte;
    fuenteIcono = sharp(logo).extract({ left, top, width, height });
  } else {
    avisar(
      `no hay "icono.recorte" en brand.config.json.\n` +
        `    Se usa el logo completo, que a 16 px suele quedar ilegible.\n` +
        `    Revisa public/.brand-preview.png y declara un recorte si no se lee.`,
    );
  }
  const bufIcono = await fuenteIcono.png().toBuffer();

  const cuadrado = async (size, margen) => {
    const inner = Math.round(size * (1 - 2 * margen));
    return sharp({
      create: { width: size, height: size, channels: 4, background: fondoIcono },
    })
      .composite([
        {
          input: await sharp(bufIcono)
            .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toBuffer(),
          gravity: "center",
        },
      ])
      .png()
      .toBuffer();
  };

  const m = cfg.icono?.margen ?? 0.08;
  // A 16 px el margen se elimina: el rasgo tiene que llenar el cuadro.
  const png16 = await cuadrado(16, 0);
  const png32 = await cuadrado(32, m * 0.5);
  const png48 = await cuadrado(48, m * 0.5);
  writeFileSync(
    p("public", "favicon.ico"),
    construirIco([
      { size: 16, data: png16 },
      { size: 32, data: png32 },
      { size: 48, data: png48 },
    ]),
  );
  escritos.push("public/favicon.ico");

  // apple-touch-icon: iOS no admite transparencia, va aplanado siempre.
  writeFileSync(p("public", "apple-touch-icon.png"), await cuadrado(180, m));
  escritos.push("public/apple-touch-icon.png");

  for (const size of [192, 512]) {
    if (meta.width < size) {
      avisar(
        `${cfg.logoPath} mide ${meta.width}px: no alcanza para icon-${size}.\n` +
          `    Se omite en vez de generar un upscale pastoso. Pidele el logo original al cliente.`,
      );
      continue;
    }
    writeFileSync(p("public", `icon-${size}.png`), await cuadrado(size, m));
    escritos.push(`public/icon-${size}.png`);
  }

  /* --- tarjeta social 1200x630 --- */
  // Sin texto a proposito: el logo de este sitio ya trae el nombre y la
  // bajada, y WhatsApp imprime el titulo debajo de la imagen. Repetirlo
  // seria la tercera vez. Ver el plan, § T4.
  const OG_W = 1200, OG_H = 630;

  // El lienzo toma el color EXACTO del borde del logo. Asi no hay costura:
  // el logo trae fondo propio (alpha minimo 220, no recortable) y sobre
  // cualquier otro color se ve como un recorte flotando, o sea como una
  // imagen que no cargo. Ver el plan, § T4.1.
  const lienzo = fondoOg;

  // Recorte previo a la caja de tinta. El logo trae fondo propio y no se puede
  // recortar por alpha (el minimo es 220, no hay un solo pixel transparente).
  // Al recortar contra el color del borde, el negro que sobra se funde con el
  // lienzo y la caja deja de verse. Ademas centra de verdad: el padding del
  // logo es asimetrico y sin esto flota descentrado.
  const caja = await bboxTinta(sharp, logo, lienzo);
  const recortado = await sharp(logo).extract(caja).toBuffer();
  // Alto del logo como fraccion del lienzo. 0.30 sirve para un logo apaisado;
  // uno vertical (monograma sobre dos lineas de texto) queda perdido en el
  // centro y hay que subirlo. Por eso es config, no constante.
  const logoH = Math.round(OG_H * (cfg.ogLogoAlto ?? 0.3));
  const logoBuf = await sharp(recortado)
    .resize({ height: logoH, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // El resplandor vive ENTERO POR DEBAJO del logo. Cualquier luz detras de la
  // caja del logo delata su borde: el logo trae negro opaco y el lienzo
  // iluminado no, asi que aparece un rectangulo. La franja arranca despues
  // del borde inferior del logo, calculado, no a ojo.
  const logoBottom = (OG_H + logoH) / 2;
  const inicioGlow = Math.min(0.97, (logoBottom + 28) / OG_H);
  const glow = Buffer.from(
    `<svg width="${OG_W}" height="${OG_H}" xmlns="http://www.w3.org/2000/svg">
       <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
         <stop offset="${inicioGlow}" stop-color="${cfg.colorMarca}" stop-opacity="0"/>
         <stop offset="1" stop-color="${cfg.colorMarca}" stop-opacity="0.42"/>
       </linearGradient></defs>
       <rect width="${OG_W}" height="${OG_H}" fill="url(#g)"/>
       <rect x="0" y="${OG_H - 12}" width="${OG_W}" height="12" fill="${cfg.colorMarca}"/>
     </svg>`,
  );
  let og = await sharp({ create: { width: OG_W, height: OG_H, channels: 4, background: lienzo } })
    .composite([{ input: glow }, { input: logoBuf, gravity: "center" }])
    .jpeg({ quality: 85 })
    .toBuffer();

  // Tope duro: sobre ~300 KB WhatsApp deja de renderizar la vista previa.
  for (let q = 80; og.length > 300 * 1024 && q >= 60; q -= 10) {
    og = await sharp(og).jpeg({ quality: q }).toBuffer();
  }
  if (og.length > 300 * 1024) err(`og-image pesa ${Math.round(og.length / 1024)} KB (tope 300). WhatsApp no la renderizaria.`);
  writeFileSync(p("public", "og-image.jpg"), og);
  escritos.push("public/og-image.jpg");

  /* --- hoja de contacto para revision humana --- */
  const tiras = await Promise.all(
    [16, 32, 48].map(async (s) =>
      sharp(await cuadrado(s, s === 16 ? 0 : m * 0.5))
        .resize(160, 160, { kernel: "nearest" })
        .toBuffer(),
    ),
  );
  const preview = await sharp({ create: { width: 520, height: 180, channels: 4, background: "#ffffff" } })
    .composite(tiras.map((input, i) => ({ input, left: 10 + i * 170, top: 10 })))
    .png()
    .toBuffer();
  writeFileSync(p("public", ".brand-preview.png"), preview);
  escritos.push("public/.brand-preview.png");

  return escritos;
}

/**
 * Caja de la tinta: el rectangulo que ocupa el dibujo real, ignorando el
 * fondo plano propio del logo. Se compara contra `fondoHex` con un umbral
 * generoso porque los fondos de Lovable no son negro puro.
 */
async function bboxTinta(sharp, logo, fondoHex, umbral = 26, margen = 0.04) {
  const { data, info } = await sharp(logo).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const fr = parseInt(fondoHex.slice(1, 3), 16);
  const fg = parseInt(fondoHex.slice(3, 5), 16);
  const fb = parseInt(fondoHex.slice(5, 7), 16);
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C;
      if (data[i + 3] < 8) continue;
      const d = Math.abs(data[i] - fr) + Math.abs(data[i + 1] - fg) + Math.abs(data[i + 2] - fb);
      if (d > umbral) {
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return { left: 0, top: 0, width: W, height: H };
  const px = Math.round(W * margen);
  x0 = Math.max(0, x0 - px); y0 = Math.max(0, y0 - px);
  x1 = Math.min(W - 1, x1 + px); y1 = Math.min(H - 1, y1 + px);
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

async function colorDelBorde(sharp, logo) {
  const { data, info } = await sharp(logo).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  let r = 0, g = 0, b = 0, n = 0;
  const add = (x, y) => {
    const i = (y * W + x) * C;
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  };
  for (let x = 0; x < W; x++) { add(x, 0); add(x, H - 1); }
  for (let y = 0; y < H; y++) { add(0, y); add(W - 1, y); }
  return "#" + [r / n, g / n, b / n].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

/* ------------------------------------------------------------------ *
 * Hash de frescura
 * ------------------------------------------------------------------ */
function hashFuentes(cfg) {
  const partes = [readFileSync(p("brand.config.json"))];
  if (existsSync(p(cfg.logoPath))) partes.push(readFileSync(p(cfg.logoPath)));
  return sha(Buffer.concat(partes));
}

/* ------------------------------------------------------------------ *
 * --check
 * ------------------------------------------------------------------ */
function verificar(cfg) {
  const ico = p("public", "favicon.ico");
  if (!existsSync(ico)) {
    err(`falta public/favicon.ico. Corre: npm run marca`);
  } else {
    const h = sha(readFileSync(ico));
    if (DEFAULTS_LOVABLE[h]) {
      // El unico error que detiene el build.
      console.error(
        rojo("✗ marca: public/favicon.ico es el " + DEFAULTS_LOVABLE[h]) +
          `

  Este sitio se publicaria con el mismo icono que otros sitios de la flota.
  Cuando mandas dos enlaces de clientes distintos por WhatsApp, salen identicos.

  Corre:  npm run marca

  Es el unico caso que detiene el build.
`,
      );
      process.exit(1);
    }
  }

  const hashFile = p("public", ".brand-assets-hash");
  if (!existsSync(hashFile)) {
    avisar(`no existe public/.brand-assets-hash. Corre: npm run marca`);
  } else if (readFileSync(hashFile, "utf8").trim() !== hashFuentes(cfg)) {
    avisar(
      `los assets de public/ no corresponden al logo o al config actual.\n` +
        `    Corre:  npm run marca     y commitea lo que cambie.`,
    );
  }

  for (const f of ["public/robots.txt", "public/sitemap.xml", "public/apple-touch-icon.png", "public/og-image.jpg"]) {
    if (!existsSync(p(f))) avisar(`falta ${f}. Corre: npm run marca`);
  }

  verificarHostCanonico(cfg);
}

/**
 * Con dominio propio, el `www` tiene que redirigir — no basta con la etiqueta
 * `canonical`.
 *
 * POR QUE ESTE CHEQUEO EXISTE. El 2026-09-17 se midieron los 18 dominios de la
 * flota y tres tenian el apex y el `www` contestando los dos 200 con el mismo
 * HTML: Railen, Fibravid y Calisto. Para Google eran dos sitios y la autoridad
 * de los enlaces se partia en dos. Calisto ademas declaraba `canonical` al
 * `.workers.dev`, o sea le decia al buscador que el sitio bueno era el
 * subdominio de Cloudflare y no el dominio de la clienta.
 *
 * Los tres habian pasado el QA del onboarding entero. El QA media un solo host.
 */
function verificarHostCanonico(cfg) {
  const host = (() => {
    try {
      return new URL(cfg.dominioCanonico).host;
    } catch {
      return "";
    }
  })();

  // Sin dominio propio todavia no hay nada que redirigir: el sitio vive en su
  // .workers.dev y ese es el unico host.
  if (!host || host.endsWith(".workers.dev")) return;

  const modulo = existsSync(p("src", "lib", "host-canonico.ts"));
  const declarado = Array.isArray(cfg.redirigirHosts) && cfg.redirigirHosts.includes(`www.${host}`);

  if (!modulo) {
    err(
      `hay dominio propio (${host}) y no existe src/lib/host-canonico.ts.
` +
        `    Sin ese modulo el www contesta 200 igual que el apex y Google los ve como dos sitios.
` +
        `    Copia la plantilla de la skill onboarding-cliente y llamala desde src/server.ts.`,
    );
  }
  if (!declarado) {
    err(
      `hay dominio propio (${host}) y brand.config.json no declara "redirigirHosts": ["www.${host}"].
` +
        `    El modulo lee de ahi: sin esa linea no redirige nada.`,
    );
  }
  if (!cfg.urlRespaldo) {
    avisar(
      `falta "urlRespaldo" en brand.config.json (el .workers.dev).
` +
        `    Es el URL que conoce el cliente y el que NO se debe redirigir.`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * main
 * ------------------------------------------------------------------ */
const args = process.argv.slice(2);
const modo = args.includes("--check") ? "check" : args.includes("--sin-logo") ? "sin-logo" : "generar";

const cfg = leerConfig();
if (!existsSync(p("public"))) mkdirSync(p("public"), { recursive: true });

let escritos = [];
if (modo === "check") {
  verificar(cfg);
} else {
  escritos = generarTexto(cfg);
  if (modo === "generar") {
    escritos = escritos.concat(await generarImagenes(cfg));
    writeFileSync(p("public", ".brand-assets-hash"), hashFuentes(cfg) + "\n", "utf8");
    escritos.push("public/.brand-assets-hash");
  } else {
    avisar(
      `modo --sin-logo: no se generaron favicon, iconos ni tarjeta social.\n` +
        `    Queda pendiente pedirle el logo al cliente. NO uses el default de Lovable.`,
    );
  }
}

if (escritos.length) {
  console.log(verde(`✓ marca: ${escritos.length} archivos generados`));
  for (const f of escritos) console.log(`    ${f}`);
}
for (const a of avisos) console.log(amar("⚠ marca: ") + a);
for (const e of errores) console.log(rojo("✗ marca: ") + e);

if (errores.length) process.exit(1);
if (modo === "check" && !avisos.length) console.log(verde("✓ marca: el sitio cumple el estandar"));
process.exit(0);
