import pdfCss from '@/styles/quote-pdf.css?raw';

/** Abre el diálogo de impresión con el documento aislado en un iframe A4. */
export function imprimirDocumento(node: HTMLElement | null, titulo = 'Cotizacion') {
  if (!node) return;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${titulo}</title>
<style>${pdfCss}
html,body{margin:0;padding:0;background:#fff;}
*,*::before,*::after{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;color-adjust:exact !important;}
#doc{transform:none !important;zoom:1 !important;width:210mm;margin:0;}
.doc-scale-wrap{overflow:visible !important;height:auto !important;}
</style></head><body>${node.outerHTML}</body></html>`);
  doc.close();

  const run = async () => {
    // Las fotografías deben estar listas antes de medir las hojas o abrir la impresión.
    await Promise.all(Array.from(doc.images).map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        image.addEventListener('load', () => resolve(), { once: true });
        image.addEventListener('error', () => resolve(), { once: true });
      });
    }));
    await doc.fonts.ready;
    // Cada hoja debe caber en UNA página (A4 o Carta): si el contenido es más alto, se reduce.
    const mm = 96 / 25.4;
    const maxH = 277 * mm; // alto útil seguro para Carta (279mm) y A4 (297mm)
    const maxW = 210 * mm;
    doc.querySelectorAll<HTMLElement>('.m-page, .page').forEach((p, i, all) => {
      const st = p.style as CSSStyleDeclaration & { zoom: string };
      p.style.minHeight = '0';
      let z = 1;
      // Al reducir, se ensancha la hoja en proporción para que siga ocupando todo el ancho del papel.
      for (let n = 0; n < 6; n++) {
        p.style.width = `${maxW / z}px`;
        const h = p.scrollHeight;
        if (h * z <= maxH + 1) break;
        z = Math.max(0.4, maxH / h);
      }
      if (z < 1) st.zoom = String(z);
      else p.style.width = '';
      p.style.breakAfter = i < all.length - 1 ? 'page' : 'auto';
      p.style.breakInside = 'avoid';
    });
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    window.setTimeout(() => {
      if (iframe.parentNode) document.body.removeChild(iframe);
    }, 1500);
  };

  if (doc.readyState === 'complete') window.setTimeout(run, 250);
  else iframe.onload = () => window.setTimeout(run, 250);
}
