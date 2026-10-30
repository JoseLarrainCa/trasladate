/**
 * blog-meta-dom.ts — en el navegador, deja en el `<head>` vivo el título, la
 * descripción y el canonical de la página del blog. El HTML que llega del
 * servidor ya los trae (`blog-prerender.ts`); esto cubre el caso de llegar sin
 * recargar la página.
 */
import { useEffect } from "react";
import { urlAbsoluta, type MetaPagina } from "./blog-core";

function fijarMeta(atributo: "name" | "property", clave: string, valor: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${atributo}="${clave}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(atributo, clave);
    document.head.appendChild(el);
  }
  el.setAttribute("content", valor);
}

export function usarMetaDelBlog(meta: MetaPagina | null) {
  useEffect(() => {
    if (!meta) return;
    const url = urlAbsoluta(meta.path);
    document.title = meta.title;
    fijarMeta("name", "description", meta.description);
    fijarMeta("property", "og:url", url);
    fijarMeta("property", "og:title", meta.title);
    fijarMeta("property", "og:description", meta.description);
    fijarMeta("property", "og:image", meta.imagen);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }, [meta]);
}
