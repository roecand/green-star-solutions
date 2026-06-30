import StarMark from "./StarMark";
import Reveal from "./Reveal";

export default function About() {
  return (
    <section id="about" className="about section">
      <div className="container about__grid">
        <Reveal className="about__aside">
          <p className="eyebrow eyebrow--ink">
            <StarMark size={14} /> Who’s behind it
          </p>
          <div className="about__mark" aria-hidden>
            <StarMark size={96} />
          </div>
        </Reveal>

        <Reveal className="about__body" delay={80}>
          <p className="display about__lead">
            Green Star is an operations consultancy that happens to build the
            digital first.
          </p>
          <div className="about__prose measure-wide">
            <p>
              I work on the systems a business actually runs on — pricing,
              capacity, the flow from first call to repeat customer — then make
              the front end look the part. Before this was a consultancy, it was
              years inside local businesses working out why a few stay full and
              most stall.
            </p>
            <p>
              The website and the ads are just the fastest way to prove the
              thinking is sound. The lasting work is in the operation: what to
              charge, who to hire next, what to stop doing. You work directly
              with the person doing that work — no account managers, no offshore
              handoff, no template factory.
            </p>
          </div>
          {/* ↓ Replace with your name & signature */}
          <p className="serif about__sign">— Green Star Solutions, Las Vegas</p>
        </Reveal>
      </div>
    </section>
  );
}
