import Reveal from "./Reveal";

/**
 * Editorial rows. The photograph confirms the row under the cursor rather
 * than sitting there competing with it, which keeps five trades from becoming
 * five identical cards.
 *
 * Alt text here was written against the actual pixels, not the filenames.
 * Four of six were wrong the last time they were written from filenames.
 */
const trades = [
  {
    name: "HVAC",
    image: "ind-hvac",
    alt: "An air-conditioning condenser unit beside a stucco wall in warm evening light.",
    body: "Look like the company that installs the $30k system, and fill the schedule year round instead of only at peak.",
  },
  {
    name: "Plumbing",
    image: "ind-plumbing",
    alt: "Brass and copper trap pipework under a counter against a dark wall.",
    body: "Win the panicked 2am search on trust at first glance, then book more of the high-ticket repipes and remodels.",
  },
  {
    name: "Electrical",
    image: "ind-electrical",
    alt: "An open breaker panel with neatly dressed wiring.",
    body: "Panel upgrades and EV chargers go to whoever reads licensed, exact and safe, and that judgment happens before the first call.",
  },
  {
    name: "Roofing",
    image: "ind-roofing",
    alt: "A close view of asphalt shingles along a gutter edge in raking light.",
    body: "Five-figure jobs in a low-trust industry go to whoever looks most established. Be that company before storm season.",
  },
  {
    name: "Landscaping",
    image: "ind-landscaping",
    alt: "An agave planted in gravel beside a stacked stone wall.",
    body: "Charge design fees instead of bidding against lawn crews, with a brand that reads like a studio rather than a truck.",
  },
];

export default function Trades() {
  return (
    <section id="industries" className="section">
      <div className="container">
        <Reveal className="trades__head" motion="rise">
          <h2 className="wide t-2xl">
            Five trades. Five different ways a homeowner decides.
          </h2>
        </Reveal>

        <ul className="trade-list">
          {trades.map((t) => (
            <Reveal as="li" key={t.name} className="trade" motion="rise">
              <h3 className="wide trade__name">{t.name}</h3>
              <p className="trade__desc">{t.body}</p>
              <div className="trade__thumb plate">
                <picture>
                  <source srcSet={`/media/${t.image}.webp`} type="image/webp" />
                  <img
                    src={`/media/${t.image}.jpg`}
                    alt={t.alt}
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

        <Reveal className="trades__note" motion="rise">
          Not on the list? If you sell a service to local homeowners, the same
          thing is almost certainly true of your market.
        </Reveal>
      </div>
    </section>
  );
}
