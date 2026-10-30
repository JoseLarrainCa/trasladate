/**
 * blog-core.ts — el blog, como datos y sin I/O.
 *
 * Cada artículo es un `.md` en `src/content/blog/`, copiado tal cual desde
 * `seo/clientes/trasladarte/blog/` del repo de Omnis (FULL). Publicar uno nuevo es
 * copiar el archivo, sumar su línea a `public/sitemap.xml` y desplegar.
 *
 * Este módulo lo usan DOS lados, y por eso no lee disco ni toca el DOM:
 *   1. el navegador (`blog.ts` + las páginas `/blog` y `/blog/<slug>`), y
 *   2. el build (`blog-prerender.ts`, desde `vite.config.ts`), que escribe
 *      `dist/blog.html` y `dist/blog/<slug>.html` con el título, la descripción,
 *      el canonical, el JSON-LD y el texto del artículo YA en el HTML. El sitio
 *      es una SPA: sin ese paso, Google recibiría el `<head>` de la portada y un
 *      `<div id="root">` vacío.
 *
 * Determinista: nada de `new Date()` ni `Intl` (un `AAAA-MM-DD` crudo en
 * `new Date()` es medianoche UTC, que en Chile es el día anterior).
 */
import { marked } from "marked";

/** El negocio. El blog no tiene `brand.config.json`, así que va explícito. */
export const SITIO = {
  nombre: "Trasladarte",
  url: "https://trasladarte.cl",
  logo: "https://trasladarte.cl/og-image.jpg",
} as const;

export type Articulo = {
  slug: string;
  title: string;
  description: string;
  /** `AAAA-MM-DD`, tal como viene del frontmatter. */
  fecha: string;
  /** `portada` del frontmatter (`/blog/fotos-aprobadas/<slug>/portada.webp`), o vacío. */
  imagen: string;
  imagenAlt: string;
  html: string;
};

