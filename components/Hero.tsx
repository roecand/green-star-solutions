export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="container hero__grid">
        <div className="hero__main">
          <p className="label hero__eyebrow">A perception studio for the trades</p>

          <h1 className="display hero__head hero__head--sentence">
            <span className="hero__line">
              <span>We redesign the feeling</span>
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
              Book a Free Strategy Call
            </a>
            <a className="tlink hero__see" href="#work">
              See the transformations
            </a>
          </div>
        </div>

        <aside className="hero__meta" aria-label="What we do">
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

      {/* Full-bleed establishing shot. The headline sits in ink above it
          rather than over it — the left of the frame is bright sky and would
          not hold white text. */}
      <div className="plate hero__plate">
        <picture>
          <source srcSet="/media/hero-plate.webp" type="image/webp" />
          <img
            src="/media/hero-plate.jpg"
            alt="A Green Star Solutions work van on a desert road outside Las Vegas at golden hour."
            width={2400}
            height={1028}
            fetchPriority="high"
            decoding="async"
          />
        </picture>
      </div>
    </section>
  );
}
