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
 * can't run it.
 *
 * "Nothing to wait for" is NOT the same as "the element is gone". It used to
 * be: the element deleted itself on every one of those paths. It no longer
 * does -- deleting a node React had server-rendered crashed the next
 * client-side navigation -- so it stays parented and hidden for the life of
 * the page, and presence alone would mean this never resolves early. Every
 * page that skips the intro then waited out the 6s failsafe below with all of
 * its content still at opacity 0, which reads as a very slow page.
 *
 * The signal is the retired marker the element sets the moment it finishes or
 * bails, which it does during parse and therefore before hydration.
 */
const introRunning = () => {
  const el = document.querySelector("signature-intro");
  return !!el && !el.hasAttribute("data-si-retired");
};

export function whenIntroDone(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (!introRunning()) return Promise.resolve();

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

    // The element can also retire without ever reporting -- a bail condition
    // reached after this gate was created, say -- so poll the marker too.
    poll = window.setInterval(() => {
      if (!introRunning()) finish();
    }, 150);

    // Content must never be held hostage to an optional flourish. If the
    // intro somehow never reports finishing, reveal everything anyway.
    timer = window.setTimeout(finish, 6000);
  });
}
