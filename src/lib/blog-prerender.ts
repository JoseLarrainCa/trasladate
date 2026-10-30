/**
 * blog-prerender.ts — plugin de Vite que escribe el HTML del blog en el build.
 *
 * El sitio es una SPA: el Worker sirve el mismo `index.html` para cualquier
 * ruta y React dibuja después. Para Google eso es un `<head>` de la portada y un
 * `<div id="root">` vacío. Este paso, al terminar `vite build`, escribe:
 *
 *   dist/blog.html            → /blog            (el listado)
 *   dist/blog/<slug>.html     → /blog/<slug>     (cada artículo)
 *   dist/blog/slugs.json      → la lista que usa el Worker para el 404
 *
 * con el `<head>` propio de cada página y el texto del artículo dentro de
 * `#root`. Cloudflare sirve `blog.html` para `/blog` sin redirigir (manejo de
 * HTML por defecto), y React reemplaza ese contenido al cargar.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { armarArticulo, fechaLarga, metaArticulo, metaListado, ordenar, type Articulo } from "./blog-core";
import { headDelBlog } from "./blog-head";

function escapar(texto: string): string {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function cuerpoListado(articulos: Articulo[]): string {
  const items = articulos
    .map(
      (a) =>
        `<li><a href="/blog/${a.slug}"><h2>${escapar(a.title)}</h2></a>` +
        `<p>${escapar(a.description)}</p><p>${fechaLarga(a.fecha)}</p></li>`,
    )
    .join("");
  return `<main><h1>Blog</h1><ul>${items}</ul></main>`;
}

function cuerpoArticulo(a: Articulo): string {
  const portada = a.imagen ? `<img src="${a.imagen}" alt="${escapar(a.imagenAlt)}" width="1600" height="900" />` : "";
  return (
    `<main><article><p><a href="/blog">Blog</a></p><h1>${escapar(a.title)}</h1>` +
    `<p><time datetime="${a.fecha}">${fechaLarga(a.fecha)}</time></p>${portada}${a.html}</article></main>`
  );
}

function conRoot(html: string, contenido: string): string {
  return html.replace(/<div id="root"><\/div>/, `<div id="root">${contenido}</div>`);
}

export function blogPrerender(raiz: string): Plugin {
  return {
    name: "blog-prerender",
    apply: "build",
    closeBundle() {
      const dist = join(raiz, "dist");
      const carpeta = join(raiz, "src", "content", "blog");
      const articulos = ordenar(
        readdirSync(carpeta)
          .filter((f) => f.endsWith(".md"))
          .map((f) => armarArticulo(f, readFileSync(join(carpeta, f), "utf8"))),
      );
      const base = readFileSync(join(dist, "index.html"), "utf8");

      mkdirSync(join(dist, "blog"), { recursive: true });
      writeFileSync(
        join(dist, "blog.html"),
        conRoot(headDelBlog(base, metaListado(articulos)), cuerpoListado(articulos)),
      );
      for (const a of articulos) {
        writeFileSync(
          join(dist, "blog", `${a.slug}.html`),
          conRoot(headDelBlog(base, metaArticulo(a)), cuerpoArticulo(a)),
        );
      }
      writeFileSync(join(dist, "blog", "slugs.json"), JSON.stringify(articulos.map((a) => a.slug)));
    },
  };
}
