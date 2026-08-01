import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Portfolio: Concept Work",
  description:
    "Six full concept websites, including two HVAC companies designed as completely different brands, a luxury landscape studio, a 24/7 plumber, a roofing company, and a neighborhood bakery. Each in its own visual language.",
};

export default function PortfolioPage() {
  return (
    <>
      <Nav />
      <main>
        {/* hero */}
        <section className="pfhero">
          <div className="container">
            <p className="label">Portfolio · Concept work</p>
            <h1 className="wide t-display pfhero__title">
              One agency,
              <br />
              every voice.
            </h1>
            <p className="lead measure-wide pfhero__lead">
              A great trades website doesn&rsquo;t look like a template, it looks
              like the business. To prove it, we designed six complete concept
              websites, each in its own visual language, including two HVAC
              companies built as completely different brands. Every one is
              live: click in, scroll around, resize it.
            </p>
            <div className="pfhero__disclaimer">
              <span className="pfhero__disclaimer-tag">Concept website</span>
              <p>
                Each project below is a <strong>concept for a fictional
                business</strong>, built by Green Star Solutions to demonstrate
                design range. None represent real clients.
              </p>
            </div>
          </div>
        </section>

        <hr className="container rule" />

        {/* grid */}
        <section className="section pfgrid">
          <div className="container">
            <div className="work-grid work-grid--page">
              {projects.map((p) => (
                <Reveal key={p.slug}>
                  <ProjectCard project={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* closing */}
        <section className="section on-dark pfclose">
          <div className="container pfclose__inner">
            <h2 className="wide t-2xl pfclose__head">
              Imagine your business up here.
            </h2>
            <p className="lead pfclose__sub measure-wide">
              This is the level of design your customers see before they ever
              call you. Let&rsquo;s build the real thing, for your company.
            </p>
            <Link href="/#start" className="btn btn--light">
              Book a Free Strategy Call
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
