/**
 * Adds the compliance footer at send time (never stored in the editable
 * draft, so an edit can't accidentally delete the opt-out). CAN-SPAM needs a
 * valid physical postal address and a working opt-out in every message.
 */
export interface SenderConfig {
  name: string;
  company: string;
  postalAddress: string | null;
  appUrl: string;
}

export function senderConfig(): SenderConfig {
  return {
    name: process.env.OUTBOUND_SENDER_NAME?.trim() || "Robert",
    company: process.env.OUTBOUND_SENDER_COMPANY?.trim() || "Greenstar Solutions",
    postalAddress: process.env.OUTBOUND_SENDER_ADDRESS?.trim() || null,
    appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  };
}

export function unsubscribeUrl(token: string, sender: SenderConfig = senderConfig()): string {
  return `${sender.appUrl}/u/${token}`;
}

export function oneClickUnsubscribeUrl(token: string, sender: SenderConfig = senderConfig()): string {
  return `${sender.appUrl}/api/outbound/unsubscribe/${token}`;
}

export function renderEmailText(body: string, unsubscribeToken: string, sender: SenderConfig = senderConfig()): string {
  const footer = [
    `${sender.name}`,
    sender.company,
    "",
    "--",
    ...(sender.postalAddress ? [sender.postalAddress] : []),
    `Not interested? Reply "no thanks" or opt out here: ${unsubscribeUrl(unsubscribeToken, sender)}`,
  ].join("\n");
  return `${body.trim()}\n\n${footer}`;
}

export function textToHtml(text: string): string {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .split(/\n\s*\n/)
    .map((p) => `<p>${escape(p).replace(/\n/g, "<br>").replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')}</p>`)
    .join("");
}
