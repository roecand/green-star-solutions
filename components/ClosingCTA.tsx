import StarMark from "./StarMark";
import Reveal from "./Reveal";

export default function ClosingCTA() {
  return (
    <section className="closing section surface-forest">
      <div className="container">
        <Reveal className="closing__inner">
          <StarMark size={40} className="closing__star star--spin" />
          <h2 className="display closing__head">
            Let&rsquo;s get your phone
            <span className="serif accent"> ringing</span>.
          </h2>
          <p className="lead closing__sub measure-wide">
            Book a free strategy call. We&rsquo;ll map out exactly how to get you
            more calls and booked jobs — no obligation, no jargon, no pressure.
          </p>
          <a href="#start" className="btn btn--light closing__btn">
            Book a Free Strategy Call <span className="arrow">↗</span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
