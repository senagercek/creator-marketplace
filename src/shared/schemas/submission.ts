import { z } from "zod";
import { PLATFORMS, isValidPlatformUrl } from "../types";

export const createSubmissionSchema = z
  .object({
    campaignId: z.string().min(1, "Campaign ID is required"),
    platform: z.enum(PLATFORMS, {
      errorMap: () => ({ message: "Please select a valid platform" }),
    }),
    postUrl: z.string().url("Must be a valid URL"),
  })
  .refine(
    (data) => isValidPlatformUrl(data.platform, data.postUrl),
    {
      message: "The URL must look like a real post URL on the selected platform (e.g., TikTok video, Instagram Reel, YouTube Short).",
      path: ["postUrl"],
    }
  );

export type CreateSubmissionValues = z.infer<typeof createSubmissionSchema>;

export const approveSubmissionSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
});

export type ApproveSubmissionValues = z.infer<typeof approveSubmissionSchema>;

export const rejectSubmissionSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  rejectionReason: z
    .string()
    .min(3, "Rejection reason must be at least 3 characters")
    .max(500, "Rejection reason cannot exceed 500 characters"),
});

export type RejectSubmissionValues = z.infer<typeof rejectSubmissionSchema>;
