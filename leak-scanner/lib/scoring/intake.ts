import { z } from "zod";

/**
 * Deep-audit intake: six multiple-choice questions asked when a lead upgrades
 * their quick scan to the comprehensive audit.
 *
 * Rules:
 * - Answers NEVER change the deterministic score (self-reported ≠ observed).
 * - Every answer produces a visible, labeled "based on what you told us"
 *   insight in the report — each question earns its place.
 * - No invented statistics or revenue claims. The customer-value framing uses
 *   the lead's own stated number and says so.
 */

export const intakeSchema = z.object({
  mainGoal: z.enum(["more_calls", "more_bookings", "bigger_jobs", "more_reviews", "expand_area"]),
  discovery: z.enum(["word_of_mouth", "google_search", "social_media", "repeat_referral", "paid_ads"]),
  missedCalls: z.enum(["voicemail", "call_back_later", "text_back_auto", "not_sure"]),
  responseSpeed: z.enum(["within_hour", "same_day", "next_day", "varies"]),
  reviewHabit: z.enum(["system", "sometimes", "never"]),
  customerValue: z.enum(["under_100", "v100_500", "v500_2000", "over_2000", "not_sure"]),
});

export type IntakeAnswers = z.infer<typeof intakeSchema>;

interface IntakeOption {
  value: string;
  label: string;
}

export interface IntakeQuestion {
  id: keyof IntakeAnswers;
  question: string;
  options: IntakeOption[];
}

