import StarMark from "./StarMark";
import Reveal from "./Reveal";

const steps = [
  {
    no: "01",
    title: "The perception audit",
    body: "We tear down how your company reads today — site, brand, reviews, socials — and show you exactly what a homeowner feels in the 8 seconds they look at you.",
  },
  {
    no: "02",
    title: "The transformation",
    body: "Brand, website, content, and ads rebuilt in your company's own voice — designed so the $15,000 job stops going to whoever looked more established.",
  },
  {
    no: "03",
    title: "The conversion system",
    body: "AI follow-up, missed-call text-back, and booking automation switch on — so every call the new brand creates gets answered, chased, and closed.",
  },
  {
    no: "04",
    title: "Ongoing growth",
    body: "We sharpen the ads, feed the reviews, and track what's booking jobs — your reputation compounds while you're on the tools.",
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
            First we change how you look.
            <br />
            Then we make sure it pays.
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
