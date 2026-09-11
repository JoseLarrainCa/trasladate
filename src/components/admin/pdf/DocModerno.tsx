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
import { formatCLP } from '@/lib/quote/pricing';
import DocInventario from './DocInventario';

interface Props {
  doc: DocState;
  cfg: DocConfig;
}

const pre = { whiteSpace: 'pre-line' as const };

const DocModerno = ({ doc, cfg }: Props) => {
  const vars = buildVars(doc, cfg);
  const precio = precioFinal(doc);
  const t = (k: string) => txt(doc, cfg, k, vars);
  const ver = (k: string) => verSeccion(doc, k);


  const materiales = doc.materiales.map((k) => t(k)).filter(Boolean);
  const acciones = accionesVisibles(doc)
    .map((k) => t(k))
    .filter(Boolean);
  const observaciones = doc.observaciones.map((k) => t(k)).filter(Boolean);
  const destinoEsBodega = doc.cliente.destinoTipo === 'bodega';
  const detalleServicio = (doc.textos?.['detalle_servicio'] || '').trim();

  const filas: JSX.Element[] = [];
  if (ver('item_servicio'))
    filas.push(
      <td key="s">
        <div className="t">{t('mod_item_servicio')}</div>
        {detalleServicio && (
          <div className="d" style={pre}>
            {detalleServicio}
          </div>
        )}
        {t('personal_calificado') && <div className="d">{t('personal_calificado')}</div>}
      </td>
    );
  if (ver('item_equipo'))
    filas.push(
      <td key="e">
        {t('mod_item_equipo') && <div className="t">{t('mod_item_equipo')}</div>}
        <div className="d" style={pre}>
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
          {destinoEsBodega && t('mod_item_bodega') && <> {t('mod_item_bodega')}</>}
        </div>
        {t('mod_item_inventario_detalle') && (
          <div className="d" style={pre}>
            {t('mod_item_inventario_detalle')}
          </div>
        )}
      </td>
    );

  return (
    <>
      <div className="m-page">
        <div className="m-head">
          <div className="m-brand">
            <div className="name">{t('mod_marca')}</div>
            {t('mod_tagline') && <div className="tag">{t('mod_tagline')}</div>}
            {ver('encabezado_contacto') && t('mod_encabezado_contacto') && (
              <div className="meta" style={pre}>
                {t('mod_encabezado_contacto')}
              </div>
            )}
          </div>
          <div className="m-title">
            {t('mod_titulo') && <div className="t">{t('mod_titulo')}</div>}
            {t('mod_lbl_folio') && (
              <div className="s">
                {t('mod_lbl_folio')} <b>{doc.folio}</b>
              </div>
            )}
            {t('mod_lbl_fecha') && (
              <div className="s">
                {t('mod_lbl_fecha')} <b>{formatFechaCL(doc.fecha_servicio) || '—'}</b>
              </div>
            )}
          </div>
        </div>

        <hr className="m-rule" />

        {ver('cliente') && (
          <div className="m-client">
            <b>
              {t('mod_lbl_cliente')} {String(vars.nombre)}
            </b>
            {t('mod_cliente_sub') && <div className="sub">{t('mod_cliente_sub')}</div>}
          </div>
        )}

        {ver('ruta') && (
          <div className="m-ruta">
            <div className="card">
              <div className="lbl">
                {t('mod_lbl_origen')} — {tipoCorto(doc.cliente.origenTipo).toUpperCase()}
              </div>
              <div className="dir">{doc.cliente.origenDir}</div>
              {t('mod_ruta_origen') && (
                <div className="sub" style={pre}>
                  {t('mod_ruta_origen')}
                </div>
              )}
            </div>
            <div className="card">
              <div className="lbl">
                {t('mod_lbl_destino')} — {tipoCorto(doc.cliente.destinoTipo).toUpperCase()}
              </div>
              <div className="dir">{doc.cliente.destinoDir}</div>
              {t('mod_ruta_destino') && (
                <div className="sub" style={pre}>
                  {t('mod_ruta_destino')}
                </div>
              )}
            </div>
          </div>
        )}

        {ver('intro') && t('mod_intro') && (
          <p className="m-intro" style={pre}>
            {t('mod_intro')}
          </p>
        )}

        {filas.length > 0 && (
          <table className="m-tbl">
            <thead>
              <tr>
                <th className="n">{t('mod_th_num')}</th>
                <th>{t('mod_th_desc')}</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((celda, i) => (
                <tr key={i}>
                  <td className="n">{i + 1}</td>
                  {celda}
                </tr>
              ))}
            </tbody>
          </table>
        )}

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
              {t('mod_h_acciones') && <h4>{t('mod_h_acciones')}</h4>}
              <ul>
                {acciones.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {ver('pago') && (
            <div className="m-sec">
              {t('mod_h_pago') && <h4>{t('mod_h_pago')}</h4>}
              {t('mod_pago_linea1') && <p style={pre}>{t('mod_pago_linea1')}</p>}
              {t('mod_pago_linea2') && <p style={pre}>{t('mod_pago_linea2')}</p>}
              {t('pago_saldo') && (
                <p className="muted" style={pre}>
                  {t('pago_saldo')}
                </p>
              )}
            </div>
          )}
        </div>

        {ver('observaciones') && observaciones.length > 0 && (
          <div className="m-sec" style={{ marginTop: '5mm' }}>
            {t('mod_h_obs') && <h4>{t('mod_h_obs')}</h4>}
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
              <div style={pre}>
                <b>{t('mod_h_transferencia')}</b>
                {'\n'}
                {t('mod_transferencia_detalle')}
              </div>
            )}
            {ver('pie_contacto') && (
              <div style={pre}>
                <b>{t('mod_h_contacto')}</b>
                {'\n'}
                {t('mod_contacto_detalle')}
                {ver('pie_akikb') && t('mod_akikb') && (
                  <>
                    {'\n'}
                    <b>{t('mod_akikb')}</b> — {t('mod_akikb_detalle')}
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
