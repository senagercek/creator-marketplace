import { describe, it, expect, beforeAll } from "vitest";
import { db } from "../src/server/db";
import { campaigns, submissions, users } from "../src/server/db/schema";
import {
  createCallerForUser,
  mockAdmin,
  mockCreator1,
  mockCreator2,
} from "./helpers";

describe("Access Control & Ownership Enforcement", () => {
  const adminCaller = createCallerForUser(mockAdmin);
  const creator1Caller = createCallerForUser(mockCreator1);
  const creator2Caller = createCallerForUser(mockCreator2);
  const anonCaller = createCallerForUser(null);

  const campaignId = `test_cmp_acl_${Date.now()}`;
  let subCreator1Id = "";
  let subCreator2Id = "";

  beforeAll(async () => {
    await db
      .insert(users)
      .values([mockAdmin, mockCreator1, mockCreator2])
      .onConflictDoNothing();

    await db.insert(campaigns).values({
      id: campaignId,
      title: "Access Control Test Campaign",
      platforms: ["tiktok", "instagram"],
      payoutPer1kViews: 500,
      totalBudget: 10000,
      status: "active",
      startsAt: new Date(Date.now() - 3600000),
      endsAt: new Date(Date.now() + 86400000),
    });

    // Creator 1 creates a submission
    const sub1 = await creator1Caller.submission.create({
      campaignId,
      platform: "tiktok",
      postUrl: "https://www.tiktok.com/@creator1/video/1001",
    });
    subCreator1Id = sub1.id;

    // Creator 2 creates a submission
    const sub2 = await creator2Caller.submission.create({
      campaignId,
      platform: "instagram",
      postUrl: "https://www.instagram.com/reel/C1002/",
    });
    subCreator2Id = sub2.id;
  });

  it("creator can only see their own submissions in mySubmissions", async () => {
    const creator1Subs = await creator1Caller.submission.mySubmissions();
    const creator2Subs = await creator2Caller.submission.mySubmissions();

    const c1Ids = creator1Subs.map((s) => s.id);
    const c2Ids = creator2Subs.map((s) => s.id);

    expect(c1Ids).toContain(subCreator1Id);
    expect(c1Ids).not.toContain(subCreator2Id);

    expect(c2Ids).toContain(subCreator2Id);
    expect(c2Ids).not.toContain(subCreator1Id);
  });

  it("blocks creators from performing admin-only actions (approve)", async () => {
    await expect(
      creator1Caller.submission.approve({ submissionId: subCreator1Id })
    ).rejects.toThrow(/Admin role required/i);
  });

  it("blocks creators from performing admin-only actions (create campaign)", async () => {
    await expect(
      creator1Caller.campaign.create({
        title: "Malicious Campaign",
        platforms: ["tiktok"],
        payoutPer1kViews: 1000,
        totalBudget: 50000,
        status: "active",
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 86400000).toISOString(),
      })
    ).rejects.toThrow(/Admin role required/i);
  });

  it("blocks unauthenticated callers from protected procedures", async () => {
    await expect(anonCaller.submission.mySubmissions()).rejects.toThrow(
      /You must be signed in/i
    );
  });

  it("rejects duplicate URL submissions on the same campaign", async () => {
    await expect(
      creator1Caller.submission.create({
        campaignId,
        platform: "tiktok",
        postUrl: "https://www.tiktok.com/@creator1/video/1001", // duplicate URL
      })
    ).rejects.toThrow(/already been submitted/i);
  });

  it("rejects submission if platform is not accepted by campaign", async () => {
    await expect(
      creator1Caller.submission.create({
        campaignId,
        platform: "youtube", // Campaign only accepts tiktok and instagram
        postUrl: "https://www.youtube.com/shorts/abcd1234efg",
      })
    ).rejects.toThrow(/does not accept submissions from youtube/i);
  });
});
