import { z } from "zod";

export const sequenceStepSchema = z.object({
  step: z.number().int().min(1).max(8),
  dayOffset: z.number().int().min(0).max(60),
  intent: z.enum(["initial", "bump", "new_observation", "close_loop"]),
});
export type SequenceStep = z.infer<typeof sequenceStepSchema>;

export const sequenceSchema = z
  .array(sequenceStepSchema)
  .min(1)
  .max(8)
  .refine((steps) => steps.every((s, i) => s.step === i + 1), "steps must be numbered 1..n")
  .refine((steps) => steps.every((s, i) => i === 0 || s.dayOffset > steps[i - 1].dayOffset), "day offsets must increase")
  .refine((steps) => steps[0].intent === "initial" && steps[0].dayOffset === 0, "step 1 must be the initial email on day 0");

export const DEFAULT_SEQUENCE: SequenceStep[] = [
  { step: 1, dayOffset: 0, intent: "initial" },
  { step: 2, dayOffset: 3, intent: "bump" },
  { step: 3, dayOffset: 7, intent: "new_observation" },
  { step: 4, dayOffset: 12, intent: "close_loop" },
];

export function parseSequence(json: string): SequenceStep[] {
  const parsed = sequenceSchema.safeParse(JSON.parse(json));
  return parsed.success ? parsed.data : DEFAULT_SEQUENCE;
}
