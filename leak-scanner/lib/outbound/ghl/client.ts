import { z } from "zod";
import { fetchJson } from "../core/http";

/**
 * The ONLY place that talks to the GoHighLevel API. Private Integration token
 * (Settings → Private Integrations in the sub-account) with scopes:
 * contacts.write, contacts.readonly, opportunities.write, opportunities.readonly.
 *
 * Env: GHL_API_TOKEN, GHL_LOCATION_ID, GHL_PIPELINE_ID,
 *      GHL_STAGE_INTERESTED_ID, optional GHL_STAGE_BOOKED_ID, GHL_API_VERSION.
 */
const BASE = "https://services.leadconnectorhq.com";

export interface GhlConfig {
  token: string;
  locationId: string;
  pipelineId: string | null;
  stageInterestedId: string | null;
  stageBookedId: string | null;
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
    version: process.env.GHL_API_VERSION?.trim() || "2021-07-28",
  };
}

const upsertResponse = z.object({ contact: z.object({ id: z.string() }).passthrough() }).passthrough();
const opportunityResponse = z.object({ opportunity: z.object({ id: z.string() }).passthrough() }).passthrough();

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

  async createOpportunity(input: { contactId: string; name: string; stageId: string; monetaryValue?: number }): Promise<string> {
    if (!this.config.pipelineId) throw new Error("GHL_PIPELINE_ID is not set");
    const raw = await this.request("/opportunities/", "POST", {
      locationId: this.config.locationId,
      pipelineId: this.config.pipelineId,
      pipelineStageId: input.stageId,
      contactId: input.contactId,
      name: input.name,
      status: "open",
      ...(input.monetaryValue ? { monetaryValue: input.monetaryValue } : {}),
    });
    return opportunityResponse.parse(raw).opportunity.id;
  }

  async moveOpportunityStage(opportunityId: string, stageId: string): Promise<void> {
    await this.request(`/opportunities/${encodeURIComponent(opportunityId)}`, "PUT", {
      pipelineId: this.config.pipelineId ?? undefined,
      pipelineStageId: stageId,
    });
  }
}
