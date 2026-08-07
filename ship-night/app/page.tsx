import DemoCta from "@/components/landing/DemoCta";
import FeeComparison from "@/components/landing/FeeComparison";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import LandingNav from "@/components/landing/LandingNav";

export default function Home() {
  return (
    <div className="min-h-full bg-zinc-950 text-white">
      <LandingNav />
      <Hero />
      <HowItWorks />
      <FeeComparison />
      <DemoCta />
      <Footer />
    </div>
  );
}
