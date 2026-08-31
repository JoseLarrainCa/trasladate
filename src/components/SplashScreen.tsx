import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const exitDelay = reduceMotion ? 700 : 1900;
    const completeDelay = reduceMotion ? 950 : 2300;
    const exitTimer = window.setTimeout(() => setIsExiting(true), exitDelay);
    const completeTimer = window.setTimeout(() => onComplete(), completeDelay);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete, reduceMotion]);

  const reels = [
    ['Coordinamos', 'Protegemos', 'Organizamos', 'Planificamos'],
    ['Cuidamos', 'Preparamos', 'Aseguramos', 'Embalamos'],
    ['Avanzamos', 'Conectamos', 'Llegamos', 'Trasladamos'],
  ];

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-secondary text-secondary-foreground"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.4, ease: 'easeInOut' }}
        >
          <motion.div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-1 origin-left bg-primary"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: reduceMotion ? 0.65 : 1.9, ease: 'linear' }}
          />

          <div
            className="w-[min(78vw,21rem)] text-left font-heading text-2xl font-bold leading-none sm:text-3xl"
            role="status"
            aria-label="Planificamos, embalamos y trasladamos"
          >
            {reels.map((words, reelIndex) => (
              <div key={words[words.length - 1]} className="h-8 overflow-hidden sm:h-10">
                <motion.div
                  className="flex flex-col"
                  initial={reduceMotion ? false : { y: '0%' }}
                  animate={{ y: reduceMotion ? '-75%' : ['0%', '-25%', '-50%', '-75%'] }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : {
                          duration: 1.2,
                          delay: 0.12 + reelIndex * 0.14,
                          times: [0, 0.32, 0.64, 1],
                          ease: [0.76, 0, 0.24, 1],
                        }
                  }
                >
                  {words.map((word) => (
                    <span key={word} className="flex h-8 shrink-0 items-center sm:h-10">
                      {word}
                    </span>
                  ))}
                </motion.div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
