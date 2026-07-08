import StarMark from "./StarMark";
import Reveal from "./Reveal";

const industries = [
  {
    name: "HVAC",
    body: "Look like the company that installs the $30k system — and fill the schedule year-round, not just at peak.",
  },
  {
    name: "Plumbing",
    body: "Win the panicked 2am search on trust at first glance, and book more of the high-ticket repipes and remodels.",
  },
  {
    name: "Electrical",
    body: "Panel upgrades and EV chargers go to the company that reads licensed, exact, and safe — before the first call.",
  },
  {
    name: "Roofing",
    body: "Five-figure jobs in a low-trust industry go to whoever looks most established. Be that company by storm season.",
  },
  {
    name: "Landscaping",
    body: "Charge design fees instead of bidding against lawn crews — with a brand that reads like a studio.",
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
            We focus on home-service businesses, so the brand, the website, and
            the follow-up are built around how your customers actually decide.
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
