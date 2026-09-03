"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { DailyViewsChart } from "@/components/DailyViewsChart";
import {
  ArrowLeft,
  Eye,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Calendar,
  Edit3,
} from "lucide-react";
import { formatCentsToCurrency, SubmissionStatus } from "@/shared/types";
import { EditCampaignModal } from "@/components/EditCampaignModal";
import { useI18n } from "@/i18n/context";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const { t } = useI18n();

  const [rejectingSubId, setRejectingSubId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submissionFilter, setSubmissionFilter] = useState<SubmissionStatus | "all">("all");
  const [approvalErrorMessage, setApprovalErrorMessage] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const campaignQuery = trpc.campaign.getById.useQuery({ id: campaignId });
  const submissionsQuery = trpc.submission.listByCampaign.useQuery({ campaignId });

  const utils = trpc.useUtils();

  const approveMutation = trpc.submission.approve.useMutation({
    onSuccess: () => {
      setApprovalErrorMessage(null);
      utils.campaign.getById.invalidate({ id: campaignId });
      utils.submission.listByCampaign.invalidate({ campaignId });
    },
    onError: (err) => {
      setApprovalErrorMessage(err.message);
    },
  });

  const rejectMutation = trpc.submission.reject.useMutation({
    onSuccess: () => {
      setRejectingSubId(null);
      setRejectionReason("");
      utils.submission.listByCampaign.invalidate({ campaignId });
    },
  });

  const handleApprove = async (submissionId: string) => {
    setApprovalErrorMessage(null);
    await approveMutation.mutateAsync({ submissionId });
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingSubId || rejectionReason.trim().length < 3) return;
    await rejectMutation.mutateAsync({
      submissionId: rejectingSubId,
      rejectionReason: rejectionReason.trim(),
    });
  };

  if (campaignQuery.isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (campaignQuery.isError || !campaignQuery.data) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-600 font-medium">Campaign not found.</p>
        <Button variant="outline" onClick={() => router.push("/admin")}>
          {t("backToCampaigns")}
        </Button>
      </div>
    );
  }

  const { campaign, stats } = campaignQuery.data;
  const submissions = submissionsQuery.data || [];

  const filteredSubmissions = submissions.filter((s) => {
    if (submissionFilter === "all") return true;
    return s.status === submissionFilter;
  });

  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const budgetSpentPercent = Math.min(
    100,
    Math.round((stats.budgetSpent / campaign.totalBudget) * 100)
  );

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t("backToCampaigns")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="gap-1.5"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>{t("editCampaign")}</span>
          </Button>
          <Badge variant={campaign.status} className="capitalize text-xs px-2.5 py-1">
            {t("statusLabel")}: {t(campaign.status as any)}
          </Badge>
        </div>
      </div>

      {/* Campaign Title & Meta */}
      <div className="space-y-2 border-b border-slate-200 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {campaign.title}
          </h1>
          <div className="text-sm font-mono text-slate-600">
            {t("ratePer1k", {
              rate: formatCentsToCurrency(campaign.payoutPer1kViews),
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {new Date(campaign.startsAt).toLocaleDateString()} -{" "}
              {new Date(campaign.endsAt).toLocaleDateString()}
            </span>
          </div>
          <div>•</div>
          <div>
            {t("colPlatforms")}:{" "}
            <span className="font-medium text-slate-700 uppercase">
              {campaign.platforms.join(", ")}
            </span>
          </div>
        </div>
      </div>

      {/* Budget & Views Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approved Views */}
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase text-slate-500">
              {t("totalApprovedViews")}
            </span>
            <Eye className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {stats.totalApprovedViews.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {t("approvedViewsDesc")}
            </p>
          </CardContent>
        </Card>

        {/* Budget Spent */}
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase text-slate-500">
              {t("budgetSpent")}
            </span>
            <DollarSign className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {formatCentsToCurrency(stats.budgetSpent)}
            </div>
            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${budgetSpentPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {budgetSpentPercent}% of{" "}
              {formatCentsToCurrency(campaign.totalBudget)}
            </p>
          </CardContent>
        </Card>

        {/* Budget Left */}
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase text-slate-500">
              {t("budgetLeft")}
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 font-mono">
              {formatCentsToCurrency(stats.budgetLeft)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {t("budgetAvailableDesc")}
            </p>
          </CardContent>
        </Card>

        {/* Review Queue Count */}
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase text-slate-500">
              {t("pendingSubmissions")}
            </span>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {pendingCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {t("awaitingReviewDesc")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Views Across Campaign Period Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{t("dailyViewsTimeline")}</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("dailyViewsDesc")}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DailyViewsChart data={stats.dailyViews} />
        </CardContent>
      </Card>

      {/* Typed Error Banner for Budget Exceeded */}
      {approvalErrorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">{t("approvalBlockedTitle")}</p>
            <p className="text-xs text-rose-700">{approvalErrorMessage}</p>
          </div>
        </div>
      )}

      {/* Review Queue & Submissions Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {t("reviewQueueTitle")}
            </h2>
            <p className="text-xs text-slate-500">
              {t("reviewQueueSubtitle")}
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
            {(["all", "pending", "approved", "rejected"] as const).map((filter) => {
              const isSelected = submissionFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setSubmissionFilter(filter)}
                  className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {filter === "all" ? t("all") : t(filter as any)}
                </button>
              );
            })}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {submissionsQuery.isLoading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                {t("noSubmissionsMatching", { filter: submissionFilter })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">{t("colClipCreator")}</th>
                      <th className="px-6 py-3.5">{t("colPlatforms")}</th>
                      <th className="px-6 py-3.5">{t("colLatestViews")}</th>
                      <th className="px-6 py-3.5">{t("colCostPayout")}</th>
                      <th className="px-6 py-3.5">{t("colStatus")}</th>
                      <th className="px-6 py-3.5 text-right">{t("colActions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">
                            {sub.creatorName}
                          </div>
                          <div className="text-xs text-slate-400">
                            {sub.creatorEmail}
                          </div>
                          <a
                            href={sub.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-1 font-mono truncate max-w-xs"
                          >
                            <span className="truncate">{sub.postUrl}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {sub.platform}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-medium text-slate-900">
                          {sub.currentViews.toLocaleString()} views
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-700 font-medium">
                          {formatCentsToCurrency(sub.potentialCost)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <Badge variant={sub.status}>{t(sub.status as any)}</Badge>
                            {sub.rejectionReason && (
                              <p className="text-[11px] text-rose-600 max-w-xs">
                                {t("rejectionReasonLabel")}: {sub.rejectionReason}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {sub.status === "pending" ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="success"
                                className="h-8 gap-1"
                                disabled={approveMutation.isPending}
                                onClick={() => handleApprove(sub.id)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>{t("approve")}</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 gap-1"
                                disabled={rejectMutation.isPending}
                                onClick={() => {
                                  setRejectingSubId(sub.id);
                                  setRejectionReason("");
                                }}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>{t("reject")}</span>
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              {t("reviewed")}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectingSubId !== null}
        onClose={() => setRejectingSubId(null)}
        title={t("rejectModalTitle")}
        description={t("rejectModalDesc")}
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              {t("rejectionReasonLabel")}
            </label>
            <textarea
              required
              rows={3}
              placeholder={t("rejectionReasonPlaceholder")}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {rejectionReason.length > 0 && rejectionReason.length < 3 && (
              <p className="text-[11px] text-rose-600">
                {t("reasonMinChars")}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectingSubId(null)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={
                rejectionReason.trim().length < 3 || rejectMutation.isPending
              }
            >
              {rejectMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              {t("confirmRejection")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Campaign Modal */}
      <EditCampaignModal
        campaign={campaign}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdated={() => {
          utils.campaign.getById.invalidate({ id: campaignId });
          utils.campaign.list.invalidate();
        }}
      />
    </div>
  );
}