export function urlAbsoluta(ruta: string): string {
  if (/^https?:\/\//.test(ruta)) return ruta;
  return `${SITIO.url}${ruta.startsWith("/") ? "" : "/"}${ruta}`;
}

/**
 * Separa el frontmatter (`---` … `---`) del cuerpo. Lee `clave: valor` en una
 * línea, con o sin comillas dobles. Normaliza CRLF primero.
 */
export function leerFrontmatter(texto: string): { datos: Record<string, string>; cuerpo: string } {
  const t = texto.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(t);
  if (!m) return { datos: {}, cuerpo: t };

  const datos: Record<string, string> = {};
  for (const linea of m[1].split("\n")) {
    const kv = /^([\w-]+):\s*(.*)$/.exec(linea);
    if (!kv) continue;
    let valor = kv[2].trim();
    if (valor.length >= 2 && valor.startsWith('"') && valor.endsWith('"')) {
      try {
        valor = JSON.parse(valor) as string;
      } catch {
        valor = valor.slice(1, -1);
      }
    }
    datos[kv[1]] = valor;
  }
  return { datos, cuerpo: t.slice(m[0].length) };
}

/** Los rótulos que convierten una cita (`> **Ojo:** …`) en recuadro. */
export const RECUADROS = {
  "En corto": "en-corto",
  Ojo: "ojo",
  Consejo: "consejo",
  Ejemplo: "ejemplo",
} as const;

type Rotulo = keyof typeof RECUADROS;

const PATRON_RECUADRO = new RegExp(
  `<blockquote>\\s*<p><strong>(${Object.keys(RECUADROS).join("|")}):?</strong>:?\\s*([\\s\\S]*?)</blockquote>`,
  "g",
);

/** Post-proceso del HTML de `marked`: las citas con rótulo salen como recuadro. */
export function recuadros(html: string): string {
  return html.replace(PATRON_RECUADRO, (_todo, rotulo: Rotulo, resto: string) => {
    // Si el rótulo iba solo en su línea, el primer párrafo queda vacío: se saca.
    const cuerpo = resto.startsWith("</p>") ? resto.slice(4).trim() : `<p>${resto}`.trim();
    return (
      `<aside class="blog-recuadro blog-recuadro-${RECUADROS[rotulo]}" aria-label="${rotulo}">` +
      `<p class="blog-recuadro-rotulo">${rotulo}</p>\n${cuerpo}\n</aside>\n`
    );
  });
}

/** Las fotos del cuerpo no frenan la carga de la página. */
function fotosPerezosas(html: string): string {
  return html.replace(/<img (?![^>]*loading=)/g, '<img loading="lazy" decoding="async" ');
}

export function armarArticulo(nombreArchivo: string, texto: string): Articulo {
  const { datos, cuerpo } = leerFrontmatter(texto);
  const slug = datos.slug || nombreArchivo.split("/").pop()!.replace(/\.md$/, "");
  return {
    slug,
    title: datos.title ?? slug,
    description: datos.description ?? "",
    fecha: datos.fecha ?? "",
    imagen: datos.portada ?? "",
    imagenAlt: datos.portada_alt ?? "",
    html: fotosPerezosas(recuadros(marked.parse(cuerpo, { async: false }) as string)),
  };
}

/** Del más nuevo al más antiguo. */
export function ordenar(articulos: Articulo[]): Articulo[] {
  return [...articulos].sort((a, b) =>
    a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : a.slug.localeCompare(b.slug),
  );
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** `2026-10-12` → `12 de octubre de 2026`, a mano y sin `new Date()`. */
export function fechaLarga(fecha: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!m) return fecha;
  return `${Number(m[3])} de ${MESES[Number(m[2]) - 1]} de ${m[1]}`;
}

/* ─────────────────────────── Lo que va en el <head> ─────────────────────────── */

export type MetaPagina = {
  title: string;
  description: string;
  /** Ruta canónica, sin dominio: `/blog` o `/blog/<slug>`. */
  path: string;
  imagen: string;
  imagenAlt: string;
  tipo: "website" | "article";
  jsonLd: Record<string, unknown>[];
};

const NEGOCIO_LD = {
  "@type": "Organization",
  name: SITIO.nombre,
  url: `${SITIO.url}/`,
  logo: { "@type": "ImageObject", url: SITIO.logo },
};

export const LISTADO = {
  title: "Blog de Trasladarte: guías para tu mudanza",
  description:
    "Artículos de Trasladarte para preparar tu mudanza: planes, embalaje, traslados especiales y cómo cotizar una mudanza en Santiago o a regiones.",
} as const;

export function metaListado(articulos: Articulo[]): MetaPagina {
  return {
    title: LISTADO.title,
    description: LISTADO.description,
    path: "/blog",
    imagen: articulos[0]?.imagen ? imagenSocial(articulos[0].imagen) : SITIO.logo,
    imagenAlt: articulos[0]?.imagenAlt ?? SITIO.nombre,
    tipo: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: LISTADO.title,
        description: LISTADO.description,
        url: urlAbsoluta("/blog"),
        inLanguage: "es-CL",
        publisher: NEGOCIO_LD,
        blogPost: articulos.map((a) => ({
          "@type": "BlogPosting",
          headline: a.title,
          url: urlAbsoluta(`/blog/${a.slug}`),
          datePublished: a.fecha,
        })),
      },
    ],
  };
}

/** JSON-LD `BlogPosting` del artículo. El autor y el editor son el negocio. */
export function blogPostingLd(a: Articulo): Record<string, unknown> {
  const url = urlAbsoluta(`/blog/${a.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: a.description,
    datePublished: a.fecha,
    dateModified: a.fecha,
    inLanguage: "es-CL",
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: a.imagen ? urlAbsoluta(a.imagen) : SITIO.logo,
    author: NEGOCIO_LD,
    publisher: NEGOCIO_LD,
  };
}

/**
 * La tarjeta de WhatsApp (`og:image`) usa la copia `.jpg` de 1200x630 que va al lado de la
 * portada: WhatsApp no siempre lee `.webp`.
 */
export function imagenSocial(imagen: string): string {
  return urlAbsoluta(imagen.replace(/portada\.webp$/, "portada-1200x630.jpg"));
}

export function metaArticulo(a: Articulo): MetaPagina {
  return {
    title: a.title,
    description: a.description,
    path: `/blog/${a.slug}`,
    imagen: a.imagen ? imagenSocial(a.imagen) : SITIO.logo,
    imagenAlt: a.imagenAlt || a.title,
    tipo: "article",
    jsonLd: [blogPostingLd(a)],
  };
}
