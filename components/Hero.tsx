import StarMark from "./StarMark";

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="container hero__grid">
        <div className="hero__main">
          <p className="eyebrow hero__eyebrow">
            <StarMark size={15} /> Las Vegas · Operations &amp; AI Consulting
          </p>

          <h1 className="display h-xl hero__head">
            <span className="hero__line">
              <span>Your competitors aren&rsquo;t</span>
            </span>
            <span className="hero__line">
              <span>better at the work.</span>
            </span>
            <span className="hero__line">
              <span>
                They&rsquo;re better <span className="accent serif">run</span>.
              </span>
            </span>
          </h1>

          <p className="lead hero__lead measure-wide">
            Green Star is an operations and AI consultancy for established Las
            Vegas service businesses. We start by fixing the digital that&rsquo;s
            quietly costing you customers — the site, the missed calls, the
            wasted ad spend — then stay on to help run the parts of the business
            that actually decide whether you grow.
          </p>

          <div className="hero__cta">
            <a className="btn" href="#start">
              Book a working session <span className="arrow">↗</span>
            </a>
            <a className="tlink hero__see" href="#work">
              See how we think <span aria-hidden>↓</span>
            </a>
          </div>
        </div>

        <aside className="hero__meta" aria-label="Studio details">
          <StarMark size={34} className="hero__star" />
          <dl className="hero__meta-list">
            <div>
              <dt>Based</dt>
              <dd>Las Vegas, NV</dd>
            </div>
            <div>
              <dt>Practice</dt>
              <dd>Operations &amp; AI consulting</dd>
            </div>
            <div>
              <dt>We start with</dt>
              <dd>Websites · AI systems · Paid media</dd>
            </div>
            <div>
              <dt>Built for</dt>
              <dd>Practices, firms &amp; trades ready to scale</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
