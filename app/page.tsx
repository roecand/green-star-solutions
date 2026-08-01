import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Facts from "@/components/Facts";
import Work from "@/components/Work";
import Departments from "@/components/Departments";
import Method from "@/components/Method";
import Trades from "@/components/Trades";
import Engagement from "@/components/Engagement";
import ClosingCTA from "@/components/ClosingCTA";
import ProjectForm from "@/components/ProjectForm";
import NetlifyFormDetect from "@/components/NetlifyFormDetect";
import StickyCTA from "@/components/StickyCTA";
import Footer from "@/components/Footer";

/**
 * Section order is an argument, not a menu:
 *   claim -> proof -> diagnosis -> method -> fit -> price -> ask.
 *
 * Proof comes before the pitch because the live concept sites are the only
 * thing here that shows rather than tells. Price comes before the form
 * because a visitor who cannot afford the work should be able to leave
 * without filling anything in.
 *
 * Layout families, in order: manifesto, fact strip, feature-plus-rail,
 * colour-blocked two-up, sticky-scroll list, editorial rows, figure list,
 * full-bleed statement, form. No family is used twice.
 */
export default function Home() {
  return (
    <>
      <Nav />
      {/* Sentinel must sit at the top of the document: the chip appears once
          this scrolls out, so mounting it below <main> would keep it visible
          for the whole page instead of none of it. */}
      <StickyCTA />
      <main>
        <Hero />
        <Facts />
        <Work />
        <Departments />
        <Method />
        <Trades />
        <Engagement />
        <ClosingCTA />
        <ProjectForm />
      </main>
      <NetlifyFormDetect />
      <Footer />
    </>
  );
}
