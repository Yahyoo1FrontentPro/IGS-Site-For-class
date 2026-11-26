export interface PrizeInfo {
  place: number;
  label: string;
  prize: string;
  emoji: string;
}

/** Weekly chocolate prizes for the top 3 solo students. */
export const WEEKLY_PRIZES: PrizeInfo[] = [
  { place: 1, label: "1st Place", prize: "1 Alpen Gold chocolate", emoji: "🥇🍫" },
  { place: 2, label: "2nd Place", prize: "1 Big Snickers chocolate", emoji: "🥈🍫" },
  { place: 3, label: "3rd Place", prize: "1 Snickers or Bounty chocolate", emoji: "🥉🍫" },
];

export function getPrizeForPlace(place: number): PrizeInfo | null {
  return WEEKLY_PRIZES.find((p) => p.place === place) ?? null;
}
