import DemoCta from "@/components/landing/DemoCta";
import FeeComparison from "@/components/landing/FeeComparison";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import LandingNav from "@/components/landing/LandingNav";

export default function Home() {
  return (
    <div className="min-h-full flex-1 bg-[#fffaf5] text-[#121111]">
      <LandingNav />
      <Hero />
      <HowItWorks />
      <FeeComparison />
      <DemoCta />
      <Footer />
    </div>
  );
}
