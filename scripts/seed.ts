import { db, pool } from "../src/server/db";
import { users, campaigns, submissions, submissionMetrics } from "../src/server/db/schema";
import * as dotenv from "dotenv";

dotenv.config();

async function seed() {
  console.log("Seeding database...");

  try {
    // Clear existing data in reverse dependency order
    await db.delete(submissionMetrics);
    await db.delete(submissions);
    await db.delete(campaigns);
    await db.delete(users);

    console.log("Creating users...");
    const [admin, creator1, creator2] = await db
      .insert(users)
      .values([
        {
          id: "usr_admin",
          email: "admin@marketplace.com",
          name: "Sarah Jenkins (Admin)",
          role: "admin",
        },
        {
          id: "usr_creator_1",
          email: "alex@creator.com",
          name: "Alex Rivers",
          role: "creator",
        },
        {
          id: "usr_creator_2",
          email: "jordan@creator.com",
          name: "Jordan Lee",
          role: "creator",
        },
      ])
      .returning();

    console.log("Creating campaigns...");
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAhead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const [camp1, camp2, camp3] = await db
      .insert(campaigns)
      .values([
        {
          id: "cmp_glow_summer",
          title: "Summer Glow Skincare Launch",
          platforms: ["tiktok", "instagram", "youtube"],
          payoutPer1kViews: 500, // $5.00 per 1k views
          totalBudget: 15000, // $150.00 total budget
          status: "active",
          startsAt: sevenDaysAgo,
          endsAt: fourteenDaysAhead,
        },
        {
          id: "cmp_wireless_sound",
          title: "Aura Audio Pro Earbuds Review",
          platforms: ["youtube", "tiktok", "instagram"],
          payoutPer1kViews: 1000, // $10.00 per 1k views
          totalBudget: 40000, // $400.00 total budget
          status: "active",
          startsAt: sevenDaysAgo,
          endsAt: fourteenDaysAhead,
        },
        {
          id: "cmp_vintage_threads",
          title: "Retro Apparel Spring Drops",
          platforms: ["instagram"],
          payoutPer1kViews: 300, // $3.00 per 1k views
          totalBudget: 10000, // $100.00 total budget
          status: "completed",
          startsAt: thirtyDaysAgo,
          endsAt: twoDaysAgo,
        },
      ])
      .returning();

    console.log("Creating submissions...");
    const [sub1, sub2, subPending1, subPending2] = await db
      .insert(submissions)
      .values([
        {
          id: "sub_glow_alex_01",
          campaignId: camp1.id,
          creatorId: creator1.id,
          postUrl: "https://www.tiktok.com/@alexrivers/video/7391823901239123891",
          platform: "tiktok",
          status: "approved",
          createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          id: "sub_glow_jordan_01",
          campaignId: camp1.id,
          creatorId: creator2.id,
          postUrl: "https://www.instagram.com/reel/C8_k1LmP892/",
          platform: "instagram",
          status: "approved",
          createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        },
        {
          id: "sub_glow_alex_pending",
          campaignId: camp1.id,
          creatorId: creator1.id,
          postUrl: "https://www.instagram.com/reel/C9_m2QxP103/",
          platform: "instagram",
          status: "pending",
          createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          id: "sub_aura_jordan_pending",
          campaignId: camp2.id,
          creatorId: creator2.id,
          postUrl: "https://www.youtube.com/shorts/dQw4w9WgXcQ",
          platform: "youtube",
          status: "pending",
          createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        },
      ])
      .returning();

    console.log("Creating daily metrics for approved submissions...");
    // 4 days of metrics for sub1
    const dayDate = (daysAgo: number) => {
      const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      return d.toISOString().split("T")[0];
    };

    await db.insert(submissionMetrics).values([
      {
        id: "met_sub1_d4",
        submissionId: sub1.id,
        capturedAt: dayDate(4),
        views: 2400,
        likes: 180,
        comments: 15,
      },
      {
        id: "met_sub1_d3",
        submissionId: sub1.id,
        capturedAt: dayDate(3),
        views: 4800,
        likes: 390,
        comments: 32,
      },
      {
        id: "met_sub1_d2",
        submissionId: sub1.id,
        capturedAt: dayDate(2),
        views: 7500,
        likes: 590,
        comments: 48,
      },
      {
        id: "met_sub1_d1",
        submissionId: sub1.id,
        capturedAt: dayDate(1),
        views: 9200,
        likes: 720,
        comments: 65,
      },
      // 3 days of metrics for sub2
      {
        id: "met_sub2_d3",
        submissionId: sub2.id,
        capturedAt: dayDate(3),
        views: 1200,
        likes: 90,
        comments: 8,
      },
      {
        id: "met_sub2_d2",
        submissionId: sub2.id,
        capturedAt: dayDate(2),
        views: 3100,
        likes: 210,
        comments: 19,
      },
      {
        id: "met_sub2_d1",
        submissionId: sub2.id,
        capturedAt: dayDate(1),
        views: 5400,
        likes: 420,
        comments: 38,
      },
      // metric for pending sub to demonstrate potential cost calculation
      {
        id: "met_sub_pending1_d1",
        submissionId: subPending1.id,
        capturedAt: dayDate(1),
        views: 4500,
        likes: 310,
        comments: 22,
      },
      {
        id: "met_sub_pending2_d0",
        submissionId: subPending2.id,
        capturedAt: dayDate(0),
        views: 12000,
        likes: 950,
        comments: 80,
      },
    ]);

    console.log("Database seeded successfully!");
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
