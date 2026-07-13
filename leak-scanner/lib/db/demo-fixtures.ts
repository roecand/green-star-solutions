/**
 * Synthetic demo-business HTML used by the seed script. Clearly fictional
 * businesses; quality varies so demo scores spread realistically.
 */

export interface DemoBusiness {
  slug: string;
  shareToken: string;
  businessName: string;
  industry: string;
  city: string;
  state: string;
  email: string;
  primaryGoal: string;
  websiteUrl: string;
  html: string;
}

interface FixtureOptions {
  name: string;
  service: string;
  city: string;
  state: string;
  phone?: string;
  cta?: boolean;
  form?: boolean;
  reviews?: boolean;
  faq?: boolean;
  about?: boolean;
  guarantee?: boolean;
  license?: boolean;
  years?: boolean;
  booking?: boolean;
  schema?: boolean;
  viewport?: boolean;
  serviceArea?: boolean;
  social?: boolean;
  responsePromise?: boolean;
  process?: boolean;
  gallery?: boolean;
}

function buildHtml(o: FixtureOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<title>${o.cta ? `${o.service} in ${o.city} | ${o.name}` : `${o.name} - Welcome`}</title>
${o.cta ? `<meta name="description" content="${o.name} provides trusted ${o.service.toLowerCase()} in ${o.city}, ${o.state}. Call today for a free estimate.">` : ""}
${o.viewport ? `<meta name="viewport" content="width=device-width, initial-scale=1">` : ""}
${o.schema ? `<script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness","name":"${o.name}","address":{"@type":"PostalAddress","addressLocality":"${o.city}","addressRegion":"${o.state}"}}</script>` : ""}
</head>
<body>
<header>
${o.phone ? `<a href="tel:${o.phone.replace(/\D/g, "")}">${o.phone}</a>` : ""}
<nav><a href="/services">Services</a>${o.about ? `<a href="/about">About Us</a>` : ""}<a href="/contact">Contact</a></nav>
</header>
<main>
<h1>${o.cta ? `${o.service} in ${o.city}` : "Welcome to our website"}</h1>
${o.cta ? `<a class="btn" href="/contact">Get a Free Quote</a><p>Call now for same-day service. No obligation estimates.</p>` : `<p>We have been doing quality work for our customers. Thanks for visiting.</p>`}
<h2>Our Services</h2>
<p>${o.name} offers professional ${o.service.toLowerCase()} for homes and businesses in the area.</p>
<h2>More Services</h2>
<p>Maintenance plans, emergency ${o.service.toLowerCase()}, and seasonal specials.</p>
${o.serviceArea ? `<h2>Service Area</h2><p>Proudly serving ${o.city}, ${o.state} and surrounding areas.</p>` : ""}
${o.reviews ? `<h2>What Our Customers Say</h2><p>"Five-star service from start to finish. Highly recommend ${o.name}!" — A happy customer testimonial from ${o.city}.</p>` : ""}
${o.faq ? `<h2>Frequently Asked Questions</h2><p>How much does ${o.service.toLowerCase()} cost in ${o.city}? Pricing depends on the job — we give upfront quotes before any work begins.</p>` : ""}
${o.about ? `<h2>About Us</h2><p>Our team brings years of experience. Why choose us? Honest pricing and workmanship we stand behind.</p>` : ""}
${o.guarantee ? `<p>Every job is backed by our 100% satisfaction guarantee and workmanship warranty.</p>` : ""}
${o.license ? `<p>Fully licensed and insured. License #${o.state}-4471.</p>` : ""}
${o.years ? `<p>Family-owned and locally owned, serving the community since 2011.</p>` : ""}
${o.process ? `<h2>How It Works</h2><p>Step 1: Call or book online. Step 2: We inspect and quote. Step 3: We do the work. What happens next? You'll receive a confirmation right away.</p>` : ""}
${o.responsePromise ? `<p>We respond to every request within 24 hours — usually much faster.</p>` : ""}
${o.booking ? `<a href="https://calendly.com/demo-biz/estimate">Book Online</a>` : ""}
${o.gallery ? `<img alt="Completed ${o.service.toLowerCase()} project in ${o.city}" src="/1.jpg"><img alt="Before and after ${o.service.toLowerCase()} results" src="/2.jpg"><img alt="Our team at work on a local job" src="/3.jpg"><img alt="Customer project photo gallery image" src="/4.jpg"><img alt="Finished work closeup detail" src="/5.jpg">` : ""}
</main>
<footer>
${o.form ? `<form action="/submit"><input type="text" name="name"><input type="tel" name="phone"><input type="email" name="email"><textarea name="message"></textarea><input type="submit" value="Request Service"></form>` : ""}
${o.social ? `<a href="https://facebook.com/demo">Facebook</a><a href="https://instagram.com/demo">Instagram</a>` : ""}
${o.phone ? `<p>${o.name} • 1200 Main Street Suite 4, ${o.city}, ${o.state} • ${o.phone} • hello@example.com</p>` : `<p>${o.name}, ${o.city}</p>`}
</footer>
</body>
</html>`;
}

export const DEMO_BUSINESSES: DemoBusiness[] = [
  {
    slug: "hvac",
    shareToken: "demo-hvac-report",
    businessName: "Summit Peak Heating & Air (Demo)",
    industry: "HVAC",
    city: "Las Vegas",
    state: "NV",
    email: "demo-hvac@example.com",
    primaryGoal: "more_calls",
    websiteUrl: "https://demo-hvac.example.com",
    html: buildHtml({
      name: "Summit Peak Heating & Air",
      service: "HVAC Repair",
      city: "Las Vegas",
      state: "NV",
      phone: "(702) 555-0110",
      cta: true,
      form: true,
      reviews: true,
      faq: true,
      about: true,
      guarantee: true,
      license: true,
      years: true,
      booking: true,
      schema: true,
      viewport: true,
      serviceArea: true,
      social: true,
      responsePromise: true,
      process: true,
      gallery: true,
    }),
  },
  {
    slug: "medspa",
    shareToken: "demo-medspa-report",
    businessName: "Lumière Aesthetics (Demo)",
    industry: "Med Spa",
    city: "Henderson",
    state: "NV",
    email: "demo-medspa@example.com",
    primaryGoal: "more_bookings",
    websiteUrl: "https://demo-medspa.example.com",
    html: buildHtml({
      name: "Lumière Aesthetics",
      service: "Med Spa Treatments",
      city: "Henderson",
      state: "NV",
      phone: "(702) 555-0184",
      cta: true,
      form: true,
      reviews: true,
      about: true,
      booking: true,
      viewport: true,
      social: true,
      gallery: true,
    }),
  },
  {
    slug: "roofer",
    shareToken: "demo-roofer-report",
    businessName: "Ironclad Roofing Co. (Demo)",
    industry: "Roofing",
    city: "North Las Vegas",
    state: "NV",
    email: "demo-roofer@example.com",
    primaryGoal: "more_form_leads",
    websiteUrl: "https://demo-roofer.example.com",
    html: buildHtml({
      name: "Ironclad Roofing Co.",
      service: "Roof Repair",
      city: "North Las Vegas",
      state: "NV",
      phone: "(702) 555-0197",
      cta: true,
      form: true,
      license: true,
      years: true,
      viewport: true,
      serviceArea: true,
    }),
  },
  {
    slug: "auto",
    shareToken: "demo-auto-report",
    businessName: "Redline Auto Repair (Demo)",
    industry: "Auto Repair",
    city: "Las Vegas",
    state: "NV",
    email: "demo-auto@example.com",
    primaryGoal: "more_calls",
    websiteUrl: "https://demo-auto.example.com",
    html: buildHtml({
      name: "Redline Auto Repair",
      service: "Auto Repair",
      city: "Las Vegas",
      state: "NV",
      phone: "(702) 555-0139",
      viewport: true,
      reviews: true,
    }),
  },
  {
    slug: "landscaper",
    shareToken: "demo-landscaper-report",
    businessName: "Desert Bloom Landscaping (Demo)",
    industry: "Landscaping",
    city: "Summerlin",
    state: "NV",
    email: "demo-landscaper@example.com",
    primaryGoal: "more_visibility",
    websiteUrl: "https://demo-landscaper.example.com",
    html: buildHtml({
      name: "Desert Bloom Landscaping",
      service: "Landscaping",
      city: "Summerlin",
      state: "NV",
    }),
  },
];
