import StarMark from "./StarMark";
import Reveal from "./Reveal";

const decisions = [
  {
    title: "308 reviews, surfaced",
    body: "Patients decide on trust before they ever call. We pulled her real reputation to the top of the page instead of burying it three clicks deep.",
  },
  {
    title: "A booking button, not a phone number",
    body: "Online scheduling through Zocdoc. The appointment gets made at 11pm — exactly when a phone call would have gone to voicemail.",
  },
  {
    title: "Trilingual by design — English, Español, 한국어",
    body: "Her patients speak three languages, so the site does too. Hand-written in each, not a clumsy auto-translate widget bolted on top.",
  },
  {
    title: "Insurance answered up front",
    body: "The first question every patient asks is “do you take my plan?” We answer it before they have to ask, with the in-network carriers right there.",
  },
];

export default function CaseStudy() {
  return (
    <section id="work" className="cs section">
      <div className="container">
        <Reveal className="cs__head">
          <p className="eyebrow eyebrow--ink">
            <StarMark size={14} /> Proof · How we think
          </p>
          <h2 className="display h-lg cs__title">
            The deliverable was a website.
            <br />
            The point was the <span className="serif accent">pipeline</span>.
          </h2>
          <p className="lead measure-wide cs__intro">
            Dr. Janie Kwak-Tran, MD runs a busy Las Vegas internal medicine
            practice. We were hired for a website. What we actually rebuilt was
            the path a patient takes from a Google search to a booked, in-network
            appointment. The site is just where that thinking became visible.
          </p>
        </Reveal>

        <div className="cs__grid">
          {/* ---- the mini-site recreation ---- */}
          <Reveal className="cs__demo-wrap" delay={80}>
            <figure className="mock" aria-label="Recreation of the Dr. Kwak-Tran practice website">
              <div className="mock__bar">
                <span className="mock__dot" />
                <span className="mock__dot" />
                <span className="mock__dot" />
                <span className="mock__url">janiekwaktranmd.com</span>
              </div>

              <div className="mock__body">
                <div className="mock__topline">
                  <span className="mock__brand">Janie Kwak-Tran, MD</span>
                  <span className="mock__lang">
                    <b>EN</b>
                    <i>ES</i>
                    <i>한국어</i>
                  </span>
                </div>

                <p className="mock__eyebrow">Board-Certified Internal Medicine · Las Vegas</p>
                <h3 className="mock__head">
                  Primary care that actually has time for you.
                </h3>
                <p className="mock__sub">
                  Same-week appointments, in-network with major plans, and a
                  doctor who listens. Accepting new patients now.
                </p>

                <div className="mock__cta">
                  <span className="mock__book">Book on Zocdoc →</span>
                  <span className="mock__newpt">New patients welcome</span>
                </div>

                <div className="mock__reviews">
                  <span className="mock__stars" aria-hidden>
                    ★★★★★
                  </span>
                  <span className="mock__rev-num">4.9</span>
                  <span className="mock__rev-label">308 verified patient reviews</span>
                </div>

                <div className="mock__insurance">
                  <span className="mock__ins-label">In-network</span>
                  <span>Aetna</span>
                  <span>Cigna</span>
                  <span>UnitedHealthcare</span>
                  <span>Blue Cross</span>
                </div>
              </div>
            </figure>
            <figcaption className="cs__caption">
              A faithful recreation. Different palette, different voice — built
              for her patients, not our portfolio.
            </figcaption>
          </Reveal>

          {/* ---- the decisions ---- */}
          <div className="cs__notes">
            <ul className="cs__decisions">
              {decisions.map((d, i) => (
                <Reveal as="li" key={d.title} className="cs__decision" delay={i * 70}>
                  <StarMark size={13} className="cs__decision-star" />
                  <div>
                    <h4 className="cs__decision-title">{d.title}</h4>
                    <p className="cs__decision-body">{d.body}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>

        <Reveal className="cs__stats">
          <Stat n="308" label="patient reviews surfaced" />
          <Stat n="3" label="languages, written by hand" />
          <Stat n="24/7" label="online booking, no phone tag" />
          <Stat n="4" label="major insurers, shown up front" />
        </Reveal>

        <Reveal className="cs__quote">
          <blockquote className="pull">
            “A website is the part of the business you can see. The work is
            everything that has to happen after someone lands on it.”
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="stat">
      <span className="display stat__n">{n}</span>
      <span className="stat__label">{label}</span>
    </div>
  );
}