export const INTAKE_QUESTIONS: IntakeQuestion[] = [
  {
    id: "mainGoal",
    question: "What's your #1 goal right now?",
    options: [
      { value: "more_calls", label: "More phone calls" },
      { value: "more_bookings", label: "More bookings / appointments" },
      { value: "bigger_jobs", label: "Bigger, better-quality jobs" },
      { value: "more_reviews", label: "More reviews & reputation" },
      { value: "expand_area", label: "Expanding to new areas" },
    ],
  },
  {
    id: "discovery",
    question: "How do most new customers find you today?",
    options: [
      { value: "word_of_mouth", label: "Word of mouth" },
      { value: "google_search", label: "Google / online search" },
      { value: "social_media", label: "Social media" },
      { value: "repeat_referral", label: "Repeat customers & referrals" },
      { value: "paid_ads", label: "Paid ads" },
    ],
  },
  {
    id: "missedCalls",
    question: "When a call comes in and you can't answer, what happens?",
    options: [
      { value: "voicemail", label: "It goes to voicemail" },
      { value: "call_back_later", label: "I call back when I'm free" },
      { value: "text_back_auto", label: "They get an automatic text back" },
      { value: "not_sure", label: "Honestly, not sure" },
    ],
  },
  {
    id: "responseSpeed",
    question: "How fast do you usually respond to a new inquiry?",
    options: [
      { value: "within_hour", label: "Within an hour" },
      { value: "same_day", label: "Same day" },
      { value: "next_day", label: "Next day or later" },
      { value: "varies", label: "It varies a lot" },
    ],
  },
  {
    id: "reviewHabit",
    question: "Do you actively ask customers for reviews?",
    options: [
      { value: "system", label: "Yes — we have a system for it" },
      { value: "sometimes", label: "Sometimes, when we remember" },
      { value: "never", label: "Not really" },
    ],
  },
  {
    id: "customerValue",
    question: "Roughly what is one new customer worth to you?",
    options: [
      { value: "under_100", label: "Under $100" },
      { value: "v100_500", label: "$100 – $500" },
      { value: "v500_2000", label: "$500 – $2,000" },
      { value: "over_2000", label: "Over $2,000" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
];

export const INTAKE_OPTION_LABELS: Record<string, string> = Object.fromEntries(
  INTAKE_QUESTIONS.flatMap((q) => q.options.map((o) => [`${q.id}.${o.value}`, o.label]))
);

export function intakeAnswerLabel(questionId: keyof IntakeAnswers, value: string): string {
  return INTAKE_OPTION_LABELS[`${questionId}.${value}`] ?? value;
}

export interface IntakeInsight {
  title: string;
  youToldUs: string;
  insight: string;
  recommendation: string;
}

/**
 * Deterministic answer → insight copy. Grounded in the lead's own words,
 * general business principles only — no fabricated numbers.
 */
export function buildIntakeInsights(answers: IntakeAnswers): IntakeInsight[] {
  const insights: IntakeInsight[] = [];

  // 1. Main goal — frames the whole engagement.
  const goalCopy: Record<IntakeAnswers["mainGoal"], [string, string]> = {
    more_calls: [
      "Everything in your roadmap should be judged by one test: does it make the phone ring? The highest-leverage fixes are the ones that remove friction between an interested visitor and a dial.",
      "Prioritize the conversion and follow-up fixes in this report first — they act directly on call volume.",
    ],
    more_bookings: [
      "Bookings grow when taking action is easier than hesitating. Every extra step between interest and a confirmed slot quietly filters out customers.",
      "Prioritize a frictionless booking path and fast follow-up — those two compound.",
    ],
    bigger_jobs: [
      "Bigger jobs are won on trust, not volume. Higher-ticket customers do more homework, compare more options, and need more proof before they reach out.",
      "Prioritize the trust and proof fixes in this report — reviews, credentials, and work examples are what close bigger buyers.",
    ],
    more_reviews: [
      "Reviews don't accumulate on their own — they follow a repeatable ask. The businesses with hundreds of reviews aren't luckier; they have a system.",
      "Stand up a simple review-request routine and give those reviews a public home you control.",
    ],
    expand_area: [
      "Expanding your area means being findable in places where nobody knows you yet — which makes your online presence do the introducing that word of mouth used to do.",
      "Prioritize local visibility fixes, then dedicated area/service content for each territory you want to win.",
    ],
  };
  const [goalInsight, goalRec] = goalCopy[answers.mainGoal];
  insights.push({
    title: "Your goal",
    youToldUs: intakeAnswerLabel("mainGoal", answers.mainGoal),
    insight: goalInsight,
    recommendation: goalRec,
  });

  // 2. Discovery channel — concentration risk / channel leverage.
  const discoveryCopy: Record<IntakeAnswers["discovery"], [string, string]> = {
    word_of_mouth: [
      "Word of mouth means your work is good — but it's a channel you can't scale, target, or turn up when things go quiet. Growth that depends on it alone is growth you don't control.",
      "Keep the referrals, add a channel you control: a findable online presence turns every recommendation into a checkable, contactable next step.",
    ],
    google_search: [
      "Search is already working for you — which means every leak in this report is leaking real, active demand you've already earned. Fixing them multiplies a channel that's proven.",
      "Double down: fix the conversion leaks first so more of the search traffic you already get becomes customers.",
    ],
    social_media: [
      "Social builds attention, but attention rents — the platform owns the audience and the algorithm decides your reach. Interest sparked there needs somewhere you own to land.",
      "Give your social traffic a destination that converts: clear offer, proof, and one obvious next step.",
    ],
    repeat_referral: [
      "Repeat and referral business is the strongest possible proof of quality — and the strongest case that new-customer acquisition, not retention, is your growth bottleneck.",
      "Your reputation is an asset; put it online where strangers can see it, and new-customer flow follows.",
    ],
    paid_ads: [
      "If you're paying for clicks, every leak in this report has a literal price tag — ad traffic that arrives and leaves without acting is budget spent on a competitor's future customer.",
      "Fix the conversion path before spending another dollar on traffic; the same ad spend will simply produce more.",
    ],
  };
  const [discInsight, discRec] = discoveryCopy[answers.discovery];
  insights.push({
    title: "How customers find you",
    youToldUs: intakeAnswerLabel("discovery", answers.discovery),
    insight: discInsight,
    recommendation: discRec,
  });

  // 3. Missed calls — the classic invisible leak (self-reported, so we can say it).
  const missedCopy: Record<IntakeAnswers["missedCalls"], [string, string]> = {
    voicemail: [
      "By your own account, a missed call becomes a voicemail — and many callers won't leave one; they simply dial the next result. Those lost calls never show up in any report, which is what makes this leak expensive: it's invisible.",
      "Add missed-call text-back so every caller gets an instant reply — it's one of the fastest-payback fixes that exists for local businesses.",
    ],
    call_back_later: [
      "Calling back when you're free beats voicemail — but in the gap between their call and yours, the customer is often still calling down the list. Whoever responds first usually wins the job.",
      "An instant automatic text (\"Got your call — with a customer, will call you right back\") holds your place in line until you're free.",
    ],
    text_back_auto: [
      "You already have missed-call recovery — that puts you ahead of most local businesses on the single most common invisible leak. Well done.",
      "Make sure the same instant-response standard covers your web forms and booking requests too.",
    ],
    not_sure: [
      "Not knowing what happens to missed calls usually means nobody's watching that door — and it's the door a lot of revenue walks out of. What gets measured gets caught.",
      "First step: find out. Then add missed-call text-back so the answer becomes 'they get an instant reply' — automatically.",
    ],
  };
  const [missInsight, missRec] = missedCopy[answers.missedCalls];
  insights.push({
    title: "Missed calls",
    youToldUs: intakeAnswerLabel("missedCalls", answers.missedCalls),
    insight: missInsight,
    recommendation: missRec,
  });

  // 4. Response speed.
  const speedCopy: Record<IntakeAnswers["responseSpeed"], [string, string]> = {
    within_hour: [
      "Responding within the hour puts you in the top tier — speed-to-lead is one of the strongest predictors of who wins the job, and you're already competing on it.",
      "Protect this advantage as you grow: automation keeps your response time fast even on your busiest days.",
    ],
    same_day: [
      "Same-day is respectable — but a customer who inquired at 9am and hears back at 4pm has had all day to find someone faster. The first responder frames the whole conversation.",
      "Close the gap with an instant automatic acknowledgment, then your personal reply when you're free.",
    ],
    next_day: [
      "By the next day, many inquiries have already chosen someone — not because you'd have lost on quality, but because you never got to compete. Speed is the tiebreaker you're currently conceding.",
      "An instant auto-reply plus a same-day callback habit recovers most of what next-day response gives away.",
    ],
    varies: [
      "Inconsistent response time means your results will feel random — some weeks great, some quiet — because who you win is being decided by when they happened to call.",
      "Standardize it: instant automatic acknowledgment for everyone, so your best response time becomes your only response time.",
    ],
  };
  const [speedInsight, speedRec] = speedCopy[answers.responseSpeed];
  insights.push({
    title: "Response speed",
    youToldUs: intakeAnswerLabel("responseSpeed", answers.responseSpeed),
    insight: speedInsight,
    recommendation: speedRec,
  });

  // 5. Review habit.
  const reviewCopy: Record<IntakeAnswers["reviewHabit"], [string, string]> = {
    system: [
      "Having a review system puts you in rare company — most local businesses collect reviews by accident. Your job now is making sure that proof is visible everywhere buyers look.",
      "Feature your best reviews prominently on your site and keep the system running — reputation compounds.",
    ],
    sometimes: [
      "\"When we remember\" is how good businesses end up with a review count that undersells them. Every happy customer who wasn't asked is proof that evaporated.",
      "Make the ask automatic — a simple post-job message turns satisfaction you already earned into public proof.",
    ],
    never: [
      "You're sitting on unclaimed reputation: every satisfied customer is a five-star review that was never captured. Meanwhile, buyers comparing you to competitors are counting stars.",
      "Start simple: ask your last ten happy customers this week, then automate the ask for every job going forward.",
    ],
  };
  const [revInsight, revRec] = reviewCopy[answers.reviewHabit];
  insights.push({
    title: "Reviews",
    youToldUs: intakeAnswerLabel("reviewHabit", answers.reviewHabit),
    insight: revInsight,
    recommendation: revRec,
  });

  // 6. Customer value — stakes framing using THEIR number, clearly labeled.
  const valueCopy: Record<IntakeAnswers["customerValue"], [string, string]> = {
    under_100: [
      "At under $100 per customer, volume is everything — which makes low-friction capture (easy contact, instant response) matter more than anything else in this report.",
      "Optimize for volume: the fewer steps between interest and action, the better your economics.",
    ],
    v100_500: [
      "By your own numbers, each missed inquiry is a $100–$500 decision. Even one recovered lead a week pays for most of the fixes in this report many times over within a year.",
      "Treat lead capture and response speed as investments with a measurable payback, because at your ticket size, they are.",
    ],
    v500_2000: [
      "By your own numbers, every lost lead costs $500–$2,000. At that ticket size, a single leak recovering one customer a month is worth thousands a year — this report stops being cosmetic and starts being financial.",
      "Prioritize ruthlessly by payback: follow-up and conversion fixes first, because each recovered lead is real money.",
    ],
    over_2000: [
      "At $2,000+ per customer, you're in territory where one recovered lead can pay for an entire growth system. High-ticket buyers also do the most research — trust and proof do the heavy lifting.",
      "Invest in the trust layer (reviews, credentials, proof) and airtight follow-up — at your ticket size, both are profit centers.",
    ],
    not_sure: [
      "Knowing your customer value is the key that unlocks every other growth decision — it tells you what a lead is worth, what a leak costs, and what a fix should pay.",
      "Rough math is enough: average job value × jobs per customer. Even an estimate turns this report into a payback calculation.",
    ],
  };
  const [valInsight, valRec] = valueCopy[answers.customerValue];
  insights.push({
    title: "What a customer is worth",
    youToldUs: intakeAnswerLabel("customerValue", answers.customerValue),
    insight: valInsight,
    recommendation: valRec,
  });

  return insights;
}
