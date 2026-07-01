import Link from "next/link";
import StarMark from "./StarMark";
import Reveal from "./Reveal";
import ProjectCard from "./ProjectCard";
import { projects } from "@/lib/projects";

export default function Portfolio() {
  return (
    <section id="work" className="work section">
      <div className="container">
        <Reveal className="work__head">
          <p className="eyebrow eyebrow--ink">
            <StarMark size={14} /> Concept work
          </p>
          <h2 className="display h-lg work__title">
            Three businesses. <span className="serif accent">Three languages.</span>
          </h2>
          <p className="lead measure-wide work__intro">
            Every trade deserves its own voice — so we designed three full concept
            websites, each for a different kind of business, each in a completely
            different style. All three are live. Click in and explore.
          </p>
          <p className="work__note mono">
            ✦ These are concept projects for fictional businesses — designed to
            show range, not real clients.
          </p>
        </Reveal>

        <div className="work-grid">
          {projects.map((p, i) => (
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
