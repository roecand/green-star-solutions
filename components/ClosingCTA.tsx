import Reveal from "./Reveal";

export default function ClosingCTA() {
  return (
    <section className="closing section on-dark bleed">
      <div className="closing__bg" aria-hidden>
        <picture>
          <source srcSet="/media/closing-plate.webp" type="image/webp" />
          <img
            src="/media/closing-plate.jpg"
            alt=""
            width={1672}
            height={941}
            loading="lazy"
            decoding="async"
          />
        </picture>
      </div>
      <div className="closing__scrim" aria-hidden />

      <div className="container">
        <Reveal className="closing__inner" motion="rise">
          <h2 className="wide closing__head">
            Let&rsquo;s redesign how people see you.
          </h2>
          <p className="lead closing__sub">
            We audit how your company reads to a homeowner today, and show you
            exactly what would change. No obligation, and you keep the audit
            either way.
          </p>
          <a href="#start" className="btn closing__btn">
            Book a free call
          </a>
        </Reveal>
      </div>
    </section>
  );
}
