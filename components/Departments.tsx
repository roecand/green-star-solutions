import Reveal from "./Reveal";
import Slot from "./Slot";

/**
 * Two panels, hard colour block down the middle. The project sits on paper,
 * the retainer sits on ink, so the difference between a one-off and an
 * ongoing commitment is legible before a word is read.
 *
 * This replaces a stacked "ladder" of two near-identical image-and-text rows.
 * Two consecutive rows of the same split is where a page starts to feel
 * generated.
 */
export default function Departments() {
  return (
    <section id="services" className="section">
      <div className="container">
        <Reveal motion="rise" className="sec-head">
          <h2 className="wide t-2xl">You do not have a leads problem.</h2>
          <p className="lead">
            You have a perception problem and a follow-up problem. There is a
            department for each.
          </p>
        </Reveal>

        <Reveal className="depts" motion="rise">
          <div className="dept dept--project">
            <p className="dept__role">Perception. The project.</p>
            <h3 className="dept__title">
              Change what a homeowner feels in the first eight seconds.
            </h3>
            <p className="dept__body">
              Brand, website, content direction, socials and ads, rebuilt so the
              company reads like the one worth trusting with the $15,000 job.
              This is the work that raises your prices, not just your traffic.
            </p>
            <ul className="dept__list">
              <li>Brand identity</li>
              <li>Website design</li>
              <li>Photo direction</li>
              <li>Social presence</li>
              <li>Google and Meta ads</li>
            </ul>
            <p className="dept__price">Brand transformations from $8,500</p>
            {/* Holding image. Alt written from the pixels, not the
                filename. Note the polo carries the retired four-point
                sparkle embroidered on the chest, so this is a replacement
                priority alongside the hero. IMAGE-BRIEF.md §2. */}
            <Slot
              id="DEPT-A"
              className="dept__media"
              spec="1600x900. A folded forest-green work polo and cap squared off on raw concrete, hard morning sidelight, deep shadow. Single subject, bright ground, nothing else in frame."
              src="/media/dept-perception.jpg"
              alt="A folded dark green work polo and a matching cap laid on raw concrete in hard, low sunlight."
              width={1120}
              height={1400}
            />
          </div>

          <div className="dept dept--retainer">
            <p className="dept__role">Conversion. The retainer.</p>
            <h3 className="dept__title">
              Then make sure every call that comes in gets booked.
            </h3>
            <p className="dept__body">
              You are about to get more calls, and this is what stops them
              leaking. Follow-up, missed-call text back, appointment automation,
              CRM and reviews: every lead contacted in seconds, every job chased
              to the close.
            </p>
            <ul className="dept__list">
              <li>AI follow-up</li>
              <li>Missed-call text back</li>
              <li>Appointment automation</li>
              <li>CRM setup</li>
              <li>Reputation and reviews</li>
            </ul>
            <p className="dept__price">Growth retainers from $1,200 a month</p>
            {/* Holding image. The only one of the four large photographs
                with no retired sparkle in it, but still a dusk scene at
                lightness 27. IMAGE-BRIEF.md §3 replaces it with daylight. */}
            <Slot
              id="DEPT-B"
              className="dept__media"
              spec="1600x900. A phone lighting up face-up on the passenger seat of a work truck at dusk, screen the brightest thing in frame, desert visible through the window. Shallow depth, phone isolated."
              src="/media/dept-conversion.jpg"
              alt="A phone screen glowing on the worn seat of a work truck at dusk, desert and mountains visible through the open window."
              width={1120}
              height={1400}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
