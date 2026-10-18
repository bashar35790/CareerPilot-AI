import { HeroSection } from '@/components/home/HeroSection';
import { AboutSection } from '@/components/home/AboutSection';
import { FeatureSection } from '@/components/home/FeatureSection';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <HeroSection />
      <AboutSection />
      <FeatureSection />
    </div>
  );
}
