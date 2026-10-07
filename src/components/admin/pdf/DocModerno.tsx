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
import DocFotos from './DocFotos';
import { MATERIALES_BODEGA, MATERIALES_DOMICILIO } from '@/lib/quote/defaults';

const MATS = Array.from(new Set([...MATERIALES_DOMICILIO, ...MATERIALES_BODEGA]));

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
      <td key="s" data-edit="item_servicio,mod_item_servicio,detalle_servicio,personal_calificado" data-edit-label="Servicio">
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
      <td key="e" data-edit="item_equipo,mod_item_equipo,mod_equipo_camion,mod_equipo_choferes,mod_equipo_personas" data-edit-label="Equipo y personal">
        {t('mod_item_equipo') && <div className="t">{t('mod_item_equipo')}</div>}
        <ul className="m-detail-list">
          {[t('mod_equipo_camion'), t('mod_equipo_choferes'), t('mod_equipo_personas')]
            .filter(Boolean)
            .map((detalle, i) => <li key={i}>{detalle}</li>)}
        </ul>
      </td>
    );
  if (ver('item_materiales') && doc.con_embalaje && materiales.length > 0)
    filas.push(
      <td key="m" data-edit={`item_materiales,mod_item_materiales,${MATS.join(",")}`} data-edit-label="Materiales">
        {t('mod_item_materiales') && <div className="t">{t('mod_item_materiales')}</div>}
        <ul className="m-detail-list">
          {materiales.map((material, i) => <li key={i}>{material}</li>)}
        </ul>
      </td>
    );
  if (ver('item_inventario'))
    filas.push(
      <td key="i" data-edit="item_inventario,mod_item_inventario,mod_item_inventario_detalle,mod_item_bodega" data-edit-label="Inventario">
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
        <div className="m-head" data-edit="encabezado_contacto,mod_marca,mod_tagline,mod_encabezado_contacto,mod_titulo,mod_lbl_folio,mod_lbl_fecha" data-edit-label="Encabezado">
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
          <div className="m-client" data-edit="cliente,mod_lbl_cliente,mod_cliente_sub" data-edit-label="Cliente">
            <b>
              {t('mod_lbl_cliente')} {String(vars.nombre)}
            </b>
            {t('mod_cliente_sub') && <div className="sub">{t('mod_cliente_sub')}</div>}
          </div>
        )}

        {ver('ruta') && (
          <div className="m-ruta" data-edit="ruta,mod_lbl_origen,mod_ruta_origen,mod_lbl_destino,mod_ruta_destino" data-edit-label="Origen y destino">
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
          <p className="m-intro" style={pre} data-edit="intro,mod_intro" data-edit-label="Introducción">
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
          <div className="m-total" data-edit="total,mod_total,mod_iva" data-edit-label="Total">
            <span>{t('mod_total')}</span>
            <span>
              {formatCLP(precio)} {doc.sin_iva && <span className="iva">{t('mod_iva')}</span>}
            </span>
          </div>
        )}

        <div className="m-cols">
          {ver('acciones') && acciones.length > 0 && (
            <div className="m-sec" data-edit={`acciones,mod_h_acciones,${doc.acciones.join(",")}`} data-edit-label="Acciones">
              {t('mod_h_acciones') && <h4>{t('mod_h_acciones')}</h4>}
              <ul>
                {acciones.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {ver('pago') && (
            <div className="m-sec" data-edit="pago,mod_h_pago,mod_pago_linea1,mod_pago_linea2,pago_saldo" data-edit-label="Forma de pago">
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
          <div className="m-sec" style={{ marginTop: '5mm' }} data-edit={`observaciones,mod_h_obs,${doc.observaciones.join(",")}`} data-edit-label="Observaciones">
            {t('mod_h_obs') && <h4>{t('mod_h_obs')}</h4>}
            <ul>
              {observaciones.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
        )}

        {(ver('pie_transferencia') || ver('pie_contacto')) && (
          <div className="m-foot" data-edit=",mod_h_transferencia,mod_transferencia_detalle,mod_h_contacto,mod_contacto_detalle,mod_akikb,mod_akikb_detalle" data-edit-label="Pie de página">
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
      {doc.con_galeria && <DocFotos doc={doc} marca={t('mod_marca')} tagline={t('mod_tagline')} />}
    </>
  );
};

export default DocModerno;
