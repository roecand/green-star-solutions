import Slot from "./Slot";

/**
 * Editorial manifesto hero. One claim, one line of support, one action, then
 * a wide band of photography. Playbook A: about 30 words above the fold.
 *
 * The old hero ran a three-line headline, a four-line paragraph, two CTAs and
 * a three-item definition list side by side. That is four competing text
 * blocks in the one moment where the page has a single job.
 */
export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="container">
        <h1 className="wide hero__head">
          <span className="hero__line">
            <span>Homeowners decide</span>
          </span>
          <span className="hero__line">
            <span>in eight seconds.</span>
          </span>
        </h1>

        <div className="hero__foot">
          <p className="lead hero__sub">
            We design what they see in those eight seconds. Then we make sure
            the call actually gets answered.
          </p>
          <div className="hero__cta">
            <a className="btn" href="#start">
              Book a free call
            </a>
            <a className="tlink" href="#work">
              See the work
            </a>
          </div>
        </div>
      </div>

      <div className="bleed hero__band">
        {/* Holding image, and the first one to replace. Two problems, both
            checked against the actual pixels rather than the filename:
            measured isolation 1.4 against a target of 2.5 and lightness 27
            against a page at 94, AND the van carries the four-point sparkle
            on its door, which is the glyph this redesign just removed from
            the brand. Replacement prompt: IMAGE-BRIEF.md §1. Drop the new
            file in at this path and nothing else changes. */}
        <Slot
          id="HERO"
          spec="Full bleed, 2400x1000. A single work van shot three-quarter front on a Las Vegas residential street, hard late-afternoon sun, van sharply isolated against a bright pale stucco wall. Bright background, no people, no signage clutter."
          src="/media/hero-plate.jpg"
          alt="A green and white work van parked on open desert ground at sunset, with low mountains on the horizon behind it."
          width={2400}
          height={1028}
          priority
        />
      </div>
    </section>
  );
}
