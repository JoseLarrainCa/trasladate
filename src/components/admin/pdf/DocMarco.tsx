import {
  agruparInventario,
  buildVars,
  precioFinal,
  txt,
  LETRAS,
  formatFechaCL,
  type DocConfig,
  type DocState,
} from '@/lib/quote/document';
import { camionLabel, formatCLP, totalM3 } from '@/lib/quote/pricing';
import { dosDigitos, espaciar, espaciarDigitos } from '@/lib/quote/templates';

const Brand = () => (
  <div>
    <div className="d-brand">
      TRASLAD<span className="a-org">A</span>RTE
    </div>
    <div className="d-sub">LA GRAN AVENTURA DE MUDARTE</div>
  </div>
);

const Head = ({ folio, fecha }: { folio: number; fecha: string }) => (
  <>
    <div className="d-head">
      <div className="d-cot">COTIZACIÓN</div>
      <Brand />
    </div>
    <div className="d-meta">
      <div>
        <b>N° Servicio:</b> <i>{folio}</i>
      </div>
      <div>
        <b>Fecha de Servicio:</b> <i>{fecha || '—'}</i>
      </div>
    </div>
  </>
);

/** Resalta TODO / TODOS LOS MUEBLES GRANDES en negrita */
const Enfasis = ({ text }: { text: string }) => {
  const parts = text.split(/(TODOS LOS MUEBLES GRANDES|TODO)/g);
  return (
    <>
      {parts.map((p, i) =>
        p === 'TODO' || p === 'TODOS LOS MUEBLES GRANDES' ? <b key={i}>{p}</b> : <span key={i}>{p}</span>
      )}
    </>
  );
};

interface Props {
  doc: DocState;
  cfg: DocConfig;
}

