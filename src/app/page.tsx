import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Projects from "@/components/Projects";
import TheTeam from "@/components/TheTeam";
import ThePit from "@/components/ThePit";
import Newsletter from "@/components/Newsletter";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="brand">
      <Header />
      <main>
        <Hero />
        <About />
        <Projects />
        <TheTeam />
        <ThePit />
        <Newsletter />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
