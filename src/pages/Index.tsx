import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import About from '@/components/About';
import Fleet from '@/components/Fleet';
import Gallery from '@/components/Gallery';
import Coverage from '@/components/Coverage';
import QuoteForm from '@/components/QuoteForm';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import SplashScreen from '@/components/SplashScreen';

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div className={`min-h-screen bg-background ${showSplash ? 'invisible' : ''}`}>
        <Header />
        <main>
          <Hero />
          <Services />
          <About />
          <Gallery />
          <Fleet />
          <Coverage />
          <QuoteForm />
          <Contact />
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
};

export default Index;
