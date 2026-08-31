import { agruparInventario, type DocState } from '@/lib/quote/document';
import { m3ToBodegaM2, totalItems, totalM3 } from '@/lib/quote/pricing';
import { dosDigitos } from '@/lib/quote/templates';

interface Props {
  doc: DocState;
  /** 'marco' usa el marco naranjo del formato 1; 'moderno' el estilo limpio. */
  variant: 'marco' | 'moderno';
  header?: React.ReactNode;
}

/** Hoja anexa con el inventario declarado por el cliente. */
const DocInventario = ({ doc, variant, header }: Props) => {
  const grupos = agruparInventario(doc.inventario);
  const m3 = totalM3(doc.inventario);
  const m2 = m3ToBodegaM2(m3);
  const items = totalItems(doc.inventario);

  if (grupos.length === 0) return null;

  const contenido = (
    <>
      <div className="anx-title">INVENTARIO DECLARADO POR EL CLIENTE</div>
      <div className="anx-sub">
        N° Servicio {doc.folio} · {items} ítems · {m3.toFixed(1)} m³ · ≈ {m2.toFixed(1)} m² de bodega
      </div>

      <div className="anx-cats">
        {grupos.map((g) => (
          <div className="anx-cat" key={g.category}>
            <div className="anx-cat-h">{g.category}</div>
            <table className="anx-tbl">
              <tbody>
                {g.items.map((l, i) => (
                  <tr key={l.item_key + i}>
                    <td className="q">{dosDigitos(l.qty)}</td>
                    <td>{l.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="anx-note">
        * Inventario referencial entregado por el cliente. Cualquier ítem adicional el día del servicio puede
        modificar el volumen y el valor cotizado.
      </div>
    </>
  );

  if (variant === 'marco') {
    return (
      <div className="page">
        {header}
        <div className="d-box auto anx-box">{contenido}</div>
      </div>
    );
  }

  return <div className="m-page anx-moderno">{contenido}</div>;
};

export default DocInventario;
