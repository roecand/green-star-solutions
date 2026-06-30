import StarMark from "./StarMark";
import Reveal from "./Reveal";

/**
 * Add real projects here as they're ready. Each entry renders a full card;
 * until then, the `comingSoon` flag shows a premium placeholder so the section
 * never looks empty.
 *
 * Example of a finished project:
 * { industry: "HVAC", title: "Sunstate Heating & Air", tags: ["Website", "Google Ads"],
 *   result: "3.4× more booked calls in 90 days", href: "#", comingSoon: false }
 */
const projects = [
  { industry: "HVAC", type: "Website + Google Ads", comingSoon: true },
  { industry: "Plumbing", type: "Website + Automation", comingSoon: true },
  { industry: "Roofing", type: "Meta Ads + Follow-up", comingSoon: true },
];

export default function Portfolio() {
  return (
    <section id="work" className="work section">
      <div className="container">
        <Reveal className="work__head">
          <p className="eyebrow eyebrow--ink">
            <StarMark size={14} /> Our work
          </p>
          <h2 className="display h-lg work__title">
            Results, <span className="serif accent">documented</span>.
          </h2>
          <p className="lead measure-wide work__intro">
            We&rsquo;re writing up current client results right now — full case
            studies with real numbers land here soon. Want to see live examples in
            the meantime? Ask on your strategy call.
          </p>
        </Reveal>

        <div className="work-grid">
          {projects.map((p, i) => (
            <Reveal key={p.industry} className="work-card" delay={i * 80}>
              <div className="work-card__thumb">
                <StarMark size={40} className="work-card__star" />
                <span className="work-card__soon mono">Case study in progress</span>
              </div>
              <div className="work-card__meta">
                <span className="work-card__industry mono">{p.industry}</span>
                <span className="work-card__type">{p.type}</span>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="work__cta">
          <a href="#start" className="btn">
            Book a Free Strategy Call <span className="arrow">↗</span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
