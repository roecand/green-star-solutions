import StarMark from "./StarMark";
import Reveal from "./Reveal";

const industries = [
  "Medical & dental practices",
  "Med spas & aesthetics",
  "Law firms",
  "Chiropractors & clinics",
  "Contractors & trades",
  "Specialty & professional services",
];

const fit = [
  "You have real revenue — you’re past survival and into “how do we scale this.”",
  "You’re the bottleneck: too much runs through you, and it’s capping growth.",
  "You can feel money leaking — missed calls, no follow-up, ad spend you can’t account for.",
];

const notFit = [
  "You want the cheapest logo-and-website package. That isn’t us, and we’ll say so.",
  "You want tactics without changing how the business actually runs.",
];

export default function Audience() {
  return (
    <section id="audience" className="aud section">
      <div className="container aud__grid">
        <Reveal className="aud__left">
          <p className="eyebrow eyebrow--ink">
            <StarMark size={14} /> Who this is for
          </p>
          <h2 className="display h-lg aud__title">
            You’re great at the work.
            <br />
            You’ve outgrown how it’s run.
            <br />
            <span className="serif accent aud__title-em">That’s the gap we close.</span>
          </h2>
          <p className="lead measure aud__lead">
            This is for established local businesses with real revenue and a
            ceiling they can feel — where the constraint isn’t the service, it’s
            the systems and decisions around it:
          </p>
          <ul className="aud__industries">
            {industries.map((it, i) => (
              <Reveal as="li" key={it} delay={i * 50}>
                <StarMark size={11} className="aud__ind-star" /> {it}
              </Reveal>
            ))}
          </ul>
        </Reveal>

        <div className="aud__right">
          <Reveal className="aud__card aud__card--yes">
            <h3 className="aud__card-title">It’s a fit if</h3>
            <ul>
              {fit.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="aud__card aud__card--no" delay={90}>
            <h3 className="aud__card-title">It isn’t if</h3>
            <ul>
              {notFit.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
