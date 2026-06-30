import StarMark from "./StarMark";

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="container hero__grid">
        <div className="hero__main">
          <p className="eyebrow hero__eyebrow">
            <StarMark size={15} /> Growth agency for local service businesses
          </p>

          <h1 className="display h-xl hero__head">
            <span className="hero__line">
              <span>More Calls.</span>
            </span>
            <span className="hero__line">
              <span>More Jobs.</span>
            </span>
            <span className="hero__line">
              <span className="accent serif">Less Busy Work.</span>
            </span>
          </h1>

          <p className="lead hero__lead measure-wide">
            We build high-converting websites, run Google &amp; Meta ads, and
            automate follow-up so local service businesses can grow faster.
          </p>

          <div className="hero__cta">
            <a className="btn" href="#start">
              Book a Free Strategy Call <span className="arrow">↗</span>
            </a>
            <a className="tlink hero__see" href="#work">
              View Our Work <span aria-hidden>↓</span>
            </a>
          </div>
        </div>

        <aside className="hero__meta" aria-label="What we do">
          <StarMark size={34} className="hero__star" />
          <dl className="hero__meta-list">
            <div>
              <dt>We do</dt>
              <dd>Websites · Google &amp; Meta ads · Automation</dd>
            </div>
            <div>
              <dt>Built for</dt>
              <dd>HVAC · Plumbing · Electrical · Roofing · Landscaping</dd>
            </div>
            <div>
              <dt>The promise</dt>
              <dd>More qualified calls and booked jobs — less admin</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
