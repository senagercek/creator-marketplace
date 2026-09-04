"use client";

import React, { useState } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { DatePicker } from "@/components/ui/date-picker";
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
  ShieldAlert,
} from "lucide-react";
import { formatCentsToCurrency, PLATFORMS, Platform, CampaignStatus } from "@/shared/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { campaignFormSchema, CampaignFormValues } from "@/shared/schemas/campaign";

export default function AdminCampaignsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const campaignsQuery = trpc.campaign.list.useQuery({
    page,
    pageSize: 8,
    search: search ? search : undefined,
    status: statusFilter,
  });

  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery();
  const switchUserMutation = trpc.auth.switchUser.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });
  const currentUser = meQuery.data;
  const isCreator = currentUser && currentUser.role !== "admin";

  const createMutation = trpc.campaign.create.useMutation({
    onSuccess: () => {
      utils.campaign.list.invalidate();
      setIsCreateModalOpen(false);
      reset();
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
      payoutPer1kViews: 500, // 500 cents = $5.00
      totalBudget: 25000, // 25000 cents = $250.00
      status: "active",
      startsAt: new Date().toISOString().slice(0, 10),
      endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
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

  if (isCreator) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl border border-amber-200 bg-amber-50/80 text-center space-y-4 shadow-sm animate-in fade-in-50">
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-inner">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Admin Role Required</h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            You are currently browsing as <strong>{currentUser.name} (Creator)</strong>. In this marketplace, <strong>only Admins create and manage brand campaigns</strong>. Creators browse active campaigns and submit clips.
          </p>
        </div>
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/creator" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              Go to Creator Portal
            </Button>
          </Link>
          <Button
            onClick={() => switchUserMutation.mutateAsync({ userId: "usr_admin_sarah" })}
            disabled={switchUserMutation.isPending}
            className="w-full sm:w-auto bg-slate-900 text-white cursor-pointer"
          >
            {switchUserMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Switch to Sarah (Admin)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Campaigns Management
          </h1>
          <p className="text-sm text-slate-500">
            Monitor budgets, review creator video submissions, and track daily performance.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>New Campaign</span>
        </Button>
      </div>

      {/* Filters: Search & Status */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search campaign by title..."
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
                  {status}
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
              <p className="font-medium">No campaigns found.</p>
              <p className="text-xs text-slate-400">
                Try adjusting your search or create a new campaign.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Campaign Title</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Platforms</th>
                    <th className="px-6 py-3.5">Rate / 1k</th>
                    <th className="px-6 py-3.5">Total Budget</th>
                    <th className="px-6 py-3.5">Duration</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
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
                        <Badge variant={camp.status}>{camp.status}</Badge>
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
                            <span>Review & Detail</span>
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
                Showing page {page} of {campaignsQuery.data.totalPages} ({campaignsQuery.data.total} total campaigns)
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
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= campaignsQuery.data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="gap-1"
                >
                  <span>Next</span>
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
        title="Create New Clipping Campaign"
        description="Configure platforms, payout per 1k views, budget ceiling, and duration."
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
              Campaign Title
            </label>
            <Input
              placeholder="e.g. Summer Fitness Energy Drink Challenge"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-[11px] text-rose-600">{errors.title.message}</p>
            )}
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
              onClick={() => setIsCreateModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              Create Campaign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
