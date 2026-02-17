import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';
import { Warehouse } from 'lucide-react';

const MiniBodegas = () => {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section id="mini-bodegas" ref={ref} className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Warehouse className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Mini Bodegas
            </h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Próximamente más información sobre nuestro servicio de mini bodegas.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default MiniBodegas;
