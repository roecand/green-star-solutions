import StarMark from "./StarMark";
import Reveal from "./Reveal";

const industries = [
  {
    name: "HVAC",
    body: "Fill your schedule with tune-ups, repairs, and installs — year-round, not just at peak season.",
  },
  {
    name: "Plumbing",
    body: "Capture emergency calls the moment they search, and book more high-ticket jobs.",
  },
  {
    name: "Electrical",
    body: "Win panel upgrades, EV chargers, and service calls with a presence that builds trust fast.",
  },
  {
    name: "Roofing",
    body: "Turn storm season into your biggest months with ads and follow-up that actually close.",
  },
  {
    name: "Landscaping",
    body: "Book recurring maintenance and design projects with a brand that looks the part.",
  },
];

export default function Industries() {
  return (
    <section id="industries" className="ind section">
      <div className="container">
        <Reveal className="ind__head">
          <p className="eyebrow eyebrow--ink">
            <StarMark size={14} /> Industries we serve
          </p>
          <h2 className="display h-lg ind__title">
            We speak your <span className="serif accent">trade</span>.
          </h2>
          <p className="lead measure-wide ind__intro">
            We focus on home-service businesses, so the website, the ad copy, and
            the follow-up are built around how your customers actually buy.
          </p>
        </Reveal>

        <ul className="ind-list">
          {industries.map((it, i) => (
            <Reveal as="li" key={it.name} className="ind-row" delay={i * 55}>
              <span className="ind-row__no mono">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="display ind-row__name">{it.name}</h3>
              <p className="ind-row__desc">{it.body}</p>
              <StarMark size={13} className="ind-row__star" />
            </Reveal>
          ))}
        </ul>

        <Reveal className="ind__note">
          Not on the list? If you sell a service to local homeowners, we can
          almost certainly help.
        </Reveal>
      </div>
    </section>
  );
}
