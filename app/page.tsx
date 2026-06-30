import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import CaseStudy from "@/components/CaseStudy";
import Services from "@/components/Services";
import Process from "@/components/Process";
import Audience from "@/components/Audience";
import About from "@/components/About";
import ClosingCTA from "@/components/ClosingCTA";
import ProjectForm from "@/components/ProjectForm";
import NetlifyFormDetect from "@/components/NetlifyFormDetect";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <hr className="container rule" />
        <CaseStudy />
        <Services />
        <Process />
        <Audience />
        <About />
        <ClosingCTA />
        <ProjectForm />
      </main>
      <NetlifyFormDetect />
      <Footer />
    </>
  );
}
