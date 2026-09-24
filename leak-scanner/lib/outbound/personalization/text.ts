/** "Mike's Heating" → "Mike's Heating's"; "Green Star Solutions" → "Green Star Solutions'". */
export function possessive(name: string): string {
  const trimmed = name.trim();
  return /s$/i.test(trimmed) ? `${trimmed}'` : `${trimmed}'s`;
}
