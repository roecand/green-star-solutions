import StarMark from "./StarMark";
import Reveal from "./Reveal";

const steps = [
  {
    no: "01",
    title: "Build your digital foundation",
    body: "We launch a high-converting website and get your Google profile, tracking, and CRM dialed in — the base everything else runs on.",
  },
  {
    no: "02",
    title: "Generate qualified leads",
    body: "Google & Meta ads put you in front of people who are actively looking for your service, right now, in your service area.",
  },
  {
    no: "03",
    title: "Automate follow-up",
    body: "Missed-call text-back and AI follow-up respond in seconds, so every lead gets chased and no job goes cold.",
  },
  {
    no: "04",
    title: "Scale profitably",
    body: "We track what's working, double down on it, and grow your booked jobs — without growing your busywork.",
  },
];

export default function Process() {
  return (
    <section id="how" className="process section surface-forest">
      <div className="container">
        <Reveal className="process__head">
          <p className="eyebrow">
            <StarMark size={14} className="process__star" /> How it works
          </p>
          <h2 className="display h-lg">
            A simple system that compounds.
          </h2>
        </Reveal>

        <ol className="process__grid">
          {steps.map((s, i) => (
            <Reveal as="li" key={s.no} className="pstep" delay={i * 80}>
              <span className="pstep__no mono">{s.no}</span>
              <hr className="rule pstep__rule" />
              <h3 className="display pstep__title">{s.title}</h3>
              <p className="pstep__body">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
