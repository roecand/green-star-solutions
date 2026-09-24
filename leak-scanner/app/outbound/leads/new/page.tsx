import type { Metadata } from "next";
import { createLeadAction } from "../../actions";
import { Notice, inputClass, primaryButtonClass } from "@/components/outbound/ui";

export const metadata: Metadata = { title: "Add lead" };

const FIELDS: Array<[string, string, boolean]> = [
  ["company_name", "Company name", true],
  ["website", "Website", false],
  ["email", "Email", false],
  ["first_name", "First name", false],
  ["last_name", "Last name", false],
  ["phone", "Phone", false],
  ["industry", "Industry / niche", false],
  ["city", "City", false],
  ["state", "State", false],
  ["source", "Source", false],
];

export default async function NewLeadPage({ searchParams }: { searchParams: Promise<{ notice?: string; tone?: string }> }) {
  const { notice, tone } = await searchParams;
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Add lead</h1>
      <Notice notice={notice} tone={tone} />
      <form action={createLeadAction} className="grid gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-2">
        {FIELDS.map(([name, label, required]) => (
          <label key={name} className="space-y-1 text-sm">
            <span className="font-medium">{label}</span>
            <input name={name} required={required} className={inputClass} />
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="autoQueue" defaultChecked /> Queue for website analysis
        </label>
        <div className="sm:col-span-2">
          <button className={primaryButtonClass}>Create lead</button>
        </div>
      </form>
    </div>
  );
}
