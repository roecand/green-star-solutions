import StarMark from "./StarMark";
import Reveal from "./Reveal";

export default function ClosingCTA() {
  return (
    <section className="closing section surface-forest">
      <div className="container">
        <Reveal className="closing__inner">
          <StarMark size={40} className="closing__star star--spin" />
          <h2 className="display closing__head">
            Let&rsquo;s redesign how
            <span className="serif accent"> people see you</span>.
          </h2>
          <p className="lead closing__sub measure-wide">
            Book a free strategy call. We&rsquo;ll audit how your company reads
            to a homeowner today — and show you exactly what a perception
            transformation would change. No obligation, no pressure.
          </p>
          <a href="#start" className="btn btn--light closing__btn">
            Book a Free Strategy Call <span className="arrow">↗</span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
