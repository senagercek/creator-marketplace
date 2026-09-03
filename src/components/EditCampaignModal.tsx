"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { campaignFormSchema, CampaignFormValues } from "@/shared/schemas/campaign";
import { trpc } from "@/trpc/client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { PLATFORMS, Platform, formatCentsToCurrency, CAMPAIGN_STATUSES } from "@/shared/types";
import { AlertCircle, Loader2 } from "lucide-react";

interface EditCampaignModalProps {
  campaign: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditCampaignModal({
  campaign,
  isOpen,
  onClose,
  onUpdated,
}: EditCampaignModalProps) {
  const updateMutation = trpc.campaign.update.useMutation({
    onSuccess: () => {
      onUpdated();
      onClose();
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    values: {
      title: campaign.title,
      platforms: campaign.platforms,
      payoutPer1kViews: campaign.payoutPer1kViews,
      totalBudget: campaign.totalBudget,
      status: campaign.status,
      startsAt: new Date(campaign.startsAt).toISOString().slice(0, 10),
      endsAt: new Date(campaign.endsAt).toISOString().slice(0, 10),
    },
  });

  const selectedPlatforms = watch("platforms") || [];

  const handlePlatformToggle = (p: Platform) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setValue(
          "platforms",
          selectedPlatforms.filter((item) => item !== p)
        );
      }
    } else {
      setValue("platforms", [...selectedPlatforms, p]);
    }
  };

  const onSubmit = async (data: CampaignFormValues) => {
    await updateMutation.mutateAsync({
      id: campaign.id,
      data: {
        ...data,
        startsAt: new Date(data.startsAt).toISOString(),
        endsAt: new Date(data.endsAt).toISOString(),
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Campaign"
      description="Update campaign budget, payout rate, duration, or active status."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {updateMutation.error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex gap-2 items-center">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{updateMutation.error.message}</span>
          </div>
        )}

        {/* Title */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">
            Campaign Title
          </label>
          <Input {...register("title")} />
          {errors.title && (
            <p className="text-[11px] text-rose-600">{errors.title.message}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">
            Campaign Status
          </label>
          <div className="flex gap-2">
            {CAMPAIGN_STATUSES.map((st) => {
              const isSelected = watch("status") === st;
              return (
                <button
                  type="button"
                  key={st}
                  onClick={() => setValue("status", st)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 font-semibold"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Platforms */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Supported Platforms
          </label>
          <div className="flex gap-2">
            {PLATFORMS.map((p) => {
              const checked = selectedPlatforms.includes(p);
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => handlePlatformToggle(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize border transition-all cursor-pointer ${
                    checked
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
          {errors.platforms && (
            <p className="text-[11px] text-rose-600">
              {errors.platforms.message}
            </p>
          )}
        </div>

        {/* Payout & Budget (Integer Cents per Section 3) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Payout per 1,000 Views (cents)
            </label>
            <Input
              type="number"
              placeholder="500"
              {...register("payoutPer1kViews", { valueAsNumber: true })}
            />
            <span className="text-[11px] text-slate-500 font-medium block">
              {watch("payoutPer1kViews")
                ? `Equivalent: ${formatCentsToCurrency(watch("payoutPer1kViews"))} / 1k views`
                : "Example: 500 cents = $5.00"}
            </span>
            {errors.payoutPer1kViews && (
              <p className="text-[11px] text-rose-600">
                {errors.payoutPer1kViews.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Total Budget (cents)
            </label>
            <Input
              type="number"
              placeholder="25000"
              {...register("totalBudget", { valueAsNumber: true })}
            />
            <span className="text-[11px] text-slate-500 font-medium block">
              {watch("totalBudget")
                ? `Equivalent: ${formatCentsToCurrency(watch("totalBudget"))} total budget`
                : "Example: 25000 cents = $250.00"}
            </span>
            {errors.totalBudget && (
              <p className="text-[11px] text-rose-600">
                {errors.totalBudget.message}
              </p>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <DatePicker
              label="Start Date"
              value={watch("startsAt")}
              onChange={(val) => setValue("startsAt", val, { shouldValidate: true })}
              error={errors.startsAt?.message}
            />

            <DatePicker
              label="End Date"
              value={watch("endsAt")}
              minDate={watch("startsAt")}
              onChange={(val) => setValue("endsAt", val, { shouldValidate: true })}
              error={errors.endsAt?.message}
            />
          </div>

          {/* Quick Duration Buttons */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[11px] text-slate-400 font-medium">Duration:</span>
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => {
                  const startVal = watch("startsAt");
                  const baseDate = startVal ? new Date(startVal + "T00:00:00") : new Date();
                  const newEnd = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
                  setValue("endsAt", newEnd.toISOString().slice(0, 10), { shouldValidate: true });
                }}
                className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
              >
                +{days} Days
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || updateMutation.isPending}
            className="w-full sm:w-auto"
          >
            {updateMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
