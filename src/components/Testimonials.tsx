import { useEffect } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const WIDGET_ID = 'featurable-d733ae0a-c8d0-44d0-a96a-e73729df1a0f';
const SCRIPT_SRC = 'https://featurable.com/assets/bundle.js';

const Testimonials = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();

  useEffect(() => {
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.defer = true;
    script.charset = 'UTF-8';
    document.body.appendChild(script);
  }, []);

  return (
    <section id="testimonios" className="py-20 md:py-28 bg-muted/50">
      <div className="container mx-auto px-4">
        <div
          ref={headerRef}
          className={`text-center max-w-2xl mx-auto mb-12 scroll-animate ${headerVisible ? 'visible' : ''}`}
        >
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Testimonios
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-lg text-muted-foreground">
            Opiniones reales publicadas en Google por quienes ya vivieron la gran aventura de mudarse
            con nosotros.
          </p>
        </div>

        <div id={WIDGET_ID} data-featurable-async />
      </div>
    </section>
  );
};

export default Testimonials;
