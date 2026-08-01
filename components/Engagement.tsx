import Reveal from "./Reveal";

/**
 * The prices, on the page, before the call.
 *
 * Not a pricing matrix and not a tier grid with a highlighted middle column.
 * Three rows, three numbers, one sentence each. The free audit is listed as
 * an engagement rather than as a CTA because that is what it actually is.
 */
const rows = [
  {
    name: "Perception audit",
    figure: "Free",
    desc: "The teardown of how your company reads to a homeowner today: site, brand, reviews, socials. Yours to keep whether or not you hire us.",
  },
  {
    name: "Brand transformation",
    figure: "from $8,500",
    desc: "The project. Brand identity, website, content and photo direction, social presence, and ad creative built to run.",
  },
  {
    name: "Growth retainer",
    figure: "from $1,200 / mo",
    desc: "The ongoing system. Follow-up, missed-call text back, booking automation, CRM, reputation, and ad management.",
  },
];

export default function Engagement() {
  return (
    <section className="section">
      <div className="container eng__grid">
        <Reveal motion="slide">
          <p className="label">What it costs</p>
          <h2 className="wide t-2xl eng__title">
            The numbers, before you get on a call.
          </h2>
          <p className="eng__body">
            Published so you can rule us out in thirty seconds instead of
            spending an hour on the phone finding out. Both are starting
            points, not quotes.
          </p>
        </Reveal>

        <ul className="eng__rows">
          {rows.map((r) => (
            <Reveal as="li" key={r.name} className="engrow" motion="rise">
              <h3 className="engrow__name">{r.name}</h3>
              <span className="engrow__figure">{r.figure}</span>
              <p className="engrow__desc">{r.desc}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
