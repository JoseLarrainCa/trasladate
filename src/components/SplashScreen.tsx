import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    const exitTimer = setTimeout(() => setIsExiting(true), 1800);
    const completeTimer = setTimeout(() => onComplete(), 2300);

    return () => {
      clearInterval(interval);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-hero-gradient"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {/* Logo */}
          <motion.div
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-cta"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, ease: 'backOut' }}
          >
            <span className="text-4xl font-heading font-bold text-primary-foreground">T</span>
          </motion.div>

          {/* Truck animation */}
          <motion.div
            className="mb-6 w-48 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.4, delay: 0.5, ease: 'easeInOut' }}
            >
              <Truck className="h-8 w-8 text-primary" />
            </motion.div>
          </motion.div>

          {/* Brand name */}
          <motion.h1
            className="mb-2 font-heading text-3xl font-bold tracking-wide text-primary-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Trasladarte
          </motion.h1>

          {/* Slogan */}
          <motion.p
            className="mb-8 text-sm font-body tracking-widest text-primary-foreground/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            La Gran Aventura de Mudarte
          </motion.p>

          {/* Progress bar */}
          <motion.div
            className="w-48"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="h-1 w-full overflow-hidden rounded-full bg-secondary-foreground/20">
              <motion.div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
