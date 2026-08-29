/**
 * Concept portfolio projects.
 *
 * Every entry here is a CONCEPT: a fictional business designed to showcase
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
  /** e.g. "Trades" or "Hospitality": used as a secondary chip */
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
      "A luxury HVAC brand that sells comfort the way Apple sells hardware: calm, precise, and priced like it belongs in the homes it serves.",
    url: "/concepts/summit-climate/index.html",
    accent: "#175ee4",
    overview: [
      "A concept for a high-end Las Vegas HVAC company — the contractor you call when the house is architect-designed. Most HVAC sites shout urgency; this one projects calm, because at the top of the market composure is the sales pitch.",
      "White space, one alpine-blue accent, grotesk type and mono coordinates give it the register of a product launch rather than a service directory. Heat pumps are staged like flagship hardware, with spec grids and 19-decibel whisper claims.",
    ],
    designGoals: [
      {
        title: "Sell composure, not urgency",
        body: "The brand leads with consultations and engineering, not emergencies. Nobody spending $30k buys from a company that looks desperate.",
      },
      {
        title: "Present equipment like a flagship product",
        body: "A dark product-page treatment and a spec grid (22 SEER2, 19 dB). Specs signal engineering; engineering justifies price.",
      },
      {
        title: "Make the premium tier the default",
        body: "Summit Care membership and $0-down financing are designed like subscription cards, smoothing a five-figure decision into a monthly number.",
      },
      {
        title: "Let restraint do the pricing",
        body: "One accent color, generous whitespace, mono microlabels. Nothing shouts, so everything reads expensive.",
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
      lead: "The website is the first walkthrough. The company that looks like a premium product gets the premium install.",
      body: [
        "High-end homeowners shop on trust and taste, not price. But every HVAC site in the metro looks identical: CALL NOW banners, coupon pop-ups, clip-art snowflakes. A company doing $30,000 installs has no way to look like it.",
        "This concept gives that buyer something to recognize. Calm layout, product-grade equipment, packaged membership: it reads like the company your architect would pick, which moves the conversation from 'how much?' to 'when can you start?'",
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
      "The same trade as Summit Climate, a completely different voice. A bold, dark-mode HVAC brand built to convert the '108° and my AC just died' search at speed.",
    url: "/concepts/silver-state-hvac/index.html",
    accent: "#21a7d6",
    overview: [
      "A high-volume premium HVAC company, and a deliberate counterpoint to Summit Climate. Same trade, same city, opposite brief: where Summit whispers to the luxury buyer, Silver State moves fast for the homeowner staring at a 108° forecast with a dead AC.",
      "A dark, kinetic interface — animated thermostat dial, drifting glows, count-up stats — makes the brand feel like the cavalry arriving, and every scroll ends in a booking path.",
    ],
    designGoals: [
      {
        title: "Dramatize the problem in one glance",
        body: "'108° out there. Perfect in here.' — an animated dial and outside/inside chips carry the whole value proposition before a word of body copy.",
      },
      {
        title: "Engineer every section toward booking",
        body: "Same-day links, financing, maintenance plans and a chip-based booking widget keep a visitor one viewport from starting an appointment.",
      },
      {
        title: "Split the palette by physics",
        body: "Amber is heat and money; cyan is relief and action. Two tones keep a fast, dense page coherent instead of loud.",
      },
      {
        title: "Prove reliability with numbers in motion",
        body: "Count-up stats, a Google badge, neighborhood testimonials and a pinned service-area map make 'we show up fast' measured rather than claimed.",
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
      lead: "When the AC dies in a Vegas July, the job goes to whoever looks fastest within seconds of the page loading.",
      body: [
        "Emergency-adjacent HVAC is won on momentum. Most competitors greet a sweating homeowner with a stock photo and a form that feels like paperwork, and every second of doubt sends them back to the search results.",
        "This concept converts urgency into motion. The dial mirrors what the visitor feels, stats and reviews de-risk the call, and the widget turns 'I should deal with this' into a booked appointment. Paired with Summit: one trade, two completely different designs.",
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
      "A brand with a pulse: impossible to confuse",
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
      "A concept for a 24/7 emergency plumbing company. When someone lands on a plumber's site there's a good chance water is running across their floor, so the design is built around urgency and trust, in that order.",
      "The visual language comes off the job site: safety orange on near-black, hazard-stripe dividers, condensed industrial type. For a homeowner in a panic, looking capable is half the sale.",
    ],
    designGoals: [
      {
        title: "Make the phone number unavoidable",
        body: "The number sits in the top bar, sticky nav, hero, hours card and closing section — always tappable, always labeled 24/7.",
      },
      {
        title: "Look like the crew, not the brochure",
        body: "Safety orange, hazard stripes and condensed type signal blue-collar competence. No stock handshakes: the aesthetic is the trust signal.",
      },
      {
        title: "Answer panic questions in seconds",
        body: "Do you answer now? (Live-dispatch pulse.) How fast? (2-hour windows.) Will I get ripped off? (Flat rate, late = free.) Every objection answered above the fold.",
      },
      {
        title: "Zero decoration without function",
        body: "Every element earns its place: proof stats, guarantee band, neighborhood reviews, service-area list. The dark theme keeps orange CTAs at maximum contrast.",
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
      lead: "Emergency plumbing is a race. The first company that looks trustworthy and answerable gets the job.",
      body: [
        "Most plumbing sites bury the number, open with a paragraph about being family-owned since 1987, and make a panicking homeowner hunt for proof anyone will pick up. Every second of hunting is a second closer to the next Google result.",
        "This design treats the website like a dispatcher: it answers the three panic questions immediately, keeps a call button under the thumb, and signals real crew, real trucks — converting high-intent traffic before a competitor can.",
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
      "A desert landscape studio positioned like a design firm, not a lawn crew, with airy serif typography and earthy restraint that justify premium pricing.",
    url: "/concepts/agave-and-stone/index.html",
    accent: "#c26a45",
    overview: [
      "A concept for a high-end desert landscape design-build studio. The client isn't shopping on price; they're choosing a designer to trust with a six-figure backyard. So the site reads like a design journal.",
      "Cream, sage and terracotta, a light editorial serif, hand-drawn agave line art and named garden projects position the studio as an author of spaces — which is what lets it charge design fees instead of bidding against lawn crews.",
    ],
    designGoals: [
      {
        title: "Position as a studio, not a service",
        body: "Language ('compose', 'steward'), numbered disciplines and named, dated projects borrow architecture-portfolio conventions, reframing landscaping as work worth a design budget.",
      },
      {
        title: "Let whitespace do the pricing",
        body: "Generous spacing, thin rules and a restrained palette communicate expense without saying it. Salesy layouts read cheap; this one reads considered.",
      },
      {
        title: "Sell the desert, don't apologize for it",
        body: "Copy and palette embrace the Mojave — water-wise pride, native planting, terracotta heat — turning the region's constraint into the studio's signature.",
      },
      {
        title: "Qualify leads before they call",
        body: "A $250 consultation fee, limited gardens per season, and a short intake form filter out tire-kickers, so every inquiry is worth a site walk.",
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
        "No trade has a wider gap between what the work costs and what the website communicates. A studio charging $80k for an outdoor kitchen cannot afford clip-art grass and a coupon banner: affluent clients bounce and call the firm whose site looks like their architect's.",
        "This concept closes the gap. Editorial type and portfolio conventions signal taste, the stated fee anchors expectations upward, and the qualifying form keeps a limited season on serious projects only.",
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
      "A neighborhood bakery site with sunbeam energy: hand-drawn warmth, sticker badges, and scarcity baked into the copy to drive morning lines.",
    url: "/concepts/golden-hour-bakehouse/index.html",
    accent: "#d23c2e",
    overview: [
      "A small-batch neighborhood bakery, and the non-trades entry in this set. Where the plumbing concept sells urgency and the landscape concept sells taste, this one sells affection: it should make you want to be a regular.",
      "Butter yellow, cherry red, espresso brown; a chunky retro serif with handwritten asides. Every item is written like the bakers talk ('our starter Dolly is eight years old'), because in hospitality personality is the product.",
    ],
    designGoals: [
      {
        title: "Bottle the smell of the place",
        body: "Warm tones, rounded corners, offset sticker shadows and handwritten asides recreate the counter, so the site markets the experience rather than the menu.",
      },
      {
        title: "Turn scarcity into a habit",
        body: "'Sells out by 9', 'Saturdays only', 'gone by noon' — real constraints become the marketing, training customers to come early and come often.",
      },
      {
        title: "Give every item a voice",
        body: "Menu cards read like the bakers wrote them, prices and honest notes included. Microcopy separates a neighborhood favorite from a mall kiosk.",
      },
      {
        title: "Route regulars to order-ahead",
        body: "The weekly whole-loaf order is the highest-value customer, so order-ahead gets its own card, CTA and cutoff time.",
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
      lead: "Small bakeries sell out of product but stay invisible online, losing the pre-orders and regulars that smooth revenue.",
      body: [
        "Most neighborhood bakeries run on an outdated Facebook page and a Google listing with wrong hours. Customers arrive after the case is empty and don't come back, while the bakery's actual superpower — things sell out because they're that good — goes unmarketed.",
        "This concept flips sell-outs into the brand. Scarcity is stated proudly, hours are unmissable, and order-ahead captures demand the case can't hold. The identity is social-ready too: the site, the case and the Instagram all speak the same language.",
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
      "Walk-in only: demand walks away",
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
      "A roofing company positioned as engineers, not door-knockers, with spec sheets, layer diagrams, and blueprint-grid precision that disarm a low-trust industry.",
    url: "/concepts/caprock-roofing/index.html",
    accent: "#1450e0",
    overview: [
      "A concept for a residential and commercial roofing company. Roofing is one of the lowest-trust purchases a homeowner makes: storm-chasers, vague bids and disappearing warranties have trained people to expect the worst. This design's job is to look like the opposite.",
      "The visual language is borrowed from engineering documents: blueprint grid, cobalt-on-white precision, monospaced labels, a seven-layer roof diagram. A sample spec report sits in the hero, because whoever shows their paperwork first wins before price comes up.",
    ],
    designGoals: [
      {
        title: "Look like engineers, not salesmen",
        body: "Space Grotesk headlines, Plex Mono labels, a drafting grid and numbered sections (S.01, L.07) frame roofing as a technical discipline — the opposite of the door-knocker.",
      },
      {
        title: "Lead with documentation",
        body: "A sample spec report is the hero image. Drone inspections, photo records and fixed-price written specs are the differentiators, so they lead.",
      },
      {
        title: "Neutralize the storm-chaser stigma",
        body: "'Honestly, not opportunistically', and a review about telling a customer half the damage didn't need fixing. Naming the industry's bad behavior is the fastest way to signal you're not it.",
      },
      {
        title: "Make the free inspection irresistible",
        body: "The inspection is $0 and yields a drone photo report the homeowner keeps either way. One qualifying question, callback within the hour.",
      },
    ],
    features: [
      "Blueprint-grid hero with sample spec report card",
      "Credential strip (Master Elite, license, roof count, drone inspections)",
      "Six-service grid with technical numbering and written-spec promise",
      "Interactive seven-layer roof system diagram with hover states",
      "Dark 'system' section explaining desert-heat engineering",
      "Warranty stat band (25-year, 2-3 day builds, $0 inspections)",
      "Four-step timeline process with milestone markers",
      "Post-monsoon review cards addressing storm-chaser distrust",
      "Free-inspection form with qualifying dropdown",
    ],
    problem: {
      lead: "Roofing is a five-figure purchase in an industry famous for door-knockers: trust, not price, decides who gets the job.",
      body: [
        "After every monsoon, homeowners are flooded with knocks, flyers and wildly divergent bids. Most roofing websites make it worse — no prices, no process, no proof, just a number and stock photos. The homeowner can't tell the 30-year company from the guy who arrived after the storm.",
        "This design sells verifiability. Spec documents, layer diagrams, photo records and a manufacturer-backed warranty all say the same thing: everything we do is written down and checkable. In a low-trust industry that converts the skeptical majority the door-knockers scared off.",
      ],
    },
    palette: [
      { name: "Paper White", hex: "#fafbfc" },
      { name: "Cobalt", hex: "#1450e0", onDark: true },
      { name: "Slate", hex: "#16222e", onDark: true },
      { name: "Panel Grey", hex: "#f1f3f6" },
    ],
    fonts: [
      { role: "Display", name: "Space Grotesk", sample: "Your roof, engineered: not just installed." },
      { role: "Labels", name: "IBM Plex Mono", sample: "L.04: HIGH-TEMP UNDERLAYMENT" },
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
  {
    slug: "cherry-pit",
    name: "Cherry Pit Nail Studio",
    industry: "Nail studio",
    sector: "Beauty",
    styleLabel: "Editorial minimal \u00b7 Weight-led type \u00b7 Colour only in the work",
    tagline:
      "A one-room nail studio that prices its work in public. Every surface on the site is a pale neutral, so the only saturated colour anywhere is polish, in a photograph, on somebody's hands.",
    url: "/concepts/cherry-pit/index.html",
    accent: "#d4283c",
    overview: [
      "A concept for a nail studio on South Main in Las Vegas \u2014 the kind of room that takes four clients a day and paints all ten nails by hand. The category's websites are a wall of pink gradients, orchid stock photography and the word 'luxury', and almost none of them show you what the artist actually makes.",
      "So this one inverts the whole thing. A warm bone ground, a single variable grotesk carrying every level of hierarchy through weight alone, and photographs at roughly a third of the page. The only saturated colour on the entire site is the polish in the pictures, which means a good set is the only thing on the page that can catch your eye.",
    ],
    designGoals: [
      {
        title: "Let the work be the only colour",
        body: "Every ground, rule and letterform is a pale neutral. Nothing competes with the photographs, so the sets read as the product instead of as decoration around a booking button.",
      },
      {
        title: "Put the price in public, including the hidden parts",
        body: "Removal, repairs and the length surcharge are the three line items that turn a $70 quote into a $130 bill elsewhere. They are on the menu with everything else, which is the whole trust argument.",
      },
      {
        title: "Give the searched-for things real pages",
        body: "Prices and location are what people search by name, so they get their own URLs, titles and descriptions rather than being anchors that scroll the homepage.",
      },
      {
        title: "Sell the hours, not the word luxury",
        body: "The owner explains that she does four sets a day where her mother did fourteen, and that the difference is time to paint. That arithmetic justifies the price better than any adjective.",
      },
    ],
    features: [
      "Painted intro: a polish brush lays a streak across the screen, then the colour opens out of it to reveal the page",
      "Four real pages \u2014 home, work, prices, visit \u2014 each with its own title and shareable URL",
      "Portfolio grid captioned with what each set cost and what it had to survive",
      "Price list carrying removal, repairs and length surcharges rather than hiding them",
      "Owner's story told first-person, in her voice, not in brochure register",
      "Standing Book button and phone number in the header of every page",
      "One variable typeface at three weights; no second family anywhere",
      "Intro plays once per session and is skipped entirely for reduced-motion",
    ],
    problem: {
      lead: "A nail artist's work is already visual and already online. The website is the one place that could explain why a set costs $95, and it is the one place nobody uses to do it.",
      body: [
        "Instagram sells the picture; the website has to sell the price. Most studio sites answer that question with a gradient and a booking form, which reads as the same $45 set every strip-mall shop offers. The craft, the fitting, the two hours of prep \u2014 none of it survives to the page.",
        "This concept makes the argument instead. Prices sit on their own page with the usually-hidden costs included, the appointment is broken down into where the two hours actually go, and the owner states the arithmetic behind her rate in plain language. The photographs then carry the only colour on the site, so the work is what you remember.",
      ],
    },
    palette: [
      { name: "Bone", hex: "#f7f4ef" },
      { name: "Cherry", hex: "#d4283c", onDark: true },
      { name: "Ink", hex: "#1a1613", onDark: true },
      { name: "Line", hex: "#e7e0d6" },
    ],
    fonts: [
      { role: "Display", name: "Familjen Grotesk 700", sample: "Ten small paintings, every three weeks." },
      { role: "Body", name: "Familjen Grotesk 400", sample: "Custom nail art in one room on South Main." },
      { role: "Numerals", name: "Familjen Grotesk 600", sample: "$60 \u00b7 $78 \u00b7 $95 \u00b7 2 HR 10" },
    ],
    before: [
      "Pink-to-cream gradients and orchid stock photography",
      "The word 'luxury' somewhere above the fold",
      "Pricing withheld behind 'contact for a quote'",
      "Removal and repair costs discovered at the till",
      "A nav where every link only scrolls the same page",
    ],
    after: [
      "One warm neutral ground; colour only in the work",
      "Every price stated, including removal and repairs",
      "Prices and location on their own shareable URLs",
      "The owner's case for her rate, in her own words",
      "A brush-stroke intro that opens into the site",
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
