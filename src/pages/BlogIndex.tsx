import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { ARTICULOS } from '@/lib/blog';
import { fechaLarga, metaListado } from '@/lib/blog-core';
import { usarMetaDelBlog } from '@/lib/blog-meta-dom';

const META = metaListado(ARTICULOS);

/** /blog — el listado, con las tarjetas redondeadas y el naranjo de la portada. */
const BlogIndex = () => {
  usarMetaDelBlog(META);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="bg-muted/50 border-b border-border">
          <div className="container mx-auto px-4 pt-14 pb-12 md:pt-20 md:pb-16">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              Blog
            </span>
            <h1 className="mt-5 font-heading text-4xl md:text-6xl font-bold leading-tight text-foreground">
              Guías para <span className="text-gradient">tu mudanza</span>
            </h1>
            <p className="mt-5 text-muted-foreground text-lg max-w-xl leading-relaxed">
              Lo que conviene saber antes de mudarte: qué plan elegir, cómo embalar y cómo cotizar, contado por
              nosotros en Trasladarte.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-14 md:py-20">
          <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {ARTICULOS.map((a) => (
              <li key={a.slug} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                <a href={`/blog/${a.slug}`} className="group flex h-full flex-col">
                  {a.imagen && (
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={a.imagen}
                        alt={a.imagenAlt}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-6 md:p-7">
                    <time dateTime={a.fecha} className="text-sm text-muted-foreground">
                      {fechaLarga(a.fecha)}
                    </time>
                    <h2 className="mt-3 font-heading text-xl md:text-2xl font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                      {a.title}
                    </h2>
                    <p className="mt-3 text-muted-foreground leading-relaxed">{a.description}</p>
                    <span className="mt-auto pt-6 font-semibold text-primary">Leer artículo →</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default BlogIndex;
