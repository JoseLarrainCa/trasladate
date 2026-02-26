import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';
import { Warehouse, Globe, Phone, Mail, MessageCircle } from 'lucide-react';

const MiniBodegas = () => {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section id="mini-bodegas" ref={ref} className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Warehouse className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Mini Bodegas
            </h2>
          </div>
          <p className="text-muted-foreground text-lg mb-8">
            Convenio con una de las más grandes empresas de Mini-bodegas, contando con{' '}
            <span className="text-foreground font-semibold">24 Sucursales en la Región Metropolitana</span> y{' '}
            <span className="text-foreground font-semibold">1 en Viña del Mar</span>.
          </p>

          {/* Contact info */}
          <div className="bg-card rounded-2xl p-6 md:p-8 shadow-soft border border-primary/10 inline-block w-full max-w-lg">
            <h3 className="font-heading font-semibold text-foreground text-lg mb-4">
              Contacto <span className="text-primary">akikb</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-left">
              <a href="https://www.akikb.cl" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                www.akikb.cl
              </a>
              <a href="https://wa.me/56990693638" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle className="w-4 h-4 text-primary flex-shrink-0" />
                +56 990 693 638
              </a>
              <a href="tel:222000555" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                222 000 555
              </a>
              <a href="mailto:minibodegas@akikb.cl" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                minibodegas@akikb.cl
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MiniBodegas;
