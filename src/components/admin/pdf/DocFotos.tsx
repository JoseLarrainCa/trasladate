import foto1 from '@/assets/gallery/foto1.jpeg';
import foto2 from '@/assets/gallery/foto2.jpeg';
import foto3 from '@/assets/gallery/foto3.jpeg';
import foto4 from '@/assets/gallery/foto4.jpeg';
import foto5 from '@/assets/gallery/foto5.jpeg';
import foto6 from '@/assets/gallery/foto6.jpeg';
import { formatFechaCL, type DocState } from '@/lib/quote/document';

const fotos = [
  { src: foto3, titulo: 'Carga coordinada', detalle: 'Equipo preparado para cada etapa', clase: 'm-photo-feature' },
  { src: foto1, titulo: 'Embalaje cuidadoso', detalle: 'Protección desde el primer objeto', clase: 'm-photo-tall m-photo-pack' },
  { src: foto2, titulo: 'Muebles protegidos', detalle: 'Manipulación segura en espacios exigentes', clase: 'm-photo-tall m-photo-protect' },
  { src: foto6, titulo: 'Objetos especiales', detalle: 'Experiencia en traslados delicados', clase: 'm-photo-tall m-photo-special' },
  { src: foto4, titulo: 'Soluciones a medida', detalle: 'Desarme y preparación profesional', clase: 'm-photo-detail' },
  { src: foto5, titulo: 'Cobertura y capacidad', detalle: 'Flota preparada para grandes mudanzas', clase: 'm-photo-wide' },
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
        <div>
          <div className="m-photo-eyebrow">NUESTRO TRABAJO</div>
          <h2>Cuidado en cada mudanza</h2>
        </div>
        <p>Protegemos cada objeto y coordinamos cada etapa con un equipo que sabe lo que hace.</p>
      </div>
      <section className="m-photo-story" aria-label="Trabajos realizados por Trasladarte">
        {fotos.map((foto, indice) => (
          <figure className={`m-photo-card ${foto.clase}`} key={foto.src}>
            <img src={foto.src} alt={foto.titulo} />
            <figcaption>
              <span className="m-photo-number">{String(indice + 1).padStart(2, '0')}</span>
              <span className="m-photo-caption">
                <strong>{foto.titulo}</strong>
                <small>{foto.detalle}</small>
              </span>
            </figcaption>
          </figure>
        ))}
      </section>
      <div className="m-photo-footer">
        <span>Fotografías de trabajos realizados por Trasladarte</span>
        <b>www.trasladarte.cl</b>
      </div>
    </div>
  );
}