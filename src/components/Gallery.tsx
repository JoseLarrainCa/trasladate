import { useEffect, useRef, useState } from 'react';
import { Camera, Play, X } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';

import foto1 from '@/assets/gallery/foto1.jpeg';
import foto2 from '@/assets/gallery/foto2.jpeg';
import foto3 from '@/assets/gallery/foto3.jpeg';
import foto4 from '@/assets/gallery/foto4.jpeg';
import foto5 from '@/assets/gallery/foto5.jpeg';
import foto6 from '@/assets/gallery/foto6.jpeg';
import foto8 from '@/assets/gallery/foto8.jpeg';

type GalleryItem = {
  type: 'image' | 'video';
  src: string;
  alt: string;
};

const galleryItems: GalleryItem[] = [
  { type: 'image', src: foto3, alt: 'Equipo Trasladarte cargando muebles' },
  { type: 'image', src: foto6, alt: 'Trasladando un piano en ascensor' },
  { type: 'video', src: '/gallery/video3.mp4', alt: 'Video de mudanza en acción' },
  { type: 'image', src: foto2, alt: 'Carga de muebles grandes' },
  { type: 'image', src: foto5, alt: 'Camión de mudanzas en ruta' },
  { type: 'image', src: foto1, alt: 'Embalaje profesional de objetos' },
  { type: 'image', src: foto4, alt: 'Armado de muebles en oficina' },
  { type: 'image', src: foto8, alt: 'Descarga de camión en destino' },
];

const Gallery = () => {
  const { ref: sectionRef, isVisible } = useScrollAnimation(0.1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-scroll effect
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isPaused) return;

    let animId: number;
    let speed = 0.5;

    const step = () => {
      el.scrollLeft += speed;
      // Loop: when reaching the end, jump back
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
        el.scrollLeft = 0;
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isPaused]);

  return (
    <section
      id="galeria"
      ref={sectionRef}
      className="py-20 bg-secondary/30"
    >
      <div className="container mx-auto px-4 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Camera className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Nuestros Proyectos
            </h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Mira cómo trabajamos: dedicación, profesionalismo y cuidado en cada mudanza
          </p>
        </motion.div>
      </div>

      {/* Scrolling gallery */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4 cursor-grab active:cursor-grabbing"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Duplicate items for infinite scroll effect */}
        {[...galleryItems, ...galleryItems].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isVisible ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}
            className="flex-shrink-0 w-72 h-80 md:w-80 md:h-96 rounded-2xl overflow-hidden relative group cursor-pointer shadow-lg"
            onClick={() => setSelectedItem(item)}
          >
            {item.type === 'image' ? (
              <img
                src={item.src}
                alt={item.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="relative w-full h-full">
                <video
                  src={item.src}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  autoPlay
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                  <Play className="w-14 h-14 text-white drop-shadow-lg" fill="white" />
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="absolute bottom-4 left-4 right-4 text-white text-sm font-medium">
                {item.alt}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <button
            className="absolute top-6 right-6 text-white hover:text-primary transition-colors"
            onClick={() => setSelectedItem(null)}
          >
            <X className="w-8 h-8" />
          </button>
          {selectedItem.type === 'image' ? (
            <img
              src={selectedItem.src}
              alt={selectedItem.alt}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <video
              src={selectedItem.src}
              className="max-w-full max-h-[90vh] rounded-lg"
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </section>
  );
};

export default Gallery;
