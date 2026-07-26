import Reveal from "./Reveal";

export default function ClosingCTA() {
  return (
    <section className="closing section surface-forest">
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
        <Reveal className="closing__inner">
          <h2 className="display closing__head">
            Let&rsquo;s redesign how people see you.
          </h2>
          <p className="lead closing__sub measure-wide">
            Book a free strategy call. We&rsquo;ll audit how your company reads
            to a homeowner today — and show you exactly what a perception
            transformation would change. No obligation, no pressure.
          </p>
          <a href="#start" className="btn btn--light closing__btn">
            Book a Free Strategy Call
          </a>
        </Reveal>
      </div>
    </section>
  );
}
