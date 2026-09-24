/** Fixtures for the outbound engine: a dated, under-selling trades site. */
export const DATED_SITE_HTML = `<!DOCTYPE html>
<html><head><title>Welcome to Mike's Heating</title></head>
<body>
  <h1>Welcome to Mike's Heating &amp; Air</h1>
  <p>We are a family owned business serving the Reno area with heating and cooling services for your home.</p>
  <h2>Our Services</h2>
  <ul><li>Furnace repair and replacement for all major brands</li><li>Air conditioning installation and tune-ups every spring</li></ul>
  <form action="/contact"><input name="first_name"><input name="last_name"><input name="email"><input name="phone"><input name="street"><input name="city"><input name="zip"><select name="system"></select><textarea name="message"></textarea></form>
  <p>Our team has served northern Nevada homeowners for decades with honest pricing and careful work on every job we take on.</p>
  <p>Read what our customers say — over 180 Google reviews from homeowners across Reno and Sparks who trusted us with their homes.</p>
  <footer><p>Call us at 775-555-0199 during business hours for scheduling information.</p><p>© 2014 Mike's Heating and Air. All rights reserved.</p></footer>
</body></html>`;

export const POLISHED_SITE_HTML = `<!DOCTYPE html>
<html><head><title>Summit Plumbing — Same-Day Plumbers in Denver</title>
<meta name="description" content="Licensed Denver plumbers. Book online in 60 seconds.">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="https://widgets.podium.com/podium-widget.js"></script>
<script src="https://book.housecallpro.com/embed.js"></script>
</head>
<body>
  <a href="tel:3035550100">(303) 555-0100</a>
  <h1>Same-day plumbing repair in Denver, done right the first time</h1>
  <a class="btn" href="/book">Book Online</a>
  <p>Rated 4.9 stars from 1,200+ reviews. Licensed and insured, Colorado license #12345. Serving Denver since 2004.</p>
  <h2>Our Services</h2>
  <p>Water heaters, drain cleaning, leak repair, and repiping. Text us anytime at (303) 555-0100 — we respond within 5 minutes, 24/7 emergency service available.</p>
  <form><input name="name"><input name="phone"><input name="email"></form>
  <a href="https://facebook.com/summitplumbing">Facebook</a>
  <footer>© ${new Date().getFullYear()} Summit Plumbing</footer>
</body></html>`;
