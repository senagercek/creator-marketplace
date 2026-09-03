import { z } from "zod";
import { CAMPAIGN_STATUSES, PLATFORMS } from "../types";

export const baseCampaignSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be under 100 characters"),
  platforms: z
    .array(z.enum(PLATFORMS))
    .min(1, "Select at least one platform"),
  payoutPer1kViews: z
    .number({ invalid_type_error: "Payout must be a valid number" })
    .int("Payout must be an integer (cents)")
    .positive("Payout must be greater than 0"),
  totalBudget: z
    .number({ invalid_type_error: "Budget must be a valid number" })
    .int("Total budget must be an integer (cents)")
    .positive("Total budget must be greater than 0"),
  status: z.enum(CAMPAIGN_STATUSES).default("draft"),
  startsAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start date",
  }),
  endsAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid end date",
  }),
});

export const campaignFormSchema = baseCampaignSchema.refine(
  (data) => {
    const start = new Date(data.startsAt).getTime();
    const end = new Date(data.endsAt).getTime();
    return end > start;
  },
  {
    message: "End date must be after start date",
    path: ["endsAt"],
  }
);

export const updateCampaignSchema = baseCampaignSchema.partial();

export type CampaignFormValues = z.infer<typeof campaignFormSchema>;
export type UpdateCampaignValues = z.infer<typeof updateCampaignSchema>;

export const campaignFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.enum(CAMPAIGN_STATUSES).optional(),
});

export type CampaignFilterValues = z.infer<typeof campaignFilterSchema>;
