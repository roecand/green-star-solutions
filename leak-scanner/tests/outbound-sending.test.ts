import { describe, expect, it } from "vitest";
import { fetchJson, HttpError, retryDelayMs } from "@/lib/outbound/core/http";
import { isWithinSendWindow, localParts, nextStepDueAt, nextWindowOpen } from "@/lib/outbound/sending/window";

const LA = { timezone: "America/Los_Angeles", startHour: 8, endHour: 16, days: [1, 2, 3, 4, 5] };

describe("send window", () => {
  it("respects local hours and weekdays", () => {
    // Tue 2026-09-22 10:00 PDT = 17:00Z
    expect(localParts(new Date("2026-09-22T17:00:00Z"), LA.timezone)).toMatchObject({ weekday: 2, hour: 10 });
    expect(isWithinSendWindow(new Date("2026-09-22T17:00:00Z"), LA)).toBe(true);
    expect(isWithinSendWindow(new Date("2026-09-22T23:30:00Z"), LA)).toBe(false); // 16:30 PDT
    expect(isWithinSendWindow(new Date("2026-09-26T17:00:00Z"), LA)).toBe(false); // Saturday
  });

  it("finds the next opening across a weekend", () => {
    const fridayEvening = new Date("2026-09-26T01:00:00Z"); // Fri 18:00 PDT
    const open = nextWindowOpen(fridayEvening, LA)!;
    expect(localParts(open, LA.timezone)).toMatchObject({ weekday: 1, hour: 8 });
    expect(nextWindowOpen(fridayEvening, { ...LA, days: [] })).toBeNull();
  });

  it("schedules follow-ups by day offset and ends the sequence", () => {
    const seq = [
      { step: 1, dayOffset: 0 },
      { step: 2, dayOffset: 3 },
      { step: 3, dayOffset: 7 },
    ];
    const sent = new Date("2026-09-22T17:00:00Z");
    expect(nextStepDueAt(seq, 1, sent)?.toISOString()).toBe("2026-09-25T17:00:00.000Z");
    expect(nextStepDueAt(seq, 2, sent)?.toISOString()).toBe("2026-09-26T17:00:00.000Z");
    expect(nextStepDueAt(seq, 3, sent)).toBeNull();
  });
});

describe("fetchJson", () => {
  const noSleep = async () => {};
  it("retries 429 with bounded attempts, honoring Retry-After", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      return calls < 3 ? new Response("slow down", { status: 429, headers: { "retry-after": "1" } }) : new Response('{"ok":true}', { status: 200 });
    }) as typeof fetch;
    expect(await fetchJson("https://api.example.com/x", { fetchImpl, sleep: noSleep })).toEqual({ ok: true });
    expect(calls).toBe(3);
    expect(retryDelayMs(0, "2")).toBe(2000);
    expect(retryDelayMs(10, null)).toBe(8000);
  });

  it("gives up after maxRetries and does not retry 4xx", async () => {
    let calls = 0;
    const always500 = (async () => {
      calls++;
      return new Response("boom", { status: 500 });
    }) as typeof fetch;
    await expect(fetchJson("https://api.example.com/x", { fetchImpl: always500, sleep: noSleep, maxRetries: 2 })).rejects.toBeInstanceOf(HttpError);
    expect(calls).toBe(3);
    calls = 0;
    const bad = (async () => {
      calls++;
      return new Response("nope", { status: 422 });
    }) as typeof fetch;
    await expect(fetchJson("https://api.example.com/x", { fetchImpl: bad, sleep: noSleep })).rejects.toMatchObject({ status: 422 });
    expect(calls).toBe(1);
  });
});

describe("GHL pipeline lookup", () => {
  it("finds pipeline and stages by name, case-insensitively, with id overrides", async () => {
    const { pickPipeline } = await import("@/lib/outbound/ghl/client");
    const base = { token: "t", locationId: "l", pipelineId: null, stageInterestedId: null, stageBookedId: null, pipelineName: "Greenstar Outbound", stageInterestedName: "Interested", stageBookedName: "Call Booked", version: "v" };
    const pipelines = [
      { id: "p0", name: "Client Funnel", stages: [{ id: "s0", name: "New Lead" }] },
      { id: "p1", name: "greenstar  outbound", stages: [{ id: "a", name: "Interested" }, { id: "b", name: "call booked" }] },
    ];
    expect(pickPipeline(pipelines, base)).toEqual({ pipelineId: "p1", stageInterestedId: "a", stageBookedId: "b" });
    expect(pickPipeline(pipelines, { ...base, pipelineId: "p0" })).toEqual({ pipelineId: "p0", stageInterestedId: "s0", stageBookedId: null });
    expect(() => pickPipeline(pipelines, { ...base, pipelineName: "Nope" })).toThrow(/not found/);
  });
});
