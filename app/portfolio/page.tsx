import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import StarMark from "@/components/StarMark";
import Reveal from "@/components/Reveal";
import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Portfolio — Concept Work | Green Star Solutions",
  description:
    "Full concept websites for three very different businesses — a 24/7 plumber, a desert landscape studio, and a neighborhood bakery. Each designed in its own visual language.",
};

export default function PortfolioPage() {
  return (
    <>
      <Nav />
      <main>
        {/* hero */}
        <section className="pfhero">
          <div className="container">
            <p className="eyebrow eyebrow--ink">
              <StarMark size={14} /> Portfolio · Concept work
            </p>
            <h1 className="display h-xl pfhero__title">
              One agency,
              <br />
              <span className="serif accent">every voice.</span>
            </h1>
            <p className="lead measure-wide pfhero__lead">
              A great trades website doesn&rsquo;t look like a template — it looks
              like the business. To prove it, we designed complete concept
              websites for three very different companies, each in its own visual
              language. Every one is live: click in, scroll around, resize it.
            </p>
            <div className="pfhero__disclaimer">
              <span className="mono">✦ Concept Website</span>
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
              {projects.map((p, i) => (
                <Reveal key={p.slug} delay={i * 90}>
                  <ProjectCard project={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* closing */}
        <section className="section surface-forest pfclose">
          <div className="container pfclose__inner">
            <StarMark size={30} className="process__star" />
            <h2 className="display h-lg pfclose__head">
              Imagine <span className="serif accent">your business</span> up here.
            </h2>
            <p className="lead pfclose__sub measure-wide">
              This is the level of design your customers see before they ever
              call you. Let&rsquo;s build the real thing — for your company.
            </p>
            <Link href="/#start" className="btn btn--light">
              Book a Free Strategy Call <span className="arrow">↗</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
