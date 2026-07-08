import StarMark from "./StarMark";
import Reveal from "./Reveal";

// Two departments, one diagnosis. Perception is the lead offer (the project);
// Conversion is the obvious add-on (the retainer). Never lead with ops.
// Pricing anchors are Robert's numbers to tune — they exist to filter
// tire-kickers and signal premium, not to quote.
const departments = [
  {
    no: "01",
    kicker: "Dept. 01 — Perception · The project",
    title: "Change what a homeowner feels in the first 8 seconds.",
    body: "Brand, website, content direction, socials, and ads — rebuilt so your company reads like the one worth trusting with the $15,000 job. This is the work that raises your prices, not just your traffic.",
    tags: [
      "Brand identity",
      "Website design",
      "Content & photo direction",
      "Social presence",
      "Google & Meta ads",
    ],
    price: "Brand transformations from $8,500",
    primary: true,
  },
  {
    no: "02",
    kicker: "Dept. 02 — Conversion · The retainer",
    title: "Then make sure every new call gets answered and booked.",
    body: "You're about to get more calls — the conversion system makes sure none of them leak. AI follow-up, missed-call text-back, appointment automation, CRM, and reviews: every lead contacted in seconds, every job chased to the close.",
    tags: [
      "AI follow-up",
      "Missed-call text back",
      "Appointment automation",
      "CRM setup",
      "Reputation & reviews",
    ],
    price: "Growth retainers from $1,200/mo",
    primary: false,
  },
];

export default function Services() {
  return (
    <section id="services" className="services section">
      <div className="container">
        <Reveal className="services__head">
          <p className="eyebrow eyebrow--ink">
            <StarMark size={14} /> The diagnosis
          </p>
          <h2 className="display h-lg services__title">
            You don&rsquo;t have a<br />
            <span className="serif accent">leads</span> problem.
          </h2>
          <p className="lead measure-wide services__intro">
            You have a perception problem and a follow-up problem. We built a
            department for each — one changes how people see you, the other
            makes sure nothing they do about it slips away.
          </p>
        </Reveal>

        <ol className="ladder">
          {departments.map((d, i) => (
            <Reveal
              as="li"
              key={d.no}
              className={`rung ${d.primary ? "rung--primary" : ""}`}
              delay={i * 100}
            >
              <span className="rung__no">{d.no}</span>
              <div>
                <p className="rung__kicker">{d.kicker}</p>
                <h3 className={`display rung__title ${d.primary ? "" : "rung__title--sm"}`}>
                  {d.title}
                </h3>
                <p className="rung__body">{d.body}</p>
                <ul className="rung__tags">
                  {d.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <p className="rung__price mono">
                  <StarMark size={12} /> {d.price}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
