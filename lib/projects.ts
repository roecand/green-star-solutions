/**
 * Concept portfolio projects.
 *
 * Every entry here is a CONCEPT — a fictional business designed to showcase
 * range. The live sites are self-contained HTML files in /public/concepts/,
 * so they deploy with the main site and can be embedded as live previews.
 *
 * To add a project: drop a site in public/concepts/<slug>/index.html and add
 * an entry below. The homepage grid, /portfolio, and the detail page all
 * render from this one array.
 */

export type Project = {
  slug: string;
  name: string;
  industry: string;
  /** e.g. "Trades" or "Hospitality" — used as a secondary chip */
  sector: string;
  /** one-line design direction, shown on cards */
  styleLabel: string;
  /** short description for cards */
  tagline: string;
  /** path to the live concept site */
  url: string;
  /** accent color pulled from the concept's palette (thumbnail frame, chips) */
  accent: string;
  overview: string[];
  designGoals: { title: string; body: string }[];
  features: string[];
  problem: { lead: string; body: string[] };
  palette: { name: string; hex: string; onDark?: boolean }[];
  fonts: { role: string; name: string; sample: string }[];
  /** before/after comparison copy */
  before: string[];
  after: string[];
};

export const projects: Project[] = [
  {
    slug: "summit-climate",
    name: "Summit Climate Solutions",
    industry: "HVAC",
    sector: "Trades",
    styleLabel: "Quiet luxury · Editorial calm · Engineered restraint",
    tagline:
      "A luxury HVAC brand that sells comfort the way Apple sells hardware — calm, precise, and priced like it belongs in the homes it serves.",
    url: "/concepts/summit-climate/index.html",
    accent: "#175ee4",
    overview: [
      "Summit Climate is a concept for a high-end heating and cooling company in Las Vegas — the contractor a homeowner calls when the house is architect-designed and the budget says 'do it properly.' Most HVAC sites shout urgency; this one projects calm competence, because at the top of the market, composure is the sales pitch.",
      "White space, a single alpine-blue accent, grotesk type, and mono coordinates ('36.17° N · elev. 2,001 ft') give it the register of a premium product launch, not a service directory. Heat pumps are presented like flagship hardware — spec grids, 19-decibel whisper claims — and membership and financing are packaged with the same polish.",
    ],
    designGoals: [
      {
        title: "Sell composure, not urgency",
        body: "Emergency service exists (there's a 24/7 bar), but the brand leads with design consultations and engineering. The customer who spends $30k on a system buys from the company that doesn't look desperate.",
      },
      {
        title: "Present equipment like a flagship product",
        body: "The heat pump gets a dark 'product page' treatment with a spec grid — 22 SEER2, 19 dB — borrowed from consumer-electronics launches. Specs signal engineering; engineering justifies price.",
      },
      {
        title: "Make the premium tier the default",
        body: "Summit Care membership and $0-down financing are designed like subscription cards, normalizing the high-end path and smoothing a five-figure decision into a monthly number.",
      },
      {
        title: "Let restraint do the pricing",
        body: "One accent color, generous whitespace, mono microlabels. Nothing shouts, so everything reads expensive — the same trick luxury architecture firms use.",
      },
    ],
    features: [
      "24/7 emergency bar with live-dispatch pulse",
      "Editorial hero with altitude-and-coordinates microcopy",
      "Photographed before/after install showcase",
      "Dark product-launch section for heat pumps with spec grid",
      "Indoor-air-quality feature with custom airflow illustration",
      "Summit Care membership card with contour-line motif",
      "Financing card anchored to a monthly number ($0 down)",
      "Trust strip: 4.9 rating, factory authorizations, 12-year guarantee",
    ],
    problem: {
      lead: "In luxury home services, the website is the first walkthrough — the company that looks like a premium product gets the premium install.",
      body: [
        "High-end homeowners don't shop HVAC on price; they shop on trust and taste. But nearly every HVAC site in a metro looks the same — red 'CALL NOW' banners, coupon pop-ups, clip-art snowflakes. A company that actually does $30,000 installs has no way to look like it.",
        "This concept gives the top of the market something to recognize. The calm layout, product-grade equipment presentation, and membership packaging tell an affluent homeowner 'this is the company your architect would pick' — which moves the conversation from 'how much?' to 'when can you start?'",
      ],
    },
    palette: [
      { name: "Snow", hex: "#ffffff" },
      { name: "Azure", hex: "#175ee4", onDark: true },
      { name: "Charcoal", hex: "#12161b", onDark: true },
      { name: "Mist", hex: "#f3f6fb" },
    ],
    fonts: [
      { role: "Display", name: "Schibsted Grotesk", sample: "The summit of home comfort." },
      { role: "Body", name: "Geist", sample: "Engineered, installed, and maintained to the summit standard." },
      { role: "Labels", name: "Geist Mono", sample: "LAS VEGAS · 36.17° N · ELEV. 2,001 FT" },
    ],
    before: [
      "Red 'CALL NOW' urgency banners everywhere",
      "Coupon pop-ups undercutting premium work",
      "Equipment listed like a parts catalog",
      "No path designed for the luxury buyer",
      "Indistinguishable from every HVAC site in town",
    ],
    after: [
      "Calm, product-launch presentation",
      "Whitespace and restraint signal expense",
      "Heat pumps staged like flagship hardware",
      "Membership and financing packaged premium",
      "Reads like the company an architect would pick",
    ],
  },
  {
    slug: "silver-state-hvac",
    name: "Silver State Heating & Air",
    industry: "HVAC",
    sector: "Trades",
    styleLabel: "Kinetic · High-contrast · Conversion-engineered",
    tagline:
      "The same trade as Summit Climate, a completely different voice — a bold, dark-mode HVAC brand built to convert the '108° and my AC just died' search at speed.",
    url: "/concepts/silver-state-hvac/index.html",
    accent: "#21a7d6",
    overview: [
      "Silver State is a concept for a high-volume premium HVAC company in Las Vegas — and a deliberate counterpoint to the Summit Climate concept. Same industry, same city, opposite brief: where Summit whispers to the luxury buyer, Silver State moves fast for the homeowner staring at a 108° forecast with a dead AC.",
      "A dark, kinetic interface — animated thermostat dial, drifting heat-and-cool glows, count-up stat band — makes the brand feel like the cavalry arriving. Warm amber means heat and urgency, cool cyan means relief and action, and every scroll ends in a booking path.",
    ],
    designGoals: [
      {
        title: "Dramatize the problem in one glance",
        body: "The hero's '108° out there. Perfect in here.' pairs an animated thermostat dial with outside/inside temperature chips — the entire value proposition rendered before a word of body copy is read.",
      },
      {
        title: "Engineer every section toward booking",
        body: "Same-day service links, financing, maintenance plans, and a chip-based booking widget mean a visitor is never more than one viewport away from starting an appointment.",
      },
      {
        title: "Split the palette by physics",
        body: "Amber is heat, urgency, and money; cyan is cool, relief, and action. The two-tone system keeps a fast, dense page feeling coherent instead of loud.",
      },
      {
        title: "Prove reliability with numbers in motion",
        body: "Count-up stats, a Google review badge, neighborhood-anchored testimonials, and a pinned service-area map make 'we show up fast, everywhere' feel measured rather than claimed.",
      },
    ],
    features: [
      "Animated comfort-dial hero with live temperature chips",
      "Count-up stat band (600+ reviews, 60-min response)",
      "Six-service grid with hover accent sweeps",
      "Dark financing section with animated qualification bar",
      "Three-tier Comfort Club maintenance plans",
      "Google-badged review cards anchored to neighborhoods",
      "Custom SVG service-area map with pinging HQ pin",
      "Chip-based booking widget with confirmation state",
    ],
    problem: {
      lead: "When the AC dies in a Vegas July, the job goes to the company that looks fastest and most alive — within seconds of the page loading.",
      body: [
        "Emergency-adjacent HVAC is won on momentum. Most competitors greet a sweating homeowner with a static stock photo and a contact form that feels like paperwork. Every extra second of doubt sends the visitor back to the search results.",
        "This concept converts urgency into motion. The animated dial mirrors exactly what the visitor is feeling, the stat band and reviews de-risk the call, and the booking widget turns 'I should deal with this' into a tapped-out appointment. Paired with the Summit concept, it also proves a point: one trade, two different companies, two completely different designs.",
      ],
    },
    palette: [
      { name: "Night", hex: "#0a0f14", onDark: true },
      { name: "Glacier Cyan", hex: "#21a7d6", onDark: true },
      { name: "Desert Amber", hex: "#eb9a36", onDark: true },
      { name: "Paper", hex: "#f5f8f9" },
    ],
    fonts: [
      { role: "Display", name: "Clash Display", sample: "108° out there. Perfect in here." },
      { role: "Body", name: "Satoshi", sample: "Same-day AC repair, premium installs, zero surprises." },
      { role: "Labels", name: "JetBrains Mono", sample: "LAS VEGAS · HENDERSON · SUMMERLIN" },
    ],
    before: [
      "Static stock photo of condenser units",
      "Contact form that feels like paperwork",
      "No proof of speed anywhere on the page",
      "Urgent visitor left to dig for the number",
      "Same beige template as every competitor",
    ],
    after: [
      "Animated dial mirrors the visitor's problem",
      "Booking widget books the visit in taps",
      "Count-up stats make speed measurable",
      "Emergency path visible in every viewport",
      "A brand with a pulse — impossible to confuse",
    ],
  },
  {
    slug: "rio-verde-plumbing",
    name: "Rio Verde Plumbing Co.",
    industry: "Plumbing",
    sector: "Trades",
    styleLabel: "Industrial · High-contrast · Built for urgency",
    tagline:
      "A 24/7 emergency plumber's site engineered around one action: calling the number. Dark, loud, and impossible to misread at 2am.",
    url: "/concepts/rio-verde-plumbing/index.html",
    accent: "#ff5c1a",
    overview: [
      "Rio Verde is a concept for a 24/7 emergency plumbing company in Las Vegas. When someone lands on a plumber's website, there's a decent chance water is actively running across their floor — so the entire design is built around urgency and trust, in that order.",
      "The visual language borrows from the job site itself: safety-orange against near-black, hazard-stripe dividers, condensed industrial type. It looks like a crew that shows up with the right truck — because for a homeowner in a panic, looking capable is half the sale.",
    ],
    designGoals: [
      {
        title: "Make the phone number unavoidable",
        body: "The number appears in the top bar, the sticky nav, the hero, the hours card, and the closing section — always tappable, always labeled 24/7. A visitor should never scroll to find it.",
      },
      {
        title: "Look like the crew, not the brochure",
        body: "Safety orange, hazard stripes, and heavy condensed type signal blue-collar competence. No stock handshakes, no gradient fluff — the aesthetic is the trust signal.",
      },
      {
        title: "Answer panic questions in seconds",
        body: "Do you answer now? (Live-dispatch pulse.) How fast? (2-hour windows.) Will I get ripped off? (Flat-rate promise, late = free.) Each objection gets a visual slot above the fold or one scroll below it.",
      },
      {
        title: "Zero decoration without function",
        body: "Every element earns its place: proof stats, guarantee band, review cards with neighborhoods, service-area list. Dark theme keeps the orange CTAs at maximum contrast.",
      },
    ],
    features: [
      "Sticky emergency call bar with 24/7 dispatch line",
      "Live-dispatch pulse indicator for 'we answer now' credibility",
      "Proof-stat band (response time, rating, arrival windows, licensing)",
      "Six-service grid with hover states and a 'most called' badge",
      "Guarantee band: upfront pricing, clean-boot policy, lifetime workmanship",
      "Review cards anchored to real neighborhoods",
      "Service-area grid covering the Las Vegas valley",
      "Click-to-call CTAs styled for one-thumb mobile use",
    ],
    problem: {
      lead: "Emergency plumbing is a race: the first company that looks trustworthy and answerable gets the job.",
      body: [
        "Most plumbing sites bury the phone number, open with a paragraph about being family-owned since 1987, and make a panicking homeowner hunt for proof that anyone will actually pick up. Every second of hunting is a second closer to the back button and the next Google result.",
        "This design treats the website like a dispatcher. It answers the three panic questions immediately, keeps a call button under the thumb at all times, and uses industrial styling to signal 'real crew, real trucks' — converting high-intent emergency traffic before a competitor can.",
      ],
    },
    palette: [
      { name: "Coal", hex: "#101214", onDark: true },
      { name: "Safety Orange", hex: "#ff5c1a", onDark: true },
      { name: "Bone", hex: "#f2efe9" },
      { name: "Smoke", hex: "#aab4bd" },
    ],
    fonts: [
      { role: "Display", name: "Anton", sample: "PIPES BURST. WE ANSWER." },
      { role: "Labels", name: "Barlow Condensed", sample: "24/7 EMERGENCY DISPATCH" },
      { role: "Body", name: "Barlow", sample: "Upfront flat-rate pricing, 2-hour arrival windows." },
    ],
    before: [
      "Phone number hidden in the footer",
      "Generic stock photos, dated clip-art logo",
      "Wall of text about company history first",
      "No proof anyone answers after hours",
      "Desktop-first layout, tiny tap targets",
    ],
    after: [
      "Call button in every viewport, always tappable",
      "Job-site visual language builds instant trust",
      "Panic questions answered above the fold",
      "Live-dispatch indicator + 24/7 promise up top",
      "Built one-thumb mobile-first",
    ],
  },
  {
    slug: "agave-and-stone",
    name: "Agave & Stone Landscape Design",
    industry: "Landscape Design",
    sector: "Trades",
    styleLabel: "Editorial · Organic luxury · Design-led",
    tagline:
      "A desert landscape studio positioned like a design firm, not a lawn crew — airy serif typography and earthy restraint that justify premium pricing.",
    url: "/concepts/agave-and-stone/index.html",
    accent: "#c26a45",
    overview: [
      "Agave & Stone is a concept for a high-end desert landscape design-build studio. The client it's built to attract isn't shopping on price — they're choosing a designer they trust with a six-figure backyard. So the site reads like a design journal, not a contractor directory listing.",
      "Warm cream, sage, and terracotta set an organic tone; a light editorial serif does the talking. Hand-drawn agave line art, an italic manifesto quote, and named garden projects position the studio as an author of spaces — which is exactly what lets it charge design fees instead of bidding against lawn crews.",
    ],
    designGoals: [
      {
        title: "Position as a studio, not a service",
        body: "Language ('compose', 'steward'), numbered disciplines, and named projects with years — the conventions of an architecture portfolio — reframe landscaping as design work worth a design budget.",
      },
      {
        title: "Let whitespace do the pricing",
        body: "Generous spacing, thin rules, and a restrained palette communicate expense without saying it. Dense, salesy layouts read cheap; this layout reads considered.",
      },
      {
        title: "Sell the desert, don't apologize for it",
        body: "The copy and palette embrace the Mojave — water-wise pride, native planting, terracotta heat — turning the region's constraint into the studio's signature.",
      },
      {
        title: "Qualify leads before they call",
        body: "A $250 consultation fee stated plainly, 'limited gardens per season' scarcity, and a short intake form filter out tire-kickers so every inquiry is worth a site walk.",
      },
    ],
    features: [
      "Editorial hero with hand-drawn agave SVG line art",
      "Drifting specialty ticker (xeriscape, shade structures, drip conversion)",
      "Numbered three-discipline studio list with hover motion",
      "Asymmetric project mosaic with named, dated gardens",
      "Full-width italic manifesto pull-quote",
      "Three-step process framed as a design engagement",
      "Consultation card with qualifying intake fields",
      "Muted-sage footer with studio credentials",
    ],
    problem: {
      lead: "Premium landscape studios lose high-end clients when their website looks like every $99/month lawn service.",
      body: [
        "In the trades, design-build landscaping has the widest gap between what the work costs and what the average website communicates. A studio charging $80k for an outdoor kitchen cannot afford a site with clip-art grass and a coupon banner — affluent clients bounce in seconds and call the firm whose site looks like their architect's.",
        "This concept closes that gap. Editorial typography and portfolio conventions signal taste, the stated consultation fee anchors expectations upward, and the qualification-first form means the studio spends its limited season on serious projects only.",
      ],
    },
    palette: [
      { name: "Cream", hex: "#f8f5ee" },
      { name: "Moss", hex: "#4a563d", onDark: true },
      { name: "Terracotta", hex: "#c26a45", onDark: true },
      { name: "Sand", hex: "#d9cfb8" },
    ],
    fonts: [
      { role: "Display", name: "Fraunces", sample: "The desert was never empty." },
      { role: "Body", name: "Karla", sample: "Water-wise gardens, courtyards, and outdoor rooms." },
      { role: "Labels", name: "Karla Caps", sample: "SELECTED GARDENS · 2025" },
    ],
    before: [
      "Reads like a lawn-mowing service",
      "Price-shopper leads haggling every bid",
      "Cluttered layout undercuts premium work",
      "Generic green palette, zero regional identity",
      "No filter between browsers and buyers",
    ],
    after: [
      "Reads like a design firm's portfolio",
      "Consultation fee anchors serious budgets",
      "Whitespace and serif type signal expense",
      "Desert palette becomes the studio's signature",
      "Intake form qualifies leads before the call",
    ],
  },
  {
    slug: "golden-hour-bakehouse",
    name: "Golden Hour Bakehouse",
    industry: "Bakery & Café",
    sector: "Hospitality",
    styleLabel: "Retro-warm · Playful · Personality-first",
    tagline:
      "A neighborhood bakery site with sunbeam energy — hand-drawn warmth, sticker badges, and scarcity baked into the copy to drive morning lines.",
    url: "/concepts/golden-hour-bakehouse/index.html",
    accent: "#d23c2e",
    overview: [
      "Golden Hour is a concept for a small-batch neighborhood bakery — the non-trades entry in this set, built to show range beyond service businesses. Where the plumbing concept sells urgency and the landscape concept sells taste, this one sells affection: the site's job is to make you want to be a regular.",
      "Butter yellow, cherry red, and espresso brown; a chunky retro serif with handwritten asides; scalloped dividers and a rotating sun mark. Every menu item is written like the bakers actually talk ('our starter Dolly is eight years old'), because in hospitality, personality is the product.",
    ],
    designGoals: [
      {
        title: "Bottle the smell of the place",
        body: "Warm bakery tones, rounded corners, offset 'sticker' shadows, and handwritten script asides recreate the feeling of the counter — so the site markets the experience, not just the menu.",
      },
      {
        title: "Turn scarcity into a habit",
        body: "'Sells out by 9', 'Saturdays only', 'gone by noon' — real small-bakery constraints become the marketing. Scarcity copy trains customers to come early and come often.",
      },
      {
        title: "Give every item a voice",
        body: "Menu cards read like the bakers wrote them, with prices and honest notes. Personality in microcopy is what separates a beloved neighborhood spot from a mall kiosk.",
      },
      {
        title: "Route regulars to order-ahead",
        body: "The highest-value customer is the weekly whole-loaf order. Order-ahead gets its own card, its own CTA, and a clear cutoff time — turning foot traffic into recurring revenue.",
      },
    ],
    features: [
      "Announcement bar with product-drop scarcity hook",
      "Animated sunbeam hero with rotating logo mark",
      "Rotating 'sells out' badge sticker",
      "Marquee strip of sourcing promises",
      "Menu card grid with prices, tags, and sticker-shadow hover",
      "Scalloped section dividers echoing pastry edges",
      "Founder story block with illustrated arch frame",
      "Hours, location, and order-ahead cards with sell-out honesty",
    ],
    problem: {
      lead: "Small bakeries sell out of product but stay invisible online — losing the pre-orders and regulars that smooth out revenue.",
      body: [
        "Most neighborhood bakeries run on an outdated Facebook page and a Google listing with wrong hours. Customers show up after the case is empty, get frustrated, and don't come back — while the bakery's actual superpower (things sell out because they're that good) goes unmarketed.",
        "This concept flips sell-outs into the brand. Scarcity is stated proudly, hours are unmissable, and the order-ahead path captures demand the display case can't hold. The personality-heavy design also gives the bakery a social-media-ready identity — the site, the case, and the Instagram all speak the same visual language.",
      ],
    },
    palette: [
      { name: "Milk", hex: "#fff6e8" },
      { name: "Butter", hex: "#ffd977" },
      { name: "Cherry", hex: "#d23c2e", onDark: true },
      { name: "Espresso", hex: "#3d2b1f", onDark: true },
    ],
    fonts: [
      { role: "Display", name: "Young Serif", sample: "Fresh bread makes the whole day better." },
      { role: "Script", name: "Caveat", sample: "baked at dawn, gone by noon" },
      { role: "Body", name: "Nunito Sans", sample: "Naturally leavened sourdough and laminated pastry." },
    ],
    before: [
      "Facebook page with wrong hours",
      "No menu or prices anywhere online",
      "Sell-outs frustrate instead of excite",
      "Zero visual identity beyond a logo",
      "Walk-in only — demand walks away",
    ],
    after: [
      "Hours and menu answered in one scroll",
      "Scarcity copy turns sell-outs into hype",
      "Sticker-and-sunbeam identity built for Instagram",
      "Order-ahead captures overflow demand",
      "Voice-driven copy makes regulars feel at home",
    ],
  },
  {
    slug: "caprock-roofing",
    name: "Caprock Roofing Co.",
    industry: "Roofing",
    sector: "Trades",
    styleLabel: "Precision · Technical · Engineering-grade",
    tagline:
      "A roofing company positioned as engineers, not door-knockers — spec sheets, layer diagrams, and blueprint-grid precision that disarm a low-trust industry.",
    url: "/concepts/caprock-roofing/index.html",
    accent: "#1450e0",
    overview: [
      "Caprock is a concept for a residential and commercial roofing company in Las Vegas. Roofing is one of the lowest-trust purchases a homeowner ever makes — storm-chasers, vague bids, and disappearing warranties have trained people to expect the worst. So this design's entire job is to look like the opposite of that.",
      "The visual language is borrowed from engineering documents: a blueprint grid, cobalt-on-white precision, monospaced spec labels, and an interactive seven-layer roof diagram. A sample spec report sits right in the hero — because the company that shows its paperwork first wins the trust war before price is even discussed.",
    ],
    designGoals: [
      {
        title: "Look like engineers, not salesmen",
        body: "Space Grotesk headlines, IBM Plex Mono labels, a drafting-grid hero background, and numbered sections (S.01, L.07) frame roofing as a technical discipline — the visual opposite of the door-knocker aesthetic.",
      },
      {
        title: "Lead with documentation",
        body: "A sample spec report is the hero image. Drone inspections, photo records, and written fixed-price specs are the differentiators, so they're the first thing a visitor sees — not a stock photo of shingles.",
      },
      {
        title: "Neutralize the storm-chaser stigma",
        body: "The copy addresses the elephant directly: 'honestly, not opportunistically', a review about telling a customer half the damage didn't need fixing. Naming the industry's bad behavior is the fastest way to signal you're not it.",
      },
      {
        title: "Make the free inspection irresistible",
        body: "The inspection offer is $0, obligation-free, and yields a deliverable (drone photo report) the homeowner keeps either way. The form asks one qualifying question and promises a callback within the hour.",
      },
    ],
    features: [
      "Blueprint-grid hero with sample spec report card",
      "Credential strip (Master Elite, license, roof count, drone inspections)",
      "Six-service grid with technical numbering and written-spec promise",
      "Interactive seven-layer roof system diagram with hover states",
      "Dark 'system' section explaining desert-heat engineering",
      "Warranty stat band (25-year, 2–3 day builds, $0 inspections)",
      "Four-step timeline process with milestone markers",
      "Post-monsoon review cards addressing storm-chaser distrust",
      "Free-inspection form with qualifying dropdown",
    ],
    problem: {
      lead: "Roofing is a five-figure purchase in an industry famous for door-knockers — trust, not price, decides who gets the job.",
      body: [
        "After every monsoon, Las Vegas homeowners are flooded with knocks, flyers, and wildly divergent bids with no explanation. Most roofing websites make it worse: no prices, no process, no proof — just a phone number and stock photos. The homeowner can't tell the 30-year company from the guy who arrived after the storm.",
        "This design sells verifiability. Spec documents, layer diagrams, photo documentation, and a warranty a manufacturer backs all say the same thing: everything we do is written down and checkable. For a low-trust industry, a site that looks like an engineering firm is a competitive weapon — it converts the skeptical majority the door-knockers scared off.",
      ],
    },
    palette: [
      { name: "Paper White", hex: "#fafbfc" },
      { name: "Cobalt", hex: "#1450e0", onDark: true },
      { name: "Slate", hex: "#16222e", onDark: true },
      { name: "Panel Grey", hex: "#f1f3f6" },
    ],
    fonts: [
      { role: "Display", name: "Space Grotesk", sample: "Your roof, engineered — not just installed." },
      { role: "Labels", name: "IBM Plex Mono", sample: "L.04 — HIGH-TEMP UNDERLAYMENT" },
      { role: "Body", name: "Inter", sample: "A written specification: materials, methods, timeline, fixed price." },
    ],
    before: [
      "Indistinguishable from storm-chaser flyers",
      "Bids with no scope, no spec, no proof",
      "Stock shingle photos, zero documentation",
      "Warranty claims nobody can verify",
      "Homeowner decides on price alone",
    ],
    after: [
      "Engineering aesthetic signals verifiability",
      "Sample spec report shown before contact",
      "Seven-layer system makes expertise visible",
      "Manufacturer-backed warranty front and center",
      "Free drone report reframes the sales call",
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
