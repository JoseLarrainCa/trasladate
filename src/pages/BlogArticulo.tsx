import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import NotFound from '@/pages/NotFound';
import { articuloPorSlug } from '@/lib/blog';
import { fechaLarga, metaArticulo } from '@/lib/blog-core';
import { usarMetaDelBlog } from '@/lib/blog-meta-dom';

/** /blog/<slug> — un artículo. El HTML sale de `marked` + los recuadros (`blog-core.ts`). */
const BlogArticulo = () => {
  const { slug } = useParams();
  const articulo = articuloPorSlug(slug);
  const meta = useMemo(() => (articulo ? metaArticulo(articulo) : null), [articulo]);
  usarMetaDelBlog(meta);

  if (!articulo) return <NotFound />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <header className="container mx-auto px-4 max-w-4xl pt-10 md:pt-14">
          <a href="/blog" className="text-sm font-semibold text-primary hover:underline">
            ← Blog
          </a>
          <h1 className="mt-5 font-heading text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-foreground">
            {articulo.title}
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-2xl">{articulo.description}</p>
          <p className="mt-5 text-sm text-muted-foreground">
            <time dateTime={articulo.fecha}>{fechaLarga(articulo.fecha)}</time> · Trasladarte
          </p>
        </header>

        <div className="container mx-auto px-4 max-w-4xl">
          {articulo.imagen && (
            <img
              src={articulo.imagen}
              alt={articulo.imagenAlt}
              width={1600}
              height={900}
              className="mt-8 w-full aspect-[16/9] object-cover rounded-2xl shadow-card"
            />
          )}
          <article
            className="blog-cuerpo mx-auto max-w-[68ch] pt-10"
            dangerouslySetInnerHTML={{ __html: articulo.html }}
          />
          <div className="mx-auto max-w-[68ch] mt-12 mb-20 rounded-2xl bg-secondary p-8 text-secondary-foreground">
            <p className="font-heading text-2xl font-bold">Cotiza tu mudanza</p>
            <p className="mt-3 text-secondary-foreground/80 leading-relaxed">
              Cuéntanos qué llevas, desde dónde y hacia dónde, y te armamos el presupuesto sin costo.
            </p>
            <a
              href="/#cotizacion"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cta-gradient px-6 py-3.5 font-semibold text-primary-foreground shadow-cta hover:opacity-90 transition-opacity"
            >
              Cotizar ahora
            </a>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default BlogArticulo;
