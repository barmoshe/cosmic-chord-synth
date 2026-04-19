import HomeBackdrop from "@/components/home/HomeBackdrop";
import HomeHero from "@/components/home/HomeHero";

const Home = () => (
  <div
    className="relative min-h-screen overflow-hidden"
    style={{
      background:
        "radial-gradient(ellipse at top, #0b1a3a 0%, #06091c 55%, #03040d 100%)",
    }}
  >
    <HomeBackdrop />
    <HomeHero />
  </div>
);

export default Home;
