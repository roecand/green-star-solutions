import StarMark from "./StarMark";
import Reveal from "./Reveal";

export default function ClosingCTA() {
  return (
    <section className="closing section surface-forest">
      <div className="container">
        <Reveal className="closing__inner">
          <StarMark size={40} className="closing__star star--spin" />
          <h2 className="display closing__head">
            Your next stage of growth is an operations problem,
            <span className="serif accent"> not a marketing one</span>.
          </h2>
          <p className="lead closing__sub measure-wide">
            Tell us about the business. We’ll give you a straight read on what’s
            capping growth — and what it would take to fix it. No pitch theater.
          </p>
          <a href="#start" className="btn btn--light closing__btn">
            Book a working session <span className="arrow">↗</span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
