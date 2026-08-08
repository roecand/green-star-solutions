/**
 * The signature intro covers the page for roughly three seconds.
 *
 * Scroll reveals use an IntersectionObserver, which reports viewport geometry
 * and knows nothing about being occluded. On a tall display the first reveal
 * sits inside the initial viewport, so without this gate it would fire and
 * finish behind the veil and the circle would open onto content that had
 * already arrived.
 *
 * Resolves immediately when there is no intro to wait for: reduced motion, a
 * repeat visit in the same tab, any page that isn't home, or a browser that
 * can't run it. In all of those the element removes itself before hydration.
 */
export function whenIntroDone(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (!document.querySelector("signature-intro")) return Promise.resolve();

  return new Promise<void>((resolve) => {
    let poll = 0;
    let timer = 0;

    const finish = () => {
      window.clearInterval(poll);
      window.clearTimeout(timer);
      document.removeEventListener("si:done", finish);
      resolve();
    };

    document.addEventListener("si:done", finish);

    // The element can also vanish without ever reporting -- React discarding
    // a node during hydration, say -- so treat its absence as finished too.
    poll = window.setInterval(() => {
      if (!document.querySelector("signature-intro")) finish();
    }, 150);

    // Content must never be held hostage to an optional flourish. If the
    // intro somehow never reports finishing, reveal everything anyway.
    timer = window.setTimeout(finish, 6000);
  });
}
