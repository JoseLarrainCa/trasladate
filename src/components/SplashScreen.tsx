import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const [wordStep, setWordStep] = useState(0);
  const [showTagline, setShowTagline] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const exitDelay = reduceMotion ? 1500 : 4400;
    const completeDelay = reduceMotion ? 1750 : 4800;
    const wordTimers = reduceMotion
      ? []
      : [1, 2, 3].map((step) =>
          window.setTimeout(() => setWordStep(step), 250 + step * 280)
        );
    const taglineTimer = window.setTimeout(
      () => setShowTagline(true),
      reduceMotion ? 0 : 1750
    );
    if (reduceMotion) setWordStep(3);
    const exitTimer = window.setTimeout(() => setIsExiting(true), exitDelay);
    const completeTimer = window.setTimeout(() => onComplete(), completeDelay);

    return () => {
      wordTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(taglineTimer);
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
            transition={{ duration: reduceMotion ? 1.45 : 4.4, ease: 'linear' }}
          />

          <AnimatePresence mode="wait">
            {showTagline ? (
              <motion.p
                key="tagline"
                className="max-w-[88vw] text-center font-heading text-xl font-bold uppercase leading-tight sm:text-3xl"
                role="status"
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.4, ease: 'easeOut' }}
              >
                La Gran Aventura de Mudarte
              </motion.p>
            ) : (
              <motion.div
                key="service-words"
                className="w-[min(78vw,21rem)] text-left font-heading text-2xl font-bold leading-none sm:text-3xl"
                role="status"
                aria-label="Planificamos, embalamos y trasladamos"
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.3 }}
              >
                {reels.map((words, reelIndex) => (
                  <div
                    key={words[words.length - 1]}
                    className="relative h-8 overflow-hidden sm:h-10"
                  >
                    <AnimatePresence initial={false} mode="popLayout">
                      <motion.span
                        key={words[wordStep]}
                        className="absolute inset-0 flex items-center"
                        initial={reduceMotion ? false : { y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '-100%', opacity: 0 }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.22,
                          delay: reduceMotion ? 0 : reelIndex * 0.04,
                          ease: [0.76, 0, 0.24, 1],
                        }}
                      >
                        {words[wordStep]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
