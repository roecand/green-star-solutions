/**
 * Three statements of what the studio is, directly under the hero band.
 *
 * Kept out of the hero itself on purpose. A trust strip, a definition list or
 * a logo wall sharing the fold with the headline splits the one moment the
 * page gets to make a single claim.
 */
export default function Facts() {
  return (
    <section className="container" aria-label="What Green Star is">
      <div className="hero__facts">
        <p className="hero__fact">
          <b>Two departments</b>
          Perception rebuilds how the company reads. Conversion makes sure the
          calls it creates get booked.
        </p>
        <p className="hero__fact">
          <b>Five trades</b>
          HVAC, plumbing, electrical, roofing and landscaping. Home service
          only.
        </p>
        <p className="hero__fact">
          <b>Las Vegas</b>
          Local to the valley. Home service only, so the work is built around
          how your customers actually decide.
        </p>
      </div>
    </section>
  );
}
