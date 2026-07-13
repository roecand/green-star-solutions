const wrapper = (body: string) => `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f5f1;font-family:Arial,Helvetica,sans-serif;color:#1a2420;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px;border:1px solid #dde7df;">
      <p style="font-size:13px;letter-spacing:1px;color:#16a34a;font-weight:bold;margin:0 0 16px;">GREENSTAR REVENUE LEAK SCANNER</p>
      ${body}
      <p style="font-size:12px;color:#5c6b63;margin-top:32px;border-top:1px solid #dde7df;padding-top:16px;">
        Sent by Greenstar Solutions. This report is a diagnostic based on your website's public content — not a guarantee of results.
      </p>
    </div>
  </div>
</body>
</html>`;

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;margin:8px 0;">${label}</a>`;

export function reportReadyEmail(input: {
  businessName: string;
  score: number;
  verdict: string;
  reportUrl: string;
}): string {
  return wrapper(`
    <h1 style="font-size:22px;margin:0 0 12px;">Your Revenue Leak Report is ready</h1>
    <p style="font-size:15px;line-height:1.6;">Hi — we finished scanning <strong>${escapeHtml(input.businessName)}</strong>.</p>
    <p style="font-size:15px;line-height:1.6;">Your Revenue Leak Score: <strong style="font-size:20px;">${input.score}/100</strong></p>
    <p style="font-size:15px;line-height:1.6;">${escapeHtml(input.verdict)}</p>
    ${button(input.reportUrl, "View your full report")}
    <p style="font-size:14px;color:#5c6b63;line-height:1.6;">The report shows exactly where you're likely losing calls and bookings — and what to fix first.</p>
  `);
}

export function adminNewLeadEmail(input: {
  businessName: string;
  email: string | null;
  industry: string;
  city: string | null;
  score: number | null;
  hotScore: number;
  adminUrl: string;
}): string {
  return wrapper(`
    <h1 style="font-size:20px;margin:0 0 12px;">New scanner lead: ${escapeHtml(input.businessName)}</h1>
    <ul style="font-size:14px;line-height:1.8;">
      <li>Email: ${escapeHtml(input.email ?? "not provided")}</li>
      <li>Industry: ${escapeHtml(input.industry)}</li>
      <li>City: ${escapeHtml(input.city ?? "—")}</li>
      <li>Revenue Leak Score: ${input.score ?? "pending"}</li>
      <li>Hot lead score: ${input.hotScore}/100</li>
    </ul>
    ${button(input.adminUrl, "Open in admin")}
  `);
}

export function helpRequestEmail(input: {
  businessName: string;
  email: string | null;
  requestType: string;
  score: number | null;
  adminUrl: string;
}): string {
  return wrapper(`
    <h1 style="font-size:20px;margin:0 0 12px;">🔥 Help request: ${escapeHtml(input.businessName)}</h1>
    <p style="font-size:15px;line-height:1.6;">A lead clicked <strong>${escapeHtml(input.requestType)}</strong> on their report.</p>
    <ul style="font-size:14px;line-height:1.8;">
      <li>Email: ${escapeHtml(input.email ?? "not provided")}</li>
      <li>Revenue Leak Score: ${input.score ?? "—"}</li>
    </ul>
    ${button(input.adminUrl, "Open lead in admin")}
  `);
}

export function rescanCompleteEmail(input: {
  businessName: string;
  score: number;
  previousScore: number | null;
  reportUrl: string;
}): string {
  const delta =
    input.previousScore === null
      ? ""
      : input.score > input.previousScore
        ? ` (up from ${input.previousScore})`
        : input.score < input.previousScore
          ? ` (down from ${input.previousScore})`
          : ` (unchanged)`;
  return wrapper(`
    <h1 style="font-size:20px;margin:0 0 12px;">Your scheduled re-scan is complete</h1>
    <p style="font-size:15px;line-height:1.6;"><strong>${escapeHtml(input.businessName)}</strong> scored <strong>${input.score}/100</strong>${delta}.</p>
    ${button(input.reportUrl, "View the updated report")}
  `);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
