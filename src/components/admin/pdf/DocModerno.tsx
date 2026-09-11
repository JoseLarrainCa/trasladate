import {
  accionesVisibles,
  buildVars,
  formatFechaCL,
  precioFinal,
  tipoCorto,
  txt,
  verSeccion,
  type DocConfig,
  type DocState,
} from '@/lib/quote/document';
import { tipoServicioLabel } from '@/lib/quote/defaults';
import { formatCLP, m3ToBodegaM2, totalM3 } from '@/lib/quote/pricing';
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
  const t = (k: string) => txt(doc, cfg, k, vars);
  const ver = (k: string) => verSeccion(doc, k);

  const materiales = doc.materiales.map((k) => t(k)).filter(Boolean);
  const acciones = accionesVisibles(doc)
    .map((k) => t(k))
    .filter(Boolean);
  const observaciones = doc.observaciones.map((k) => t(k)).filter(Boolean);
  const destinoEsBodega = doc.cliente.destinoTipo === 'bodega';
  const servicio = tipoServicioLabel(doc.tipo_servicio);
  const detalleServicio = (doc.textos?.['detalle_servicio'] || '').trim();

  return (
    <>
    <div className="m-page">

      <div className="m-head">
        <div className="m-brand">
          <div className="name">
            TRASLAD<span className="a-org">A</span>RTE
          </div>
          {t('mod_tagline') && <div className="tag">{t('mod_tagline')}</div>}
          {ver('encabezado_contacto') && (
            <div className="meta">
              WhatsApp {e.wsp1} · {e.web}
              <br />
              {e.correo}
            </div>
          )}
        </div>
        <div className="m-title">
          <div className="t">{t('mod_titulo')}</div>
          <div className="s">
            {t('mod_lbl_folio')} <b>{doc.folio}</b>
          </div>
          <div className="s">
            {t('mod_lbl_fecha')} <b>{formatFechaCL(doc.fecha_servicio) || '—'}</b>
          </div>
        </div>
      </div>

      <hr className="m-rule" />

      {ver('cliente') && (
        <div className="m-client">
          <b>
            {t('mod_lbl_cliente')} {String(vars.nombre)}
          </b>
          <div className="sub">
            {[doc.cliente.email, doc.cliente.telefono].filter(Boolean).join(' · ')}
          </div>
        </div>
      )}

      {ver('ruta') && (
        <div className="m-ruta">
          <div className="card">
            <div className="lbl">
              {t('mod_lbl_origen')} — {tipoCorto(doc.cliente.origenTipo).toUpperCase()}
            </div>
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
            <div className="lbl">
              {t('mod_lbl_destino')} — {tipoCorto(doc.cliente.destinoTipo).toUpperCase()}
            </div>
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
      )}

      {ver('intro') && t('mod_intro') && <p className="m-intro">{t('mod_intro')}</p>}

      <table className="m-tbl">
        <thead>
          <tr>
            <th className="n">{t('mod_th_num')}</th>
            <th>{t('mod_th_desc')}</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            const filas: JSX.Element[] = [];
            if (ver('item_servicio'))
              filas.push(
                <td key="s">
                  <div className="t">
                    {servicio ? `${servicio} — ` : ''}
                    {String(vars.tipoOrigenCorto)} a {String(vars.tipoDestinoCorto)}
                  </div>
                  {detalleServicio && (
                    <div className="d" style={{ whiteSpace: 'pre-line' }}>
                      {detalleServicio}
                    </div>
                  )}
                  {t('personal_calificado') && <div className="d">{t('personal_calificado')}</div>}
                </td>
              );
            if (ver('item_equipo'))
              filas.push(
                <td key="e">
                  <div className="t">{t('mod_item_equipo')}</div>
                  <div className="d">
                    {t('mod_item_equipo_detalle')}
                    {doc.con_embalaje && materiales.length > 0 && (
                      <> · {t('mod_item_materiales')} {materiales.join(', ')}</>
                    )}
                  </div>
                </td>
              );
            if (ver('item_inventario'))
              filas.push(
                <td key="i">
                  <div className="t">
                    {t('mod_item_inventario')}
                    {destinoEsBodega && <> ≈ {m2.toFixed(1)} m² de bodega</>}
                  </div>
                  {t('mod_item_inventario_detalle') && (
                    <div className="d">{t('mod_item_inventario_detalle')}</div>
                  )}
                </td>
              );
            return filas.map((celda, i) => (
              <tr key={i}>
                <td className="n">{i + 1}</td>
                {celda}
              </tr>
            ));
          })()}
        </tbody>
      </table>

      {ver('total') && (
        <div className="m-total">
          <span>{t('mod_total')}</span>
          <span>
            {formatCLP(precio)} {doc.sin_iva && <span className="iva">{t('mod_iva')}</span>}
          </span>
        </div>
      )}

      <div className="m-cols">
        {ver('acciones') && acciones.length > 0 && (
          <div className="m-sec">
            <h4>{t('mod_h_acciones')}</h4>
            <ul>
              {acciones.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}
        {ver('pago') && (
          <div className="m-sec">
            <h4>{t('mod_h_pago')}</h4>
            <p>
              <b>{doc.cuota1}%</b> {t('pago_cuota1_label')} — {String(vars.montoCuota1)}
            </p>
            <p>
              <b>{doc.cuota2}%</b> {t('pago_cuota2_label')} — {String(vars.montoCuota2)}
            </p>
            {t('pago_saldo') && <p className="muted">{t('pago_saldo')}</p>}
          </div>
        )}
      </div>

      {ver('observaciones') && observaciones.length > 0 && (
        <div className="m-sec" style={{ marginTop: '5mm' }}>
          <h4>{t('mod_h_obs')}</h4>
          <ul>
            {observaciones.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
      )}

      {(ver('pie_transferencia') || ver('pie_contacto')) && (
        <div className="m-foot">
          {ver('pie_transferencia') && (
            <div>
              <b>{t('mod_h_transferencia')}</b>
              <br />
              {e.titular} · Rut {e.rut}
              <br />
              Banco {e.banco} · Cuenta {e.cuenta} N° {e.numero}
              <br />
              {e.correo}
            </div>
          )}
          {ver('pie_contacto') && (
            <div>
              <b>{t('mod_h_contacto')}</b>
              <br />
              WhatsApp {e.wsp1} · {e.wsp2}
              <br />
              {e.web}
              {t('mod_akikb') && (
                <>
                  <br />
                  <b>{t('mod_akikb')}</b> — {e.akikb_correo} · {e.akikb_wsp} · Oficina {e.akikb_oficina}
                </>
              )}
            </div>
          )}
        </div>
      )}
      </div>

      {ver('anexo_inventario') && <DocInventario doc={doc} variant="moderno" />}
    </>
  );

};

export default DocModerno;
