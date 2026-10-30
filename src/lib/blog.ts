/**
 * blog.ts — los artículos para el navegador. La lógica vive en `blog-core.ts`;
 * acá solo se juntan los `.md` de `src/content/blog/` con `import.meta.glob`.
 */
import { armarArticulo, ordenar, type Articulo } from "./blog-core";

const crudos = import.meta.glob("../content/blog/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const ARTICULOS: Articulo[] = ordenar(
  Object.entries(crudos).map(([ruta, texto]) => armarArticulo(ruta, texto)),
);

export function articuloPorSlug(slug: string | undefined): Articulo | undefined {
  return ARTICULOS.find((a) => a.slug === slug);
}
