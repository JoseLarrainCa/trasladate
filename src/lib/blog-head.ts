/**
 * blog-head.ts — el `<head>` de las páginas del blog, en los dos lados:
 *
 * - `headDelBlog(html, meta)`: en el build, reemplaza el `<head>` de la portada
 *   (título, descripción, canonical, tarjeta social y JSON-LD) por el de la
 *   página del blog. Lo usa `blog-prerender.ts`.
 * - En el navegador, `blog-meta-dom.ts` deja lo mismo en el `<head>` vivo.
 *
 * Sin DOM ni React: corre en Node durante el build.
 */
import { SITIO, urlAbsoluta, type MetaPagina } from "./blog-core";

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Un JSON-LD no puede cerrar el `<script>` aunque el texto traiga `</`. */
function ldSeguro(objeto: unknown): string {
  return JSON.stringify(objeto).replace(/</g, "\u003c");
}

export function headDelBlog(html: string, meta: MetaPagina): string {
  const url = urlAbsoluta(meta.path);
  const t = escapar(meta.title);
  const d = escapar(meta.description);
  const etiquetas = [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:type" content="${meta.tipo}" />`,
    `<meta property="og:site_name" content="${escapar(SITIO.nombre)}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:image" content="${meta.imagen}" />`,
    `<meta property="og:image:alt" content="${escapar(meta.imagenAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${meta.imagen}" />`,
    ...meta.jsonLd.map((ld) => `<script type="application/ld+json">${ldSeguro(ld)}</script>`),
  ].join("\n    ");

  const limpio = html
    .replace(/<title>[\s\S]*?<\/title>\s*/g, "")
    .replace(/<meta\s+name="description"[^>]*>\s*/g, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/g, "")
    .replace(/<meta\s+(?:property|name)="(?:og|twitter):[^"]*"[^>]*>\s*/g, "")
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, "")
    .replace(/<!--\s*Tarjeta social[\s\S]*?-->\s*/g, "");

  return limpio.replace(/<\/head>/, `    ${etiquetas}\n  </head>`);
}