const DocMarco = ({ doc, cfg }: Props) => {
  const vars = buildVars(doc, cfg);
  const fecha = formatFechaCL(doc.fecha_servicio);
  const m3 = totalM3(doc.inventario);
  const e = cfg.empresa;

  const materiales = doc.materiales.map((k) => txt(doc, cfg, k, vars)).filter(Boolean);
  const accionesKeys = doc.acciones.filter((k) => {
    if (!doc.con_embalaje && (k === 'accion_embalar' || k === 'accion_desembalar')) return false;
    if (!doc.armado_camas && k === 'accion_camas') return false;
    return true;
  });
  const acciones = accionesKeys.map((k) => txt(doc, cfg, k, vars)).filter(Boolean);
  const observaciones = doc.observaciones.map((k) => txt(doc, cfg, k, vars)).filter(Boolean);

  const saludoCuerpo = txt(doc, cfg, 'saludo_cuerpo', vars);
  const personalCalificado = txt(doc, cfg, 'personal_calificado', vars);
  const seTrasladara = txt(doc, cfg, 'se_trasladara', vars);
  const precio = precioFinal(doc);

  return (
    <>
      {/* ---------------- Página 1 ---------------- */}
      <div className="page">
        <Head folio={doc.folio} fecha={fecha} />
        <div className="d-box">
          <div className="d-lbl">Descripción General:</div>
          <p className="d-p">
            Estimado <i style={{ color: '#1e46c8', fontWeight: 700 }}>{String(vars.nombreCorto)}</i>,
          </p>
          {saludoCuerpo && <p className="d-p indent">{saludoCuerpo}</p>}

          <div className="d-title">{espaciar(doc.titulo_servicio)}</div>

          {personalCalificado && <p className="d-star">* {personalCalificado}</p>}
          {seTrasladara && <p className="d-star">* {seTrasladara}</p>}

          <p className="d-p indent">
            El detalle completo del inventario declarado por el cliente ({doc.inventario.length} líneas) se
            adjunta en la <b>hoja anexa</b> al final de esta cotización.
          </p>


          {materiales.length > 0 && (
            <>
              <p className="d-star">* Materiales a utilizar:</p>
              <div className="mat-list">
                {materiales.map((m, i) => (
                  <div key={i}>{m}</div>
                ))}
              </div>
            </>
          )}

          <div className="seal">
            <div className="s1">100%</div>
            <div className="s2">BEST SERVICE</div>
          </div>
        </div>
      </div>

      {/* ---------------- Página 2 ---------------- */}
      <div className="page">
        <Head folio={doc.folio} fecha={fecha} />

        <div className="d-client">
          <div className="k">Cliente:</div>
          <div className="v">{String(vars.nombre)}</div>
          <div className="k">Email:</div>
          <div className="v">{doc.cliente.email || ''}</div>
          <div className="k">Domicilio Origen:</div>
          <div className="v">{doc.cliente.origenDir}</div>
          <div className="k">Domicilio Destino:</div>
          <div className="v">{doc.cliente.destinoDir}</div>
          <div className="k">Comuna:</div>
          <div className="v">{doc.cliente.origenComuna}</div>
          <div className="k">Comuna:</div>
          <div className="v">{doc.cliente.destinoComuna}</div>
        </div>

        <table className="d-tbl">
          <thead>
            <tr>
              <th style={{ width: '22mm' }}>CANTIDAD</th>
              <th>PERSONAL + MATERIALES</th>
              <th style={{ width: '34mm' }}>VALOR</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="c">{dosDigitos(doc.camion_qty)}</td>
              <td>{camionLabel(doc.camion)}</td>
              <td className="v" />
            </tr>
            <tr>
              <td className="c">{dosDigitos(doc.camion_qty)}</td>
              <td>{txt(doc, cfg, 'fila_chofer', vars)}</td>
              <td className="v" />
            </tr>
            <tr>
              <td className="c">{dosDigitos(doc.personas)}</td>
              <td>{txt(doc, cfg, 'fila_personas', vars)}</td>
              <td className="v" />
            </tr>
            {doc.con_embalaje && (
              <tr>
                <td className="c">01</td>
                <td>
                  <div>{txt(doc, cfg, 'fila_embalaje', vars)}</div>
                  <div>{txt(doc, cfg, 'fila_embalaje_incluye', vars)}</div>
                  <div className="d-emb">
                    {materiales.map((m, i) => (
                      <span key={i}>{m}</span>
                    ))}
                  </div>
                </td>
                <td className="v" />
              </tr>
            )}
            <tr className="d-total">
              <td className="c" />
              <td>TOTAL</td>
              <td className="v">{formatCLP(precio)}</td>
            </tr>
          </tbody>
        </table>

        {acciones.length > 0 && (
          <div className="d-do">
            <div className="d-lbl">LO QUE HAREMOS:</div>
            {acciones.map((a, i) => (
              <p key={i}>
                * <Enfasis text={a} />
              </p>
            ))}
          </div>
        )}

        {observaciones.length > 0 && (
          <div className="d-obs">
            <div className="d-lbl">OBSERVACIONES :</div>
            {observaciones.map((o, i) => (
              <p key={i}>
                <b>{LETRAS[i]}.-</b> {o}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* ---------------- Página 3 ---------------- */}
      <div className="page">
        <Head folio={doc.folio} fecha={fecha} />

        <div className="d-pay">
          <div className="row">
            <div className="d-lbl">Forma de pago:</div>
            {doc.sin_iva && <div style={{ fontWeight: 700 }}>{txt(doc, cfg, 'nota_iva', vars)}</div>}
          </div>
          <div className="cuota">
            <b>{doc.cuota1}%</b> {txt(doc, cfg, 'pago_cuota1_label', vars)} — <b>{String(vars.montoCuota1)}</b>
          </div>
          <div className="cuota">
            <b>{doc.cuota2}%</b> {txt(doc, cfg, 'pago_cuota2_label', vars)} — <b>{String(vars.montoCuota2)}</b>
          </div>

          <p className="d-p" style={{ marginTop: '4mm' }}>
            {txt(doc, cfg, 'pago_intro', vars)}
          </p>

          <div className="d-bank">
            <div className="r">
              <div className="k">Nombres:</div>
              <div className="v">{e.titular}</div>
            </div>
            <div className="r">
              <div className="k">Banco:</div>
              <div className="v">{e.banco}</div>
            </div>
            <div className="r">
              <div className="k">Cuenta:</div>
              <div className="v">{e.cuenta}</div>
            </div>
            <div className="r">
              <div className="k">N° Cuenta:</div>
              <div className="v">{espaciarDigitos(e.numero)}</div>
            </div>
            <div className="r">
              <div className="k">Rut:</div>
              <div className="v">{e.rut}</div>
            </div>
            <div className="r">
              <div className="k">Correo:</div>
              <div className="v">{e.correo}</div>
            </div>
          </div>

          {(() => {
            const saldo = txt(doc, cfg, 'pago_saldo', vars);
            if (!saldo) return null;
            const marca = 'pero antes de realizar la descarga';
            const idx = saldo.indexOf(marca);
            if (idx === -1) return <p className="d-p">{saldo}</p>;
            return (
              <p className="d-p">
                {saldo.slice(0, idx)}
                <b>{marca}</b>
                {saldo.slice(idx + marca.length)}
              </p>
            );
          })()}
        </div>

        <div className="d-contact">
          <div className="band blue">
            <div className="logo">TRASLADARTE</div>
            <div>
              <span className="k">WhatsApp:</span> <span className="v">{e.wsp1}</span>
            </div>
            <div>
              <span className="k">WhatsApp:</span> <span className="v">{e.wsp2}</span>
            </div>
            <div>
              <span className="k">Página Web:</span> <span className="v">{e.web}</span>
            </div>
          </div>
          <div className="band black">
            <div className="logo akikb">akikb</div>
            <div>
              <span className="k">Email:</span> <span className="v">{e.akikb_correo}</span>
            </div>
            <div>
              <span className="k">WhatsApp:</span> <span className="v">{e.akikb_wsp}</span>
            </div>
            <div>
              <span className="k">Oficina:</span> <span className="v">{e.akikb_oficina}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Hoja anexa: inventario ---------------- */}
      <DocInventario doc={doc} variant="marco" header={<Head folio={doc.folio} fecha={fecha} />} />


      {/* ---------------- Página 4 (opcional) ---------------- */}
      {doc.con_galeria && (
        <div className="page d-gallery">
          <Head folio={doc.folio} fecha={fecha} />
          <h3>NUESTROS EMBALAJES PARA MUDANZAS HACIA BODEGA</h3>
          <div className="grid">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div className="ph" key={i}>
                Foto pendiente
              </div>
            ))}
          </div>
          <h3>NUESTROS EMBALAJES PARA MUDANZAS ENTRE CASAS o DPTOS</h3>
          <div className="grid">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div className="ph" key={i}>
                Foto pendiente
              </div>
            ))}
          </div>
        </div>
      )}

      {/* referencia interna: m³ del servicio {m3.toFixed(1)} — no se imprime */}
      <span style={{ display: 'none' }}>{m3.toFixed(1)}</span>
      <span style={{ display: 'none' }}>{agruparInventario(doc.inventario).length}</span>
    </>
  );
};

export default DocMarco;
