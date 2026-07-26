import Reveal from "./Reveal";

const industries = [
  {
    name: "HVAC",
    image: "ind-hvac",
    alt: "An air-conditioning condenser unit beside a stucco wall in warm evening light.",
    body: "Look like the company that installs the $30k system — and fill the schedule year-round, not just at peak.",
  },
  {
    name: "Plumbing",
    image: "ind-plumbing",
    alt: "Brass and copper trap pipework under a counter against a dark wall.",
    body: "Win the panicked 2am search on trust at first glance, and book more of the high-ticket repipes and remodels.",
  },
  {
    name: "Electrical",
    image: "ind-electrical",
    alt: "An open breaker panel with neatly dressed wiring.",
    body: "Panel upgrades and EV chargers go to the company that reads licensed, exact, and safe — before the first call.",
  },
  {
    name: "Roofing",
    image: "ind-roofing",
    alt: "A close view of asphalt shingles along a gutter edge in raking light.",
    body: "Five-figure jobs in a low-trust industry go to whoever looks most established. Be that company by storm season.",
  },
  {
    name: "Landscaping",
    image: "ind-landscaping",
    alt: "An agave planted in gravel beside a stacked stone wall.",
    body: "Charge design fees instead of bidding against lawn crews — with a brand that reads like a studio.",
  },
];

export default function Industries() {
  return (
    <section id="industries" className="ind section">
      <div className="container">
        <Reveal className="ind__head">
          <p className="label">Industries we serve</p>
          <h2 className="display t-2xl ind__title">We speak your trade.</h2>
          <p className="lead measure-wide ind__intro">
            We focus on home-service businesses, so the brand, the website, and
            the follow-up are built around how your customers actually decide.
          </p>
        </Reveal>

        <ul className="ind-list">
          {industries.map((it) => (
            <Reveal as="li" key={it.name} className="ind-row">
              <h3 className="ind-row__name">{it.name}</h3>
              <p className="ind-row__desc">{it.body}</p>
              <div className="ind-row__thumb">
                <picture>
                  <source srcSet={`/media/${it.image}.webp`} type="image/webp" />
                  <img
                    src={`/media/${it.image}.jpg`}
                    alt={it.alt}
                    width={320}
                    height={320}
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
              </div>
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
