import Link from "next/link";
import Reveal from "./Reveal";
import SitePreview from "./SitePreview";
import { projects, getProject } from "@/lib/projects";

const LEAD_SLUG = "summit-climate";

/**
 * The strongest asset on the site, so it goes first and it goes on the dark
 * block: one project at full size with its real site running inside it, then
 * everything else on a rail that scrolls sideways.
 *
 * Not a three-up card grid. Three equal cards is the default answer to
 * "show some projects" and it flattens the lead project into a peer of the
 * seventh one.
 */
export default function Work() {
  const lead = getProject(LEAD_SLUG);
  const rest = projects.filter((p) => p.slug !== LEAD_SLUG);

  return (
    <section id="work" className="work section on-dark">
      <div className="container">
        <Reveal className="work__head" motion="rise">
          <div>
            <p className="label">The proof</p>
            <h2 className="wide t-2xl work__title">
              Same trade. Two completely different companies.
            </h2>
          </div>
          <p className="work__aside">
            Summit Climate and Silver State are both HVAC, and both are ours.
            One sells composure, the other sells muscle. A template cannot do
            that, which is the whole argument.
          </p>
        </Reveal>

        {lead && (
          <Reveal className="lead-project" motion="scale">
            <Link
              href={`/portfolio/${lead.slug}/`}
              className="lead-project__stage"
              aria-label={`View the ${lead.name} concept project`}
            >
              <SitePreview
                url={lead.url}
                title={`${lead.name} preview`}
                scale={0.42}
              />
            </Link>
            <div className="lead-project__meta">
              <span className="lead-project__tag">{lead.industry}</span>
              <h3 className="wide lead-project__name">{lead.name}</h3>
              <p className="lead-project__desc">{lead.tagline}</p>
              <Link
                href={`/portfolio/${lead.slug}/`}
                className="btn btn--ghost"
              >
                Open this project
              </Link>
            </div>
          </Reveal>
        )}

        <ul className="rail" aria-label="More concept projects">
          {rest.map((p) => (
            <li className="railcard" key={p.slug}>
              <Link
                href={`/portfolio/${p.slug}/`}
                className="railcard__thumb"
                aria-label={`View the ${p.name} concept project`}
              >
                <SitePreview
                  url={p.url}
                  title={`${p.name} preview`}
                  scale={0.24}
                />
              </Link>
              <div className="railcard__body">
                <span className="railcard__industry">{p.industry}</span>
                <h3 className="railcard__name">{p.name}</h3>
              </div>
            </li>
          ))}
        </ul>

        <Reveal className="work__foot" motion="rise">
          <Link href="/portfolio/" className="btn">
            All six concepts
          </Link>
          <p className="work__aside">
            Every one is a real, live site you can click into. They are concept
            builds for companies that do not exist, because the design is the
            portfolio.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
