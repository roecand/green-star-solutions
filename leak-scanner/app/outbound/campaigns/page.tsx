import type { Metadata } from "next";
import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { db, dbReady, schema } from "@/lib/db";
import { listEmailProviders } from "@/lib/outbound/email";
import { createCampaignAction } from "../actions";
import { Notice, Section, StatusBadge, fmtDateTime, inputClass, primaryButtonClass, selectClass } from "@/components/outbound/ui";

export const metadata: Metadata = { title: "Campaigns" };

const DAYS = [
  [1, "Mon"],
  [2, "Tue"],
  [3, "Wed"],
  [4, "Thu"],
  [5, "Fri"],
  [6, "Sat"],
  [7, "Sun"],
] as const;

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<{ notice?: string; tone?: string }> }) {
  const { notice, tone } = await searchParams;
  await dbReady();
  const campaigns = await db.select().from(schema.outboundCampaigns).orderBy(desc(schema.outboundCampaigns.createdAt)).all();
  const counts = await db
    .select({ campaignId: schema.outboundCampaignLeads.campaignId, status: schema.outboundCampaignLeads.status, n: sql<number>`count(*)` })
    .from(schema.outboundCampaignLeads)
    .groupBy(schema.outboundCampaignLeads.campaignId, schema.outboundCampaignLeads.status)
    .all();
  const niches = await db.selectDistinct({ industry: schema.outboundLeads.industry }).from(schema.outboundLeads).all();
  const providers = listEmailProviders();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Campaigns</h1>
      <Notice notice={notice} tone={tone} />

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-3 font-medium">Campaign</th>
              <th className="p-3 font-medium">Niche</th>
              <th className="p-3 font-medium">Provider</th>
              <th className="p-3 font-medium">Leads</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No campaigns yet.
                </td>
              </tr>
            ) : (
              campaigns.map((c) => {
                const mine = counts.filter((x) => x.campaignId === c.id);
                const total = mine.reduce((s, x) => s + Number(x.n), 0);
                return (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-medium">
                      <Link href={`/outbound/campaigns/${c.id}`} className="hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="p-3">{c.niche ?? "—"}</td>
                    <td className="p-3">{c.provider}</td>
                    <td className="p-3 text-muted-foreground">
                      {total} {mine.length ? `(${mine.map((x) => `${x.n} ${x.status.toLowerCase().replace("_", " ")}`).join(", ")})` : ""}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="p-3 text-muted-foreground">{fmtDateTime(c.createdAt)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Section title="New campaign">
        <form action={createCampaignAction} className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1">
            <span className="font-medium">Name</span>
            <input name="name" required placeholder="Reno HVAC — Oct" className={inputClass} />
          </label>
          <label className="space-y-1">
            <span className="font-medium">Niche</span>
            <input name="niche" list="niches" placeholder="hvac" className={inputClass} />
            <datalist id="niches">
              {niches.map((n) => (n.industry ? <option key={n.industry} value={n.industry} /> : null))}
            </datalist>
          </label>
          <label className="space-y-1">
            <span className="font-medium">Email provider</span>
            <select name="provider" className={`${selectClass} w-full`} defaultValue="mock">
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                  {p.configured ? "" : " — not configured"}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="font-medium">Provider campaign id (Smartlead only)</span>
            <input name="providerCampaignRef" className={inputClass} />
          </label>
          <label className="space-y-1">
            <span className="font-medium">Daily limit (this campaign)</span>
            <input name="dailyLimit" type="number" min={1} max={500} defaultValue={30} className={inputClass} />
          </label>
          <label className="space-y-1">
            <span className="font-medium">Min seconds between sends</span>
            <input name="minDelaySeconds" type="number" min={0} max={3600} defaultValue={180} className={inputClass} />
          </label>
          <label className="space-y-1">
            <span className="font-medium">Send window (local hours)</span>
            <div className="flex items-center gap-2">
              <input name="sendWindowStart" type="number" min={0} max={23} defaultValue={8} className={inputClass} />
              <span>to</span>
              <input name="sendWindowEnd" type="number" min={1} max={24} defaultValue={16} className={inputClass} />
            </div>
          </label>
          <label className="space-y-1">
            <span className="font-medium">Timezone</span>
            <input name="timezone" defaultValue="America/Los_Angeles" className={inputClass} />
          </label>
          <fieldset className="space-y-1">
            <legend className="font-medium">Send days</legend>
            <div className="flex flex-wrap gap-3 pt-1">
              {DAYS.map(([n, label]) => (
                <label key={n} className="flex items-center gap-1">
                  <input type="checkbox" name="sendDays" value={n} defaultChecked={n <= 5} /> {label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center gap-2 sm:col-span-2 lg:col-span-3">
            <input type="checkbox" name="requireApproval" defaultChecked /> Require my approval before any lead&apos;s sequence can send (recommended)
          </label>
          <p className="text-muted-foreground sm:col-span-2 lg:col-span-3">
            Sequence: day 0 personalized email → day 3 short follow-up → day 7 new observation → day 12 close-the-loop. Stops on any reply, bounce, or opt-out.
          </p>
          <div>
            <button className={primaryButtonClass}>Create campaign</button>
          </div>
        </form>
      </Section>
    </div>
  );
}
