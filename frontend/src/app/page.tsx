import { HeroSection } from '@/components/home/HeroSection';
import { AboutSection } from '@/components/home/AboutSection';
import { FeatureSection } from '@/components/home/FeatureSection';
import { FaqSection } from '@/components/home/FaqSection';
import { ContactSection } from '@/components/home/ContactSection';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <HeroSection />
      <AboutSection />
      <FeatureSection />
      <FaqSection />
      <ContactSection />
    </div>
  );
}
