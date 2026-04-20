import HomeBackdrop from "@/components/home/HomeBackdrop";
import HomeHero from "@/components/home/HomeHero";
import { HomeStateProvider } from "@/components/home/HomeStateContext";

const Home = () => (
  <HomeStateProvider>
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[radial-gradient(ellipse_at_top,#0b1a3a_0%,#06091c_55%,#03040d_100%)]">
      <HomeBackdrop />
      <HomeHero />
    </div>
  </HomeStateProvider>
);

export default Home;
