import { z } from "zod";

export const PLATFORMS = ["tiktok", "instagram", "youtube"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const CAMPAIGN_STATUSES = ["draft", "active", "paused", "completed"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const SUBMISSION_STATUSES = ["pending", "approved", "rejected", "paid"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const USER_ROLES = ["admin", "creator"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Platform URL validation patterns
export const PLATFORM_URL_PATTERNS: Record<Platform, RegExp> = {
  tiktok: /^https?:\/\/((www|vm|vt|m)\.)?tiktok\.com\/(@[\w.-]+\/(video|photo)\/\d+|[\w.-]+)/i,
  instagram: /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+/i,
  youtube: /^https?:\/\/((www|m)\.)?(youtube\.com\/(shorts\/|watch\?v=)|youtu\.be\/)[\w-]+/i,
};

export function isValidPlatformUrl(platform: Platform, url: string): boolean {
  const pattern = PLATFORM_URL_PATTERNS[platform];
  if (!pattern) return false;
  return pattern.test(url.trim());
}

export function formatCentsToCurrency(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function calculateEarnings(views: number, payoutPer1kViewsInCents: number): number {
  return Math.floor(views / 1000) * payoutPer1kViewsInCents;
}
