import { HomeHeader } from "@/features/home/components/home-header";
import { HeroSection } from "@/features/home/components/hero-section";
import { FeaturesSection } from "@/features/home/components/features-section";
import { HowItWorksSection } from "@/features/home/components/how-it-works-section";
import { CtaSection } from "@/features/home/components/cta-section";
import { HomeFooter } from "@/features/home/components/home-footer";

export function HomeView() {
  return (
    <div className="min-h-screen bg-background">
      <HomeHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <HomeFooter />
    </div>
  );
}
