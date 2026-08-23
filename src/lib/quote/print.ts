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
#doc{transform:none !important;zoom:1 !important;width:210mm;margin:0;}
.doc-scale-wrap{overflow:visible !important;height:auto !important;}
</style></head><body>${node.outerHTML}</body></html>`);
  doc.close();

  const run = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    window.setTimeout(() => {
      if (iframe.parentNode) document.body.removeChild(iframe);
    }, 1500);
  };

  if (doc.readyState === 'complete') window.setTimeout(run, 250);
  else iframe.onload = () => window.setTimeout(run, 250);
}
