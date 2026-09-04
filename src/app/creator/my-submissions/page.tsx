"use client";

import React, { useState } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  ExternalLink,
  Eye,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Filter,
  Edit3,
  Trash2,
  Lock,
} from "lucide-react";
import { formatCentsToCurrency, isValidPlatformUrl, Platform } from "@/shared/types";

export default function MySubmissionsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [editingSub, setEditingSub] = useState<any | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmWithdrawId, setConfirmWithdrawId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const mySubmissionsQuery = trpc.submission.mySubmissions.useQuery();
  const meQuery = trpc.auth.me.useQuery();

  const withdrawMutation = trpc.submission.withdraw.useMutation({
    onSuccess: () => {
      setConfirmWithdrawId(null);
      utils.submission.mySubmissions.invalidate();
    },
  });

  const updateUrlMutation = trpc.submission.updateUrl.useMutation({
    onSuccess: () => {
      setEditingSub(null);
      setEditUrl("");
      setEditError(null);
      utils.submission.mySubmissions.invalidate();
    },
    onError: (err) => {
      setEditError(err.message);
    },
  });

  const handleStartEdit = (sub: any) => {
    setEditingSub(sub);
    setEditUrl(sub.postUrl);
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    if (!isValidPlatformUrl(editingSub.platform as Platform, editUrl.trim())) {
      setEditError(`The URL must be a valid ${editingSub.platform} post URL.`);
      return;
    }
    setEditError(null);
    await updateUrlMutation.mutateAsync({
      id: editingSub.id,
      postUrl: editUrl.trim(),
    });
  };

  const submissions = mySubmissionsQuery.data || [];

  // Summary stats for creator
  const totalEarned = submissions
    .filter((s) => s.status === "approved" || s.status === "paid")
    .reduce((acc, curr) => acc + curr.estimatedEarnings, 0);

  const totalViews = submissions.reduce((acc, curr) => acc + curr.currentViews, 0);

  const approvedCount = submissions.filter(
    (s) => s.status === "approved" || s.status === "paid"
  ).length;
  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const rejectedCount = submissions.filter((s) => s.status === "rejected").length;

  const filteredSubmissions = submissions.filter((s) => {
    if (filter === "all") return true;
    if (filter === "approved") return s.status === "approved" || s.status === "paid";
    return s.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Clip Submissions
          </h1>
          <p className="text-sm text-slate-500">
            Track the verification status, daily sync views, and estimated earnings of your videos.
          </p>
        </div>
        <Link href="/creator">
          <Button className="gap-2">Browse More Campaigns</Button>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Total Submissions
            </span>
            <Clock className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {submissions.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {approvedCount} approved, {pendingCount} pending
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Total Tracked Views
            </span>
            <Eye className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {totalViews.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Updated via daily ingestion
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Estimated Total Earnings
            </span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 font-mono">
              {formatCentsToCurrency(totalEarned)}
            </div>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              From approved clip views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            filter === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          All ({submissions.length})
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            filter === "approved"
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Approved ({approvedCount})</span>
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            filter === "pending"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white text-amber-700 hover:bg-amber-50 border border-amber-200"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Pending ({pendingCount})</span>
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            filter === "rejected"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-white text-rose-700 hover:bg-rose-50 border border-rose-200"
          }`}
        >
          <XCircle className="h-3.5 w-3.5" />
          <span>Rejected ({rejectedCount})</span>
        </button>
      </div>

      {/* Submissions List */}
      <Card>
        <CardContent className="p-0">
          {mySubmissionsQuery.isLoading ? (
            <div className="p-16 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <p className="font-medium">No submissions found for this filter.</p>
              <p className="text-xs text-slate-400">
                Browse active brand campaigns and submit your video clips!
              </p>
              <Link href="/creator">
                <Button size="sm" className="mt-2">
                  Browse Campaigns
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Campaign</th>
                    <th className="px-6 py-3.5">Platform & Link</th>
                    <th className="px-6 py-3.5">Current Views</th>
                    <th className="px-6 py-3.5">Estimated Earnings</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Submitted On</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map((sub) => (
                    <tr
                      key={sub.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        sub.status === "approved" || sub.status === "paid"
                          ? "bg-emerald-50/20"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {sub.campaignTitle}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {sub.platform}
                          </span>
                          <a
                            href={sub.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-mono truncate max-w-xs"
                            title={`Open post on ${sub.platform}`}
                          >
                            <span className="truncate">{sub.postUrl}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-900">
                        {sub.currentViews.toLocaleString()} views
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-emerald-600">
                        {sub.status === "approved" || sub.status === "paid" ? (
                          <div className="flex items-center gap-1.5">
                            <span>{formatCentsToCurrency(sub.estimatedEarnings)}</span>
                            <Badge variant="approved" className="text-[10px] py-0 px-1">
                              earned
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal text-xs">
                            Pending approval
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <Badge variant={sub.status}>{sub.status}</Badge>
                          {sub.rejectionReason && (
                            <div className="flex items-start gap-1 text-[11px] text-rose-600 max-w-xs mt-1">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                              <span>Reason: {sub.rejectionReason}</span>
                            </div>
                          )}
                          {sub.status === "rejected" && (
                            <div className="pt-1">
                              <Link
                                href="/creator"
                                className="inline-flex items-center text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                              >
                                Re-apply to Campaign &rarr;
                              </Link>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {sub.status === "pending" ? (
                          confirmWithdrawId === sub.id ? (
                            <div className="flex items-center justify-end gap-1.5 animate-in fade-in">
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={withdrawMutation.isPending}
                                onClick={() => withdrawMutation.mutate({ id: sub.id })}
                                className="text-xs h-7 px-2 bg-rose-600 hover:bg-rose-700 cursor-pointer"
                              >
                                {withdrawMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  "Confirm"
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmWithdrawId(null)}
                                className="text-xs h-7 px-1.5 text-slate-500 cursor-pointer"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartEdit(sub)}
                                className="text-xs h-7 px-2 text-slate-700 hover:text-slate-900 border-slate-200 cursor-pointer"
                              >
                                <Edit3 className="h-3 w-3 mr-1 text-slate-500" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmWithdrawId(sub.id)}
                                className="text-xs h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Withdraw
                              </Button>
                            </div>
                          )
                        ) : sub.status === "approved" || sub.status === "paid" ? (
                          <span className="text-[11px] font-medium text-slate-400 inline-flex items-center gap-1 justify-end">
                            <Lock className="h-3 w-3 text-slate-400" />
                            Locked
                          </span>
                        ) : (
                          <Link href="/creator">
                            <Button size="sm" variant="outline" className="text-xs h-7 px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 cursor-pointer">
                              Re-apply
                            </Button>
                          </Link>
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

      {/* Edit Clip URL Modal */}
      {editingSub && (
        <Modal
          isOpen={!!editingSub}
          onClose={() => setEditingSub(null)}
          title="Edit Clip URL"
          description={`Update your submitted video link for ${editingSub.campaignTitle} before brand review.`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex gap-2 items-center">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Post URL ({editingSub.platform})
              </label>
              <Input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder={`https://${editingSub.platform}.com/...`}
                autoFocus
              />
              <span className="text-[11px] text-slate-400 block">
                Must be a valid post URL on {editingSub.platform}.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingSub(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateUrlMutation.isPending}>
                {updateUrlMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                )}
                Save URL
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
