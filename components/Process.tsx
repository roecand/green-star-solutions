import StarMark from "./StarMark";
import Reveal from "./Reveal";

const steps = [
  {
    no: "01",
    title: "Diagnose",
    body: "We audit the business, not just the website: where leads leak, what competitors do better, where the money actually goes. You get a straight diagnosis before anyone designs anything.",
  },
  {
    no: "02",
    title: "Build",
    body: "We build the fix in the open — site, systems, and the workflows behind them. You see it come together and weigh in as we go. No black box, no big-reveal theatrics.",
  },
  {
    no: "03",
    title: "Launch",
    body: "We ship it properly: fast, accessible, and tracked. The day it goes live we already know it works, because we tested that it works.",
  },
  {
    no: "04",
    title: "Optimize",
    body: "Launch is the start of the engagement, not the end. We watch the numbers and keep tuning the site, the systems, and the operation against real results.",
  },
];

export default function Process() {
  return (
    <section id="process" className="process section surface-forest">
      <div className="container">
        <Reveal className="process__head">
          <p className="eyebrow">
            <StarMark size={14} className="process__star" /> How an engagement runs
          </p>
          <h2 className="display h-lg">
            A loop we run until the numbers move.
          </h2>
        </Reveal>

        <ol className="process__grid">
          {steps.map((s, i) => (
            <Reveal as="li" key={s.no} className="pstep" delay={i * 80}>
              <span className="pstep__no display">{s.no}</span>
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
