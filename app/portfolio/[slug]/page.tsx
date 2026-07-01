import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import StarMark from "@/components/StarMark";
import Reveal from "@/components/Reveal";
import SitePreview from "@/components/SitePreview";
import { projects, getProject } from "@/lib/projects";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const project = getProject((await params).slug);
  if (!project) return {};
  return {
    title: `${project.name} — Concept Website | Green Star Solutions`,
    description: project.tagline,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const project = getProject((await params).slug);
  if (!project) notFound();

  const others = projects.filter((p) => p.slug !== project.slug);

  return (
    <>
      <Nav />
      <main
        className="proj"
        style={{ "--proj-accent": project.accent } as React.CSSProperties}
      >
        {/* ---------- hero ---------- */}
        <section className="proj__hero">
          <div className="container">
            <Link href="/portfolio/" className="tlink proj__back">
              ← Back to Portfolio
            </Link>
            <div className="proj__chips">
              <span className="chip chip--concept mono">✦ Concept Website</span>
              <span className="chip mono">{project.industry}</span>
              <span className="chip mono">{project.sector}</span>
            </div>
            <h1 className="display h-xl proj__title">{project.name}</h1>
            <p className="proj__style serif">{project.styleLabel}</p>
            <p className="lead measure-wide proj__tagline">{project.tagline}</p>
            <div className="proj__actions">
              <a
                className="btn"
                href={project.url}
                target="_blank"
                rel="noopener"
              >
                Open the live concept <span className="arrow">↗</span>
              </a>
              <span className="proj__actions-note mono">
                Fictional business — designed to demonstrate range
              </span>
            </div>
          </div>
        </section>

        {/* ---------- big live preview ---------- */}
        <section className="proj__stage">
          <div className="container">
            <Reveal>
              <div className="browser">
                <div className="browser__bar">
                  <span className="browser__dot" />
                  <span className="browser__dot" />
                  <span className="browser__dot" />
                  <span className="browser__url mono">
                    {project.slug}.concept — live preview
                  </span>
                </div>
                <SitePreview
                  url={project.url}
                  title={`${project.name} live preview`}
                  scale={0.5}
                  className="sitepreview--stage"
                />
              </div>
              <p className="proj__stage-note">
                Live embed of the actual concept site — not a screenshot.{" "}
                <a href={project.url} target="_blank" rel="noopener" className="tlink">
                  Open it full-screen ↗
                </a>
              </p>
            </Reveal>
          </div>
        </section>

        {/* ---------- overview ---------- */}
        <section className="section proj__sec">
          <div className="container proj__cols">
            <Reveal className="proj__colhead">
              <p className="eyebrow eyebrow--ink">
                <StarMark size={13} /> 01 — Overview
              </p>
              <h2 className="display h-md">The brief we gave ourselves</h2>
            </Reveal>
            <Reveal className="proj__prose">
              {project.overview.map((para) => (
                <p key={para.slice(0, 32)}>{para}</p>
              ))}
            </Reveal>
          </div>
        </section>

        <hr className="container rule" />

        {/* ---------- design goals ---------- */}
        <section className="section proj__sec">
          <div className="container">
            <Reveal className="proj__sechead">
              <p className="eyebrow eyebrow--ink">
                <StarMark size={13} /> 02 — Design goals
              </p>
              <h2 className="display h-md">Every choice had a job to do</h2>
            </Reveal>
            <div className="proj__goals">
              {project.designGoals.map((g, i) => (
                <Reveal key={g.title} className="goal" delay={i * 70}>
                  <span className="goal__no mono">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="goal__title">{g.title}</h3>
                  <p className="goal__body">{g.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- features ---------- */}
        <section className="section surface-forest proj__features">
          <div className="container proj__cols">
            <Reveal className="proj__colhead">
              <p className="eyebrow">
                <StarMark size={13} className="process__star" /> 03 — Features
                implemented
              </p>
              <h2 className="display h-md">What&rsquo;s actually in the build</h2>
            </Reveal>
            <Reveal>
              <ul className="featlist">
                {project.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ---------- business problem ---------- */}
        <section className="section proj__sec">
          <div className="container proj__cols">
            <Reveal className="proj__colhead">
              <p className="eyebrow eyebrow--ink">
                <StarMark size={13} /> 04 — The business problem
              </p>
              <h2 className="display h-md">Why this design makes money</h2>
            </Reveal>
            <Reveal className="proj__prose">
              <p className="pull proj__pull">{project.problem.lead}</p>
              {project.problem.body.map((para) => (
                <p key={para.slice(0, 32)}>{para}</p>
              ))}
            </Reveal>
          </div>
        </section>

        <hr className="container rule" />

        {/* ---------- gallery ---------- */}
        <section className="section proj__sec">
          <div className="container">
            <Reveal className="proj__sechead">
              <p className="eyebrow eyebrow--ink">
                <StarMark size={13} /> 05 — Design gallery
              </p>
              <h2 className="display h-md">The system up close</h2>
            </Reveal>
            <div className="gallery">
              <Reveal className="gallery__tile gallery__tile--wide">
                <div className="gallery__frame">
                  <SitePreview
                    url={project.url}
                    title={`${project.name} desktop view`}
                    scale={0.32}
                  />
                </div>
                <p className="gallery__cap mono">Desktop · full page</p>
              </Reveal>
              <Reveal className="gallery__tile" delay={80}>
                <div className="gallery__swatches">
                  {project.palette.map((c) => (
                    <div
                      key={c.hex}
                      className="swatch"
                      style={{
                        background: c.hex,
                        color: c.onDark ? "#f7f5f0" : "#16201b",
                      }}
                    >
                      <span>{c.name}</span>
                      <span className="mono">{c.hex}</span>
                    </div>
                  ))}
                </div>
                <p className="gallery__cap mono">Palette</p>
              </Reveal>
              <Reveal className="gallery__tile" delay={140}>
                <div className="gallery__type">
                  {project.fonts.map((f) => (
                    <div key={f.role} className="typespec">
                      <span className="typespec__role mono">
                        {f.role} — {f.name}
                      </span>
                      <span className="typespec__sample">{f.sample}</span>
                    </div>
                  ))}
                </div>
                <p className="gallery__cap mono">Typography</p>
              </Reveal>
              <Reveal className="gallery__tile gallery__tile--phone" delay={200}>
                <div className="gallery__phone">
                  <SitePreview
                    url={project.url}
                    title={`${project.name} mobile view`}
                    viewport={375}
                    scale={0.72}
                  />
                </div>
                <p className="gallery__cap mono">Mobile · 375px</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------- before / after ---------- */}
        <section className="section proj__sec proj__ba">
          <div className="container">
            <Reveal className="proj__sechead">
              <p className="eyebrow eyebrow--ink">
                <StarMark size={13} /> 06 — Before &amp; after
              </p>
              <h2 className="display h-md">
                The typical site vs. <span className="serif accent">the concept</span>
              </h2>
            </Reveal>
            <div className="ba">
              <Reveal className="ba__panel ba__panel--before">
                <div className="ba__label mono">Before — the typical {project.industry.toLowerCase()} website</div>
                <div className="ba__wire" aria-hidden="true">
                  <div className="ba__wire-nav">
                    <span className="ba__wire-logo" />
                    <span className="ba__wire-links" />
                  </div>
                  <div className="ba__wire-hero">
                    <span className="ba__wire-line ba__wire-line--lg" />
                    <span className="ba__wire-line" />
                    <span className="ba__wire-line ba__wire-line--sm" />
                  </div>
                  <div className="ba__wire-boxes">
                    <span /><span /><span />
                  </div>
                </div>
                <ul className="ba__list ba__list--before">
                  {project.before.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </Reveal>
              <Reveal className="ba__panel ba__panel--after" delay={100}>
                <div className="ba__label ba__label--after mono">After — the concept</div>
                <div className="ba__live">
                  <SitePreview
                    url={project.url}
                    title={`${project.name} after view`}
                    scale={0.24}
                  />
                </div>
                <ul className="ba__list ba__list--after">
                  {project.after.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <p className="ba__note">
              &ldquo;Before&rdquo; shown as an illustrative placeholder — on a real engagement
              this is your current website, and the numbers that change with it.
            </p>
          </div>
        </section>

        {/* ---------- next projects + back ---------- */}
        <section className="section surface-forest proj__next">
          <div className="container">
            <Reveal className="proj__sechead">
              <p className="eyebrow">
                <StarMark size={13} className="process__star" /> Keep exploring
              </p>
              <h2 className="display h-md">More concept work</h2>
            </Reveal>
            <div className="proj__next-grid">
              {others.map((p) => (
                <Reveal key={p.slug}>
                  <Link href={`/portfolio/${p.slug}/`} className="nextcard">
                    <span className="nextcard__industry mono">{p.industry}</span>
                    <span className="nextcard__name">{p.name}</span>
                    <span className="nextcard__go">View project ↗</span>
                  </Link>
                </Reveal>
              ))}
            </div>
            <Reveal className="proj__next-actions">
              <Link href="/portfolio/" className="btn btn--light">
                ← Back to Portfolio
              </Link>
              <Link href="/#start" className="tlink">
                or book a free strategy call ↗
              </Link>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
