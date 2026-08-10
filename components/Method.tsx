import Reveal from "./Reveal";

/**
 * Sticky heading, scrolling steps. The heading holds while the four stages
 * pass it, which is what a sequence actually looks like.
 *
 * No 01/02/03 indices. The stages have names, and once they have names the
 * numbers are decoration applied by rule rather than by judgment.
 */
const steps = [
  {
    title: "The perception audit",
    body: "We tear down how you read today: site, brand, reviews, socials. Then we show you what a homeowner sees before they call.",
  },
  {
    title: "The transformation",
    body: "Brand, website, content and ads rebuilt in your voice, so the $15,000 job stops going to whoever looks more established.",
  },
  {
    title: "The conversion system",
    body: "Follow-up, missed-call text back and booking automation switch on, so no new call sits in a voicemail box.",
  },
  {
    title: "Ongoing growth",
    body: "We sharpen the ads, feed the reviews, and track what books jobs rather than what gets clicks.",
  },
];

export default function Method() {
  return (
    <section id="how" className="section">
      <div className="container method__grid">
        <div className="method__sticky">
          <Reveal motion="slide">
            <h2 className="wide t-2xl method__title">
              First we change how you look. Then we make sure it pays.
            </h2>
            <p className="method__note">
              Four stages. The first is free, and the findings are yours to
              keep.
            </p>
          </Reveal>
        </div>

        <ol className="method__steps">
          {steps.map((s) => (
            <Reveal as="li" key={s.title} className="mstep" motion="rise">
              <h3 className="mstep__title">
                <span className="mstep__tick" aria-hidden />
                {s.title}
              </h3>
              <p className="mstep__body">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
