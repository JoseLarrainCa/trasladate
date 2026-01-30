import { motion } from 'framer-motion';
import { MapPin, Check } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const comunas = [
  'Santiago Centro', 'Providencia', 'Las Condes', 'Vitacura', 'Lo Barnechea', 
  'La Reina', 'Ñuñoa', 'La Florida', 'Peñalolén', 'Macul', 'San Miguel',
  'La Cisterna', 'Puente Alto', 'San Bernardo', 'Maipú', 'Pudahuel',
  'Recoleta', 'Independencia', 'Quilicura', 'Huechuraba', 'Conchalí',
  'Quinta Normal', 'Estación Central', 'Lo Prado', 'La Dehesa',
];

const Coverage = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-20 md:py-28 bg-hero-gradient relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        className="absolute top-1/4 left-10 w-32 h-32 border border-primary/20 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-10 w-48 h-48 border border-primary/10 rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div ref={ref} className={`text-center mb-12 scroll-animate ${isVisible ? 'visible' : ''}`}>
          <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            <MapPin className="w-4 h-4" />
            Cobertura Nacional
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-primary-foreground mb-6">
            Llegamos a todo Chile
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Trabajamos en todas las comunas de la Región Metropolitana y realizamos 
            mudanzas a todas las regiones del país.
          </p>
        </div>

        {/* Comunas grid */}
        <motion.div 
          className={`flex flex-wrap justify-center gap-3 max-w-4xl mx-auto stagger-children ${isVisible ? 'visible' : ''}`}
        >
          {comunas.map((comuna) => (
            <motion.span
              key={comuna}
              className="inline-flex items-center gap-1.5 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-2 text-sm text-primary-foreground hover:bg-primary/20 hover:border-primary/40 transition-all cursor-default"
              whileHover={{ scale: 1.05 }}
            >
              <Check className="w-3.5 h-3.5 text-primary" />
              {comuna}
            </motion.span>
          ))}
        </motion.div>

        <motion.p
          className={`text-center mt-8 text-primary font-semibold scroll-animate ${isVisible ? 'visible' : ''}`}
          style={{ transitionDelay: '0.5s' }}
        >
          Y muchas más comunas en todo Chile...
        </motion.p>
      </div>
    </section>
  );
};

export default Coverage;
