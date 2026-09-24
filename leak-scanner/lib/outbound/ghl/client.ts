import { z } from "zod";
import { fetchJson } from "../core/http";

/**
 * The ONLY place that talks to the GoHighLevel API. Private Integration token
 * (Settings → Private Integrations in the sub-account) with scopes:
 * contacts.write, contacts.readonly, opportunities.write, opportunities.readonly.
 *
 * Env: GHL_API_TOKEN, GHL_LOCATION_ID (required). The pipeline and stages are
 * found BY NAME through the API (GHL's UI never shows their ids):
 * GHL_PIPELINE_NAME (default "Greenstar Outbound"), GHL_STAGE_INTERESTED_NAME
 * ("Interested"), GHL_STAGE_BOOKED_NAME ("Call Booked"). Explicit
 * GHL_PIPELINE_ID / GHL_STAGE_*_ID override the lookup. Optional GHL_API_VERSION.
 */
const BASE = "https://services.leadconnectorhq.com";

export interface GhlConfig {
  token: string;
  locationId: string;
  pipelineId: string | null;
  stageInterestedId: string | null;
  stageBookedId: string | null;
  pipelineName: string;
  stageInterestedName: string;
  stageBookedName: string;
  version: string;
}

export function ghlConfig(): GhlConfig | null {
  const token = process.env.GHL_API_TOKEN?.trim();
  const locationId = process.env.GHL_LOCATION_ID?.trim();
  if (!token || !locationId) return null;
  return {
    token,
    locationId,
    pipelineId: process.env.GHL_PIPELINE_ID?.trim() || null,
    stageInterestedId: process.env.GHL_STAGE_INTERESTED_ID?.trim() || null,
    stageBookedId: process.env.GHL_STAGE_BOOKED_ID?.trim() || null,
    pipelineName: process.env.GHL_PIPELINE_NAME?.trim() || "Greenstar Outbound",
    stageInterestedName: process.env.GHL_STAGE_INTERESTED_NAME?.trim() || "Interested",
    stageBookedName: process.env.GHL_STAGE_BOOKED_NAME?.trim() || "Call Booked",
    version: process.env.GHL_API_VERSION?.trim() || "2021-07-28",
  };
}

const upsertResponse = z.object({ contact: z.object({ id: z.string() }).passthrough() }).passthrough();
const opportunityResponse = z.object({ opportunity: z.object({ id: z.string() }).passthrough() }).passthrough();
const pipelinesResponse = z
  .object({
    pipelines: z.array(
      z.object({ id: z.string(), name: z.string(), stages: z.array(z.object({ id: z.string(), name: z.string() }).passthrough()).default([]) }).passthrough()
    ),
  })
  .passthrough();
export type GhlPipeline = z.infer<typeof pipelinesResponse>["pipelines"][number];

export interface ResolvedPipeline {
  pipelineId: string;
  stageInterestedId: string;
  stageBookedId: string | null;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Pure: pick pipeline + stages by id override or by (case-insensitive) name. */
export function pickPipeline(pipelines: GhlPipeline[], config: GhlConfig): ResolvedPipeline {
  const pipeline =
    pipelines.find((p) => p.id === config.pipelineId) ?? pipelines.find((p) => norm(p.name) === norm(config.pipelineName));
  if (!pipeline) {
    throw new Error(`GHL pipeline "${config.pipelineName}" not found (have: ${pipelines.map((p) => p.name).join(", ") || "none"})`);
  }
  const stage = (id: string | null, name: string) =>
    pipeline.stages.find((s) => s.id === id) ?? pipeline.stages.find((s) => norm(s.name) === norm(name)) ?? null;
  const interested = stage(config.stageInterestedId, config.stageInterestedName) ?? pipeline.stages[0];
  if (!interested) throw new Error(`GHL pipeline "${pipeline.name}" has no stages`);
  return {
    pipelineId: pipeline.id,
    stageInterestedId: interested.id,
    stageBookedId: stage(config.stageBookedId, config.stageBookedName)?.id ?? null,
  };
}

export class GhlClient {
  constructor(
    private readonly config: GhlConfig,
    private readonly fetchImpl?: typeof fetch
  ) {}

  private request(path: string, method: "GET" | "POST" | "PUT", body?: unknown) {
    return fetchJson(`${BASE}${path}`, {
      method,
      body,
      fetchImpl: this.fetchImpl,
      headers: { Authorization: `Bearer ${this.config.token}`, Version: this.config.version },
    });
  }

  async upsertContact(input: {
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    companyName: string;
    website: string | null;
    city: string | null;
    state: string | null;
    tags: string[];
    source: string;
  }): Promise<string> {
    const raw = await this.request("/contacts/upsert", "POST", {
      locationId: this.config.locationId,
      email: input.email ?? undefined,
      phone: input.phone ?? undefined,
      firstName: input.firstName ?? undefined,
      lastName: input.lastName ?? undefined,
      companyName: input.companyName,
      website: input.website ?? undefined,
      city: input.city ?? undefined,
      state: input.state ?? undefined,
      tags: input.tags,
      source: input.source,
    });
    return upsertResponse.parse(raw).contact.id;
  }

  async addTags(contactId: string, tags: string[]): Promise<void> {
    await this.request(`/contacts/${encodeURIComponent(contactId)}/tags`, "POST", { tags });
  }

  async addNote(contactId: string, body: string): Promise<void> {
    await this.request(`/contacts/${encodeURIComponent(contactId)}/notes`, "POST", { body: body.slice(0, 5000) });
  }

  async listPipelines(): Promise<GhlPipeline[]> {
    const raw = await this.request(`/opportunities/pipelines?locationId=${encodeURIComponent(this.config.locationId)}`, "GET");
    return pipelinesResponse.parse(raw).pipelines;
  }

  private resolved: ResolvedPipeline | null = null;
  async resolvePipeline(): Promise<ResolvedPipeline> {
    this.resolved ??= pickPipeline(await this.listPipelines(), this.config);
    return this.resolved;
  }

  async createOpportunity(input: { contactId: string; name: string; stageId?: string; monetaryValue?: number }): Promise<string> {
    const resolved = await this.resolvePipeline();
    const raw = await this.request("/opportunities/", "POST", {
      locationId: this.config.locationId,
      pipelineId: resolved.pipelineId,
      pipelineStageId: input.stageId ?? resolved.stageInterestedId,
      contactId: input.contactId,
      name: input.name,
      status: "open",
      ...(input.monetaryValue ? { monetaryValue: input.monetaryValue } : {}),
    });
    return opportunityResponse.parse(raw).opportunity.id;
  }

  async moveOpportunityStage(opportunityId: string, stageId: string): Promise<void> {
    const resolved = await this.resolvePipeline();
    await this.request(`/opportunities/${encodeURIComponent(opportunityId)}`, "PUT", {
      pipelineId: resolved.pipelineId,
      pipelineStageId: stageId,
    });
  }
}
