import { HeroSection } from '@/components/home/HeroSection';
import { FeatureSection } from '@/components/home/FeatureSection';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <HeroSection />
      <FeatureSection />
    </div>
  );
}
