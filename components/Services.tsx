import StarMark from "./StarMark";
import Reveal from "./Reveal";

const rungs = [
  {
    no: "01",
    kicker: "The on-ramp",
    title: "Fix what's costing you customers",
    body: "A site that converts, missed-call text-back, and ad spend that pays for itself. We start here because it's visible, it earns trust fast, and it funds the deeper work that follows.",
    tags: ["Website", "Missed-call capture", "Paid media", "Tracking"],
    primary: false,
  },
  {
    no: "02",
    kicker: "The systems",
    title: "Rebuild how the work flows",
    body: "Scheduling, intake, follow-up, the handoffs between your front desk and your calendar. We map how the business actually runs, then re-engineer the parts that leak time, money, and patients.",
    tags: ["Workflow mapping", "Automation", "AI assist", "Follow-up"],
    primary: false,
  },
  {
    no: "03",
    kicker: "The seat — where most of our work lives",
    title: "Operations consulting",
    body: "Once the systems hold, we stay on as the operator in your corner: what to charge, who to hire next, where capacity breaks, where the next dollar should go. This is the work. The rest earns the right to do it.",
    tags: ["Pricing", "Hiring & capacity", "Unit economics", "Growth strategy"],
    primary: true,
  },
];

export default function Services() {
  return (
    <section id="services" className="services section">
      <div className="container">
        <Reveal className="services__head">
          <p className="eyebrow eyebrow--ink">
            <StarMark size={14} /> How we engage
          </p>
          <h2 className="display h-lg services__title">
            Most firms stop at the website.
            <br />
            That&rsquo;s where we <span className="serif accent">start</span>.
          </h2>
          <p className="lead measure-wide services__intro">
            We&rsquo;re not a web shop with a consulting upsell. We&rsquo;re a
            consultancy that opens with the digital foundation because it&rsquo;s
            the fastest way to prove we can move a number — then we go to work on
            the business itself.
          </p>
        </Reveal>

        <ol className="ladder">
          {rungs.map((r, i) => (
            <Reveal
              as="li"
              key={r.no}
              className={`rung ${r.primary ? "rung--primary" : ""}`}
              delay={i * 90}
            >
              <div className="rung__no">{r.no}</div>
              <div className="rung__main">
                <p className="rung__kicker">{r.kicker}</p>
                <h3 className="display rung__title">{r.title}</h3>
                <p className="rung__body measure-wide">{r.body}</p>
                <ul className="rung__tags">
                  {r.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
