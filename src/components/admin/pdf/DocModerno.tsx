import {
  accionesVisibles,
  buildVars,
  formatFechaCL,
  precioFinal,
  tipoCorto,
  txt,
  type DocConfig,
  type DocState,
} from '@/lib/quote/document';
import { tipoServicioLabel } from '@/lib/quote/defaults';
import { camionLabel, formatCLP, m3ToBodegaM2, totalM3 } from '@/lib/quote/pricing';
import DocInventario from './DocInventario';

interface Props {
  doc: DocState;
  cfg: DocConfig;
}

const DocModerno = ({ doc, cfg }: Props) => {
  const vars = buildVars(doc, cfg);
  const e = cfg.empresa;
  const m3 = totalM3(doc.inventario);
  const m2 = m3ToBodegaM2(m3);
  const precio = precioFinal(doc);

  const materiales = doc.materiales.map((k) => txt(doc, cfg, k, vars)).filter(Boolean);
  const acciones = doc.acciones
    .filter((k) => {
      if (!doc.con_embalaje && (k === 'accion_embalar' || k === 'accion_desembalar')) return false;
      if (!doc.armado_camas && k === 'accion_camas') return false;
      return true;
    })
    .map((k) => txt(doc, cfg, k, vars))
    .filter(Boolean);
  const observaciones = doc.observaciones.map((k) => txt(doc, cfg, k, vars)).filter(Boolean);
  const destinoEsBodega = doc.cliente.destinoTipo === 'bodega';

  return (
    <>
    <div className="m-page">

      <div className="m-head">
        <div className="m-brand">
          <div className="name">
            TRASLAD<span className="a-org">A</span>RTE
          </div>
          <div className="tag">LA GRAN AVENTURA DE MUDARTE</div>
          <div className="meta">
            {e.titular}
            <br />
            WhatsApp {e.wsp1} · {e.web}
            <br />
            {e.correo}
          </div>
        </div>
        <div className="m-title">
          <div className="t">COTIZACIÓN</div>
          <div className="s">
            N° Servicio: <b>{doc.folio}</b>
          </div>
          <div className="s">
            Fecha: <b>{formatFechaCL(doc.fecha_servicio) || '—'}</b>
          </div>
        </div>
      </div>

      <hr className="m-rule" />

      <div className="m-client">
        <b>Sr(a): {String(vars.nombre)}</b>
        <div className="sub">
          {[doc.cliente.email, doc.cliente.telefono].filter(Boolean).join(' · ')}
        </div>
      </div>

      <div className="m-ruta">
        <div className="card">
          <div className="lbl">ORIGEN</div>
          <div className="dir">{doc.cliente.origenDir}</div>
          <div className="sub">
            {[
              doc.cliente.origenComuna,
              doc.cliente.origenPiso ? `piso ${doc.cliente.origenPiso}` : '',
              doc.cliente.origenAscensor ? 'con ascensor' : 'sin ascensor',
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>
        <div className="card">
          <div className="lbl">DESTINO</div>
          <div className="dir">{doc.cliente.destinoDir}</div>
          <div className="sub">
            {[
              doc.cliente.destinoComuna,
              doc.cliente.destinoPiso ? `piso ${doc.cliente.destinoPiso}` : '',
              doc.cliente.destinoAscensor ? 'con ascensor' : 'sin ascensor',
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>
      </div>

      <p className="m-intro">{doc.saludo}, tengo el agrado de cotizar para Ud. lo siguiente:</p>

      <table className="m-tbl">
        <thead>
          <tr>
            <th className="n">#</th>
            <th>DESCRIPCIÓN DEL SERVICIO</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="n">1</td>
            <td>
              <div className="t">
                {doc.titulo_servicio} — {String(vars.tipoOrigenCorto)} a {String(vars.tipoDestinoCorto)}
              </div>
              <div className="d">{txt(doc, cfg, 'personal_calificado', vars)}</div>
            </td>
          </tr>
          <tr>
            <td className="n">2</td>
            <td>
              <div className="t">Equipo y personal</div>
              <div className="d">
                {camionLabel(doc.camion)} × {doc.camion_qty} · {doc.camion_qty}{' '}
                {doc.camion_qty === 1 ? 'chofer' : 'choferes'} · {doc.personas} personas operativas
                {doc.con_embalaje && materiales.length > 0 && (
                  <> · Materiales incluidos: {materiales.join(', ')}</>
                )}
              </div>
            </td>
          </tr>
          <tr>
            <td className="n">3</td>
            <td>
              <div className="t">
                Inventario a trasladar — {String(vars.items)} ítems · {m3.toFixed(1)} m³
                {destinoEsBodega && <> ≈ {m2.toFixed(1)} m² de bodega</>}
              </div>
              <div className="d">Detalle completo en la hoja anexa de inventario.</div>
            </td>
          </tr>

        </tbody>
      </table>

      <div className="m-total">
        <span>TOTAL A PAGAR</span>
        <span>
          {formatCLP(precio)} {doc.sin_iva && <span className="iva">(no incluye IVA)</span>}
        </span>
      </div>

      <div className="m-cols">
        <div className="m-sec">
          <h4>LO QUE HAREMOS</h4>
          <ul>
            {acciones.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
        <div className="m-sec">
          <h4>FORMA DE PAGO</h4>
          <p>
            <b>{doc.cuota1}%</b> {txt(doc, cfg, 'pago_cuota1_label', vars)} — {String(vars.montoCuota1)}
          </p>
          <p>
            <b>{doc.cuota2}%</b> {txt(doc, cfg, 'pago_cuota2_label', vars)} — {String(vars.montoCuota2)}
          </p>
          <p className="muted">{txt(doc, cfg, 'pago_saldo', vars)}</p>
        </div>
      </div>

      {observaciones.length > 0 && (
        <div className="m-sec" style={{ marginTop: '5mm' }}>
          <h4>OBSERVACIONES</h4>
          <ul>
            {observaciones.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="m-foot">
        <div>
          <b>Datos de transferencia</b>
          <br />
          {e.titular} · Rut {e.rut}
          <br />
          Banco {e.banco} · Cuenta {e.cuenta} N° {e.numero}
          <br />
          {e.correo}
        </div>
        <div>
          <b>Contacto</b>
          <br />
          WhatsApp {e.wsp1} · {e.wsp2}
          <br />
          {e.web}
          <br />
          <b>Mini bodegas akikb</b> — {e.akikb_correo} · {e.akikb_wsp} · Oficina {e.akikb_oficina}
        </div>
      </div>
      </div>

      <DocInventario doc={doc} variant="moderno" />
    </>
  );

};

export default DocModerno;
