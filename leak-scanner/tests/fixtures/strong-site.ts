/** HTML fixtures used by extractor and scoring tests. */

export const STRONG_HOME_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Desert Air HVAC Repair in Las Vegas | Desert Air</title>
  <meta name="description" content="Licensed and insured HVAC repair, installation, and maintenance serving Las Vegas and Henderson. Free same-day estimates and a 100% satisfaction guarantee.">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"HVACBusiness","name":"Desert Air","telephone":"(702) 555-0142","address":{"@type":"PostalAddress","addressLocality":"Las Vegas","addressRegion":"NV"}}</script>
</head>
<body>
  <header>
    <a href="tel:7025550142">(702) 555-0142</a>
    <nav>
      <a href="/services">Services</a>
      <a href="/about">About Us</a>
      <a href="/reviews">Reviews</a>
      <a href="/contact">Contact</a>
      <a href="/service-areas">Service Areas</a>
    </nav>
  </header>
  <main>
    <h1>Fast, Honest HVAC Repair in Las Vegas</h1>
    <p>Family-owned and locally owned since 2008, Desert Air keeps Las Vegas homes cool. Call now for a free same-day estimate — we respond within 1 hour.</p>
    <a class="btn btn-primary" href="/contact">Get a Free Quote</a>
    <a class="btn" href="https://calendly.com/desertair/estimate">Book Online</a>
    <h2>Our Services</h2>
    <p>AC repair, furnace installation, duct cleaning, and preventive maintenance across the Las Vegas valley.</p>
    <h2>Why Choose Desert Air</h2>
    <p>NATE-certified technicians, licensed and insured (NV License #0081234), upfront pricing, and a 100% money-back guarantee on every job.</p>
    <h2>What Our Customers Say</h2>
    <p>"Desert Air fixed our AC the same day we called. Five-star service!" — Maria G., Summerlin</p>
    <h2>How It Works</h2>
    <p>Step 1: Book online or call. Step 2: We diagnose and quote upfront. Step 3: You approve, we fix it. What happens next? You'll receive a confirmation text within minutes.</p>
    <h2>Frequently Asked Questions</h2>
    <p>How much does AC repair cost in Las Vegas? Most repairs range from $150 to $650 depending on the part.</p>
    <h2>Proudly Serving</h2>
    <p>We serve Las Vegas, Henderson, Summerlin, and surrounding areas. Get directions to our shop at 4280 Industrial Road Suite 500.</p>
  </main>
  <footer>
    <form action="/api/lead">
      <input type="text" name="name" placeholder="Name">
      <input type="tel" name="phone" placeholder="Phone">
      <input type="email" name="email" placeholder="Email">
      <textarea name="message"></textarea>
      <input type="submit" value="Request Service">
    </form>
    <p>Subscribe to our seasonal maintenance newsletter.</p>
    <a href="https://www.facebook.com/desertair">Facebook</a>
    <a href="https://www.instagram.com/desertair">Instagram</a>
    <a href="https://maps.google.com/?q=desert+air">Find us on Google Maps</a>
    <img src="/img/team.jpg" alt="Desert Air technician team in Las Vegas">
    <img src="/img/before.jpg" alt="Before and after AC unit replacement in Henderson">
    <img src="/img/truck.jpg" alt="Desert Air service truck">
    <img src="/img/award.jpg" alt="Best of Las Vegas HVAC award 2024">
    <img src="/img/tech.jpg" alt="NATE certified technician repairing condenser">
    <p>Desert Air • 4280 Industrial Road Suite 500, Las Vegas, NV • (702) 555-0142 • info@desertair.com</p>
  </footer>
</body>
</html>`;

export const WEAK_HOME_HTML = `<!DOCTYPE html>
<html>
<head><title>Welcome</title></head>
<body>
  <h3>Welcome to our website</h3>
  <p>We have been doing quality work. Thank you for visiting our web page. We hope you enjoy your stay on this site.</p>
  <img src="banner.jpg">
</body>
</html>`;
