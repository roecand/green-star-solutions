import StarMark from "./StarMark";

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="container hero__grid">
        <div className="hero__main">
          <p className="eyebrow hero__eyebrow">
            <StarMark size={15} /> A perception studio for the trades
          </p>

          <h1 className="display h-xl hero__head hero__head--sentence">
            <span className="hero__line">
              <span>
                We redesign the <span className="accent serif">feeling</span>
              </span>
            </span>
            <span className="hero__line">
              <span>people get when they</span>
            </span>
            <span className="hero__line">
              <span>look at your business.</span>
            </span>
          </h1>

          <p className="lead hero__lead measure-wide">
            Brand, website, socials, and ads that make homeowners see the
            company worth premium prices — and a follow-up system that makes
            sure none of the new calls slip away.
          </p>

          <div className="hero__cta">
            <a className="btn" href="#start">
              Book a Free Strategy Call <span className="arrow">↗</span>
            </a>
            <a className="tlink hero__see" href="#work">
              See the transformations <span aria-hidden>↓</span>
            </a>
          </div>
        </div>

        <aside className="hero__meta" aria-label="What we do">
          <StarMark size={34} className="hero__star" />
          <dl className="hero__meta-list">
            <div>
              <dt>Dept. 01 — Perception</dt>
              <dd>Brand · Website · Socials · Ads</dd>
            </div>
            <div>
              <dt>Dept. 02 — Conversion</dt>
              <dd>Follow-up · Booking · CRM · Reviews</dd>
            </div>
            <div>
              <dt>Built for</dt>
              <dd>HVAC · Plumbing · Electrical · Roofing · Landscaping</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
