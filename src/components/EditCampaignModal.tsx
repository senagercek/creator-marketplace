"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { campaignFormSchema, CampaignFormValues } from "@/shared/schemas/campaign";
import { trpc } from "@/trpc/client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLATFORMS, Platform, formatCentsToCurrency, CAMPAIGN_STATUSES } from "@/shared/types";
import { AlertCircle, Loader2 } from "lucide-react";
import { useI18n } from "@/i18n/context";

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
  const { t } = useI18n();

  const updateMutation = trpc.campaign.update.useMutation({
    onSuccess: () => {
      onUpdated();
      onClose();
    },
  });

  const [payoutDollar, setPayoutDollar] = React.useState(
    (campaign.payoutPer1kViews / 100).toFixed(2)
  );
  const [budgetDollar, setBudgetDollar] = React.useState(
    (campaign.totalBudget / 100).toFixed(2)
  );

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
      startsAt: new Date(campaign.startsAt).toISOString().slice(0, 16),
      endsAt: new Date(campaign.endsAt).toISOString().slice(0, 16),
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
      title={t("editCampaignTitle")}
      description={t("editCampaignDesc")}
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
            {t("fieldTitle")}
          </label>
          <Input {...register("title")} />
          {errors.title && (
            <p className="text-[11px] text-rose-600">{errors.title.message}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">
            {t("fieldStatus")}
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
                  {t(st as any)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Platforms */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            {t("fieldPlatforms")}
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

        {/* Payout & Budget (Dollar Input with Cents Sync) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              {t("fieldPayoutDollar")}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400">
                $
              </span>
              <Input
                type="number"
                step="0.25"
                min="0.50"
                placeholder="5.00"
                className="pl-7"
                value={payoutDollar}
                onChange={(e) => {
                  const val = e.target.value;
                  setPayoutDollar(val);
                  const num = parseFloat(val);
                  if (!isNaN(num) && num > 0) {
                    setValue("payoutPer1kViews", Math.round(num * 100), {
                      shouldValidate: true,
                    });
                  }
                }}
              />
            </div>
            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <span>{t("centsNote", { cents: watch("payoutPer1kViews") || 0 })}</span>
            </div>
            {errors.payoutPer1kViews && (
              <p className="text-[11px] text-rose-600">
                {errors.payoutPer1kViews.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              {t("fieldBudgetDollar")}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400">
                $
              </span>
              <Input
                type="number"
                step="10"
                min="10"
                placeholder="250.00"
                className="pl-7"
                value={budgetDollar}
                onChange={(e) => {
                  const val = e.target.value;
                  setBudgetDollar(val);
                  const num = parseFloat(val);
                  if (!isNaN(num) && num > 0) {
                    setValue("totalBudget", Math.round(num * 100), {
                      shouldValidate: true,
                    });
                  }
                }}
              />
            </div>
            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <span>{t("centsNote", { cents: (watch("totalBudget") || 0).toLocaleString() })}</span>
            </div>
            {errors.totalBudget && (
              <p className="text-[11px] text-rose-600">
                {errors.totalBudget.message}
              </p>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              {t("fieldStartsAt")}
            </label>
            <Input type="datetime-local" {...register("startsAt")} />
            {errors.startsAt && (
              <p className="text-[11px] text-rose-600">
                {errors.startsAt.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              {t("fieldEndsAt")}
            </label>
            <Input type="datetime-local" {...register("endsAt")} />
            {errors.endsAt && (
              <p className="text-[11px] text-rose-600">
                {errors.endsAt.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting || updateMutation.isPending}>
            {updateMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            )}
            {t("saveChanges")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
