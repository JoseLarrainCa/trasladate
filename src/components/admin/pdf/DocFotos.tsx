import foto1 from '@/assets/gallery/foto1.jpeg';
import foto2 from '@/assets/gallery/foto2.jpeg';
import foto3 from '@/assets/gallery/foto3.jpeg';
import foto4 from '@/assets/gallery/foto4.jpeg';
import foto6 from '@/assets/gallery/foto6.jpeg';
import foto8 from '@/assets/gallery/foto8.jpeg';
import { formatFechaCL, type DocState } from '@/lib/quote/document';

const grupos = [
  {
    numero: '01',
    titulo: 'Embalaje y protección',
    fotos: [
      { src: foto1, titulo: 'Preparación de objetos' },
      { src: foto4, titulo: 'Cuidado de muebles' },
      { src: foto2, titulo: 'Protección durante el traslado' },
    ],
  },
  {
    numero: '02',
    titulo: 'Carga y traslado',
    fotos: [
      { src: foto3, titulo: 'Carga del camión' },
      { src: foto6, titulo: 'Traslado de piano' },
      { src: foto8, titulo: 'Descarga en destino' },
    ],
  },
];

export default function DocFotos({ doc, marca, tagline }: { doc: DocState; marca: string; tagline: string }) {
  return (
    <div className="m-page m-photo-page">
      <div className="m-head">
        <div className="m-brand">
          <div className="name">{marca}</div>
          {tagline && <div className="tag">{tagline}</div>}
        </div>
        <div className="m-title">
          <div className="s">Cotización <b>{doc.folio}</b></div>
          <div className="s">{formatFechaCL(doc.fecha_servicio)}</div>
        </div>
      </div>
      <hr className="m-rule" />
      <div className="m-photo-heading">
        <div className="m-photo-eyebrow">NUESTRO TRABAJO</div>
        <h2>Cuidado en cada mudanza</h2>
      </div>
      {grupos.map((grupo) => (
        <section className="m-photo-section" key={grupo.numero}>
          <h3><span>{grupo.numero}</span>{grupo.titulo}</h3>
          <div className="m-photo-grid">
            {grupo.fotos.map((foto) => (
              <figure key={foto.src}>
                <img src={foto.src} alt={foto.titulo} />
                <figcaption>{foto.titulo}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
      <div className="m-photo-footer">Fotografías de trabajos realizados por Trasladarte · www.trasladarte.cl</div>
    </div>
  );
}