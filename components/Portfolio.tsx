import Link from "next/link";
import Reveal from "./Reveal";
import ProjectCard from "./ProjectCard";
import { getProject } from "@/lib/projects";

// The homepage leads with the two strongest taste proofs (both HVAC — same
// trade, two opposite voices) plus the editorial-luxury landscape studio.
const FEATURED_SLUGS = [
  "summit-climate",
  "silver-state-hvac",
  "agave-and-stone",
] as const;

export default function Portfolio() {
  const featured = FEATURED_SLUGS.map(getProject).filter(
    (p): p is NonNullable<typeof p> => Boolean(p)
  );
  return (
    <section id="work" className="work section">
      <div className="container">
        <Reveal className="work__head">
          <p className="label">The proof</p>
          <h2 className="display t-2xl work__title">
            This is what we do to
            <br />a trade company.
          </h2>
          <p className="lead measure-wide work__intro">
            We built these concept brands to show what&rsquo;s possible. The
            first two are the same trade — HVAC — designed as two completely
            different companies. A template can&rsquo;t do that. Click in and
            explore; every one is live.
          </p>
          <p className="work__note">
            Concept builds for fictional companies — the design is the
            portfolio.
          </p>
        </Reveal>

        <div className="work-grid">
          {featured.map((p) => (
            <Reveal key={p.slug}>
              <ProjectCard project={p} />
            </Reveal>
          ))}
        </div>

        <Reveal className="work__cta">
          <Link href="/portfolio/" className="btn">
            Explore all six concepts
          </Link>
          <a href="#start" className="tlink work__cta-alt">
            or book a free strategy call
          </a>
        </Reveal>
      </div>
    </section>
  );
}
