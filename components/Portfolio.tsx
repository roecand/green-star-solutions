import Link from "next/link";
import StarMark from "./StarMark";
import Reveal from "./Reveal";
import ProjectCard from "./ProjectCard";
import { projects } from "@/lib/projects";

export default function Portfolio() {
  // The homepage features three; the full set lives at /portfolio.
  const featured = projects.slice(0, 3);
  return (
    <section id="work" className="work section">
      <div className="container">
        <Reveal className="work__head">
          <p className="eyebrow eyebrow--ink">
            <StarMark size={14} /> Concept work
          </p>
          <h2 className="display h-lg work__title">
            Every business, <span className="serif accent">its own voice.</span>
          </h2>
          <p className="lead measure-wide work__intro">
            A template can&rsquo;t sell a trade. So we design each site in the
            visual language of the business it belongs to — here are three of
            our live concept builds. Click in and explore.
          </p>
          <p className="work__note mono">
            ✦ These are concept projects for fictional businesses — designed to
            show range, not real clients.
          </p>
        </Reveal>

        <div className="work-grid">
          {featured.map((p, i) => (
            <Reveal key={p.slug} delay={i * 90}>
              <ProjectCard project={p} />
            </Reveal>
          ))}
        </div>

        <Reveal className="work__cta">
          <Link href="/portfolio/" className="btn">
            Explore the full portfolio <span className="arrow">↗</span>
          </Link>
          <a href="#start" className="tlink work__cta-alt">
            or book a free strategy call
          </a>
        </Reveal>
      </div>
    </section>
  );
}
