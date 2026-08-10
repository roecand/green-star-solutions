import Motif from "./Motif";
import Reveal from "./Reveal";

/**
 * What you can engage the studio for — named, described, and unpriced.
 *
 * This section used to publish three figures. It no longer does. A published
 * price is either a floor that gets argued down or a ceiling that loses the
 * job before anyone has spoken, and a number you set yourself is the one kind
 * of number that costs nothing to state and therefore proves nothing. The
 * engagement is the thing worth naming; the quote is a conversation.
 *
 * Still not a tier grid with a highlighted middle column: rows, names, one
 * sentence each, and a single route to a quote at the end rather than a
 * button repeated on every row.
 */
const rows = [
  {
    name: "Perception audit",
    desc: "The teardown of how you read to a homeowner today. Yours whether or not you hire us.",
  },
  {
    name: "Brand transformation",
    desc: "The project. Brand identity, website, content and photo direction, socials, and ads built to run.",
  },
  {
    name: "Growth retainer",
    desc: "The ongoing system. Follow-up, missed-call text back, booking automation, CRM, reputation, and ad management.",
  },
];

export default function Engagement() {
  return (
    <section className="section">
      <div className="container eng__grid">
        <Reveal motion="slide">
          <p className="label">What we do</p>
          <h2 className="wide t-2xl eng__title">
            Three ways to work with us.
          </h2>
          <p className="eng__body">
            Every job is scoped after we look, never before. The audit is free
            either way.
          </p>
          {/* The one motif on the page. It sits in real empty ground rather
              than behind copy: --gs-paper-soft is already at the AA floor on
              forest, so a volume behind body text fails contrast at any
              opacity. Here nothing overlaps it. */}
          <Motif shape="warp" size={300} className="eng__motif" />
        </Reveal>

        <ul className="eng__rows">
          {rows.map((r) => (
            <Reveal as="li" key={r.name} className="engrow" motion="rise">
              <h3 className="engrow__name">{r.name}</h3>
              <p className="engrow__desc">{r.desc}</p>
            </Reveal>
          ))}

          <Reveal className="eng__foot" motion="rise">
            <a className="btn" href="#start">
              Call for a free quote
            </a>
          </Reveal>
        </ul>
      </div>
    </section>
  );
}
