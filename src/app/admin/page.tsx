"use client";

import React, { useState } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { formatCentsToCurrency, PLATFORMS, Platform, CampaignStatus } from "@/shared/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { campaignFormSchema, CampaignFormValues } from "@/shared/schemas/campaign";
import { useI18n } from "@/i18n/context";

export default function AdminCampaignsPage() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [payoutDollar, setPayoutDollar] = useState("5.00");
  const [budgetDollar, setBudgetDollar] = useState("250.00");

  const campaignsQuery = trpc.campaign.list.useQuery({
    page,
    pageSize: 8,
    search: search ? search : undefined,
    status: statusFilter,
  });

  const utils = trpc.useUtils();
  const createMutation = trpc.campaign.create.useMutation({
    onSuccess: () => {
      utils.campaign.list.invalidate();
      setIsCreateModalOpen(false);
      reset();
      setPayoutDollar("5.00");
      setBudgetDollar("250.00");
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      title: "",
      platforms: ["tiktok", "instagram"],
      payoutPer1kViews: 500, // $5.00
      totalBudget: 25000, // $250.00
      status: "active",
      startsAt: new Date().toISOString().slice(0, 16),
      endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    },
  });

  const selectedPlatforms = watch("platforms") || [];

  const handlePlatformToggle = (p: Platform) => {
    if (selectedPlatforms.includes(p)) {
      setValue(
        "platforms",
        selectedPlatforms.filter((item) => item !== p)
      );
    } else {
      setValue("platforms", [...selectedPlatforms, p]);
    }
  };

  const onSubmit = async (data: CampaignFormValues) => {
    await createMutation.mutateAsync({
      ...data,
      startsAt: new Date(data.startsAt).toISOString(),
      endsAt: new Date(data.endsAt).toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("campaignsManagement")}
          </h1>
          <p className="text-sm text-slate-500">
            {t("campaignsSubtitle")}
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>{t("newCampaign")}</span>
        </Button>
      </div>

      {/* Filters: Search & Status */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t("searchPlaceholder")}
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(["all", "active", "draft", "paused", "completed"] as const).map(
            (status) => {
              const isSelected =
                (status === "all" && !statusFilter) || statusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status === "all" ? undefined : status);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {status === "all" ? t("all") : t(status as any)}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardContent className="p-0">
          {campaignsQuery.isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : !campaignsQuery.data?.items || campaignsQuery.data.items.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <p className="font-medium">{t("noCampaignsFound")}</p>
              <p className="text-xs text-slate-400">
                {t("adjustSearchTip")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">{t("colTitle")}</th>
                    <th className="px-6 py-3.5">{t("colStatus")}</th>
                    <th className="px-6 py-3.5">{t("colPlatforms")}</th>
                    <th className="px-6 py-3.5">{t("colRate")}</th>
                    <th className="px-6 py-3.5">{t("colBudget")}</th>
                    <th className="px-6 py-3.5">{t("colDuration")}</th>
                    <th className="px-6 py-3.5 text-right">{t("colActions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaignsQuery.data.items.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <Link
                          href={`/admin/campaigns/${camp.id}`}
                          className="hover:underline hover:text-indigo-600"
                        >
                          {camp.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={camp.status}>{t(camp.status as any)}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 flex-wrap">
                          {camp.platforms.map((p) => (
                            <span
                              key={p}
                              className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono capitalize"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-700">
                        {formatCentsToCurrency(camp.payoutPer1kViews)}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-900">
                        {formatCentsToCurrency(camp.totalBudget)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(camp.startsAt).toLocaleDateString()} -{" "}
                        {new Date(camp.endsAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/campaigns/${camp.id}`}>
                          <Button variant="outline" size="sm" className="gap-1">
                            <span>{t("reviewDetail")}</span>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Server-Side Pagination Controls */}
          {campaignsQuery.data && campaignsQuery.data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3">
              <div className="text-xs text-slate-500">
                {t("pageShowing", {
                  page,
                  totalPages: campaignsQuery.data.totalPages,
                  total: campaignsQuery.data.total,
                })}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>{t("previous")}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= campaignsQuery.data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="gap-1"
                >
                  <span>{t("next")}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t("createCampaignTitle")}
        description={t("createCampaignDesc")}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {createMutation.error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex gap-2 items-center">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{createMutation.error.message}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              {t("fieldTitle")}
            </label>
            <Input
              placeholder={t("fieldTitlePlaceholder")}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-[11px] text-rose-600">{errors.title.message}</p>
            )}
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              {t("createCampaignBtn")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
