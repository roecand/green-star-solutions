import StarMark from "./StarMark";
import Reveal from "./Reveal";

const services = [
  {
    name: "Website Design",
    body: "A fast, mobile-first site engineered to turn visitors into booked jobs — not just look good.",
  },
  {
    name: "Google Ads",
    body: "Show up first when someone searches “AC repair near me,” and only pay for real, local leads.",
  },
  {
    name: "Meta Ads",
    body: "Targeted Facebook & Instagram campaigns that keep your pipeline full through the slow season.",
  },
  {
    name: "CRM Setup",
    body: "Every lead, call, and job in one place, so nothing slips through the cracks.",
  },
  {
    name: "AI Follow-up",
    body: "Instant, human-sounding replies that chase every lead until they book.",
  },
  {
    name: "Missed Call Text Back",
    body: "Miss a call? They get a text in seconds — before they call your competitor.",
  },
  {
    name: "Appointment Automation",
    body: "Online booking and reminders that cut no-shows and keep your calendar full.",
  },
  {
    name: "Reputation Management",
    body: "Automatically request reviews and turn happy customers into 5-star proof.",
  },
];

export default function Services() {
  return (
    <section id="services" className="services section">
      <div className="container">
        <Reveal className="services__head">
          <p className="eyebrow eyebrow--ink">
            <StarMark size={14} /> What we do
          </p>
          <h2 className="display h-lg services__title">
            Everything it takes to get the
            <br />
            phone <span className="serif accent">ringing</span> — handled.
          </h2>
          <p className="lead measure-wide services__intro">
            One team for your website, your ads, and the automation behind them.
            No juggling five vendors who don&rsquo;t talk to each other.
          </p>
        </Reveal>

        <div className="svc-grid">
          {services.map((s, i) => (
            <Reveal key={s.name} className="svc" delay={(i % 4) * 60}>
              <span className="svc__no mono">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="svc__name">{s.name}</h3>
              <p className="svc__body">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
