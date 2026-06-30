import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Process from "@/components/Process";
import Industries from "@/components/Industries";
import Portfolio from "@/components/Portfolio";
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
        <Services />
        <Process />
        <Industries />
        <Portfolio />
        <ClosingCTA />
        <ProjectForm />
      </main>
      <NetlifyFormDetect />
      <Footer />
    </>
  );
}
