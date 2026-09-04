"use client";

import React, { useState } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  Video,
  ExternalLink,
  Calendar,
  DollarSign,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Plus,
  Sparkles,
  Search,
  Filter,
  X,
  Layers,
} from "lucide-react";
import { formatCentsToCurrency, Platform, PLATFORMS, isValidPlatformUrl } from "@/shared/types";

export default function CreatorBrowsePage() {
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("tiktok");
  const [postUrl, setPostUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [participationFilter, setParticipationFilter] = useState<"all" | "available" | "joined">("all");

  const campaignsQuery = trpc.campaign.listActiveForCreators.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: search.trim() ? search.trim() : undefined,
  });
  const mySubmissionsQuery = trpc.submission.mySubmissions.useQuery();
  const meQuery = trpc.auth.me.useQuery();

  const utils = trpc.useUtils();
  const submitMutation = trpc.submission.create.useMutation({
    onSuccess: () => {
      setSuccessMessage("Clip submitted successfully! Awaiting brand review.");
      setErrorMessage(null);
      setPostUrl("");
      utils.submission.mySubmissions.invalidate();
      utils.campaign.listActiveForCreators.invalidate();
    },
    onError: (err) => {
      setErrorMessage(err.message);
      setSuccessMessage(null);
    },
  });

  const handleOpenSubmitModal = (campaign: any) => {
    setSelectedCampaign(campaign);
    setSelectedPlatform(campaign.platforms[0] as Platform);
    setPostUrl("");
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    if (!isValidPlatformUrl(selectedPlatform, postUrl)) {
      setErrorMessage(
        `The URL must look like a real post URL on ${selectedPlatform} (e.g. https://www.tiktok.com/@user/video/12345)`
      );
      return;
    }

    setErrorMessage(null);
    await submitMutation.mutateAsync({
      campaignId: selectedCampaign.id,
      platform: selectedPlatform,
      postUrl: postUrl.trim(),
    });
  };

  const isUrlValid = postUrl.trim().length > 0 && isValidPlatformUrl(selectedPlatform, postUrl);

  const allCampaigns = campaignsQuery.data || [];
  const mySubmissions = mySubmissionsQuery.data || [];
  const approvedSubs = mySubmissions.filter(
    (s) => s.status === "approved" || s.status === "paid"
  );
  const totalEarned = approvedSubs.reduce((acc, curr) => acc + curr.estimatedEarnings, 0);
  const totalViews = mySubmissions.reduce((acc, curr) => acc + curr.currentViews, 0);

  const joinedCampaignIds = new Set(mySubmissions.map((s) => s.campaignId));
  const availableCount = allCampaigns.filter((c) => !joinedCampaignIds.has(c.id)).length;
  const joinedCount = allCampaigns.filter((c) => joinedCampaignIds.has(c.id)).length;

  const filteredCampaigns = allCampaigns.filter((camp) => {
    const hasSubmitted = joinedCampaignIds.has(camp.id);
    if (participationFilter === "available") return !hasSubmitted;
    if (participationFilter === "joined") return hasSubmitted;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Creator Campaigns & Opportunities
          </h1>
          <p className="text-sm text-slate-500">
            Browse all brand campaigns, submit your short-form clips, and earn per 1,000 views.
          </p>
        </div>
        <Link href="/creator/my-submissions">
          <Button variant="outline" className="gap-2">
            <span>View My Submissions</span>
            {mySubmissions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                {mySubmissions.length}
              </span>
            )}
          </Button>
        </Link>
      </div>

      {/* Approved Earnings Banner if any */}
      {approvedSubs.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                You have {approvedSubs.length} approved {approvedSubs.length === 1 ? "clip" : "clips"} earning money!
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Total earnings:{" "}
                <span className="font-mono font-bold text-emerald-700">
                  {formatCentsToCurrency(totalEarned)}
                </span>{" "}
                across{" "}
                <span className="font-mono font-semibold text-slate-800">
                  {totalViews.toLocaleString()} views
                </span>.
              </p>
            </div>
          </div>
          <Link href="/creator/my-submissions" className="shrink-0">
            <Button size="sm" className="w-full sm:w-auto bg-slate-900 text-white">
              View All Submissions
            </Button>
          </Link>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        {/* Participation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setParticipationFilter("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              participationFilter === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>All Campaigns</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                participationFilter === "all"
                  ? "bg-slate-700 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {allCampaigns.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setParticipationFilter("available")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              participationFilter === "available"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>Available to Join</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                participationFilter === "available"
                  ? "bg-slate-700 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {availableCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setParticipationFilter("joined")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              participationFilter === "joined"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>Joined / My Clips</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                participationFilter === "joined"
                  ? "bg-slate-700 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {joinedCount}
            </span>
          </button>
        </div>

        {/* Right side: Search + Status Selector */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 md:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-slate-50/50"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Campaigns Grid */}
      {campaignsQuery.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 space-y-3">
          <p className="font-medium text-slate-800">No campaigns match your filter.</p>
          <p className="text-xs text-slate-400">
            {participationFilter === "available"
              ? "You have already submitted clips to all available campaigns!"
              : participationFilter === "joined"
              ? "You have not submitted clips to any campaigns yet. Check 'Available to Join'!"
              : "No campaigns found. Try resetting your search or status filter."}
          </p>
          {(participationFilter !== "all" || statusFilter !== "all" || search) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setParticipationFilter("all");
                setStatusFilter("all");
                setSearch("");
              }}
              className="mt-2"
            >
              Reset Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((camp) => {
            // Check if creator has submitted to this campaign
            const userSubsForCamp = mySubmissions.filter((s) => s.campaignId === camp.id);
            const latestSub = userSubsForCamp[0]; // Most recent

            return (
              <Card
                key={camp.id}
                className={`flex flex-col justify-between hover:shadow-md transition-shadow ${
                  latestSub?.status === "approved"
                    ? "border-emerald-200 ring-1 ring-emerald-200/50"
                    : camp.status === "completed"
                    ? "opacity-90 bg-slate-50/40"
                    : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={camp.status as any} className="text-[11px] capitalize">
                      {camp.status}
                    </Badge>
                    <div className="flex gap-1">
                      {camp.platforms.map((p) => (
                        <span
                          key={p}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase font-mono font-medium"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <CardTitle className="text-base mt-2 text-slate-900 line-clamp-2">
                    {camp.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 pb-4">
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                    <div className="text-xs text-slate-500">Payout Rate</div>
                    <div className="text-xl font-bold font-mono text-emerald-600">
                      {formatCentsToCurrency(camp.payoutPer1kViews)}{" "}
                      <span className="text-xs font-normal text-slate-500">
                        / 1k views
                      </span>
                    </div>
                  </div>

                  {/* Creator Submission Status Indicator */}
                  {latestSub ? (
                    <div
                      className={`rounded-lg p-2.5 space-y-1 ${
                        latestSub.status === "approved" || latestSub.status === "paid"
                          ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                          : latestSub.status === "rejected"
                          ? "bg-rose-50 border border-rose-200 text-rose-900"
                          : "bg-amber-50 border border-amber-200 text-amber-900"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          {latestSub.status === "approved" || latestSub.status === "paid" ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span>Your Clip is Approved!</span>
                            </>
                          ) : latestSub.status === "rejected" ? (
                            <>
                              <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                              <span>Clip Rejected</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                              <span>Pending Brand Review</span>
                            </>
                          )}
                        </div>
                        <Badge variant={latestSub.status} className="text-[10px]">
                          {latestSub.status}
                        </Badge>
                      </div>

                      {(latestSub.status === "approved" || latestSub.status === "paid") && (
                        <div className="flex items-center justify-between text-[11px] text-emerald-800 font-mono pt-0.5">
                          <span>{latestSub.currentViews.toLocaleString()} views</span>
                          <span className="font-bold">
                            {formatCentsToCurrency(latestSub.estimatedEarnings)} earned
                          </span>
                        </div>
                      )}

                      {latestSub.status === "rejected" && latestSub.rejectionReason && (
                        <p className="text-[11px] text-rose-700 mt-1">
                          Reason: {latestSub.rejectionReason}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg p-2.5 bg-slate-50 border border-slate-200/60 text-slate-600 text-xs flex items-center gap-2">
                      <Video className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>
                        {camp.status === "active"
                          ? "Open for clips — submit your link to start earning"
                          : camp.status === "completed"
                          ? "Campaign completed (Budget ceiling reached)"
                          : `Campaign is currently ${camp.status}`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      Ends: {new Date(camp.endsAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  {latestSub?.status === "approved" || latestSub?.status === "paid" ? (
                    <div className="flex items-center gap-2 w-full">
                      <Link href="/creator/my-submissions" className="flex-1">
                        <Button variant="outline" className="w-full text-xs">
                          View Earnings
                        </Button>
                      </Link>
                      {camp.status === "active" && (
                        <Button
                          variant="outline"
                          className="gap-1 text-xs"
                          onClick={() => handleOpenSubmitModal(camp)}
                        >
                          <Plus className="h-3 w-3" />
                          <span>Submit Another</span>
                        </Button>
                      )}
                    </div>
                  ) : latestSub?.status === "pending" ? (
                    <div className="flex items-center gap-2 w-full">
                      <Link href="/creator/my-submissions" className="flex-1">
                        <Button variant="outline" className="w-full text-xs">
                          View Status
                        </Button>
                      </Link>
                      {camp.status === "active" && (
                        <Button
                          variant="outline"
                          className="gap-1 text-xs"
                          onClick={() => handleOpenSubmitModal(camp)}
                        >
                          <Plus className="h-3 w-3" />
                          <span>Submit Another</span>
                        </Button>
                      )}
                    </div>
                  ) : latestSub?.status === "rejected" ? (
                    <div className="flex items-center gap-2 w-full">
                      <Link href="/creator/my-submissions" className="flex-1">
                        <Button variant="outline" className="w-full text-xs text-rose-700 hover:text-rose-800">
                          View Reason
                        </Button>
                      </Link>
                      {camp.status === "active" && (
                        <Button
                          className="gap-1.5 text-xs"
                          onClick={() => handleOpenSubmitModal(camp)}
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Resubmit Clip</span>
                        </Button>
                      )}
                    </div>
                  ) : camp.status === "active" ? (
                    <Button
                      className="w-full gap-2"
                      onClick={() => handleOpenSubmitModal(camp)}
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Submit Video Clip</span>
                    </Button>
                  ) : camp.status === "completed" ? (
                    <Button
                      variant="outline"
                      disabled
                      className="w-full text-xs bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    >
                      Campaign Ended (Budget Reached)
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      disabled
                      className="w-full text-xs bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed capitalize"
                    >
                      Campaign {camp.status}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Section: My Recent Clip Submissions */}
      {mySubmissions.length > 0 && (
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                My Recent Clip Submissions
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of your submitted clips and verification statuses.
              </p>
            </div>
            <Link href="/creator/my-submissions">
              <Button variant="outline" size="sm" className="text-xs">
                View All Details
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 font-semibold border-y border-slate-200">
                  <tr>
                    <th className="px-6 py-2.5">Campaign</th>
                    <th className="px-6 py-2.5">Platform</th>
                    <th className="px-6 py-2.5">Views</th>
                    <th className="px-6 py-2.5">Earnings</th>
                    <th className="px-6 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mySubmissions.slice(0, 5).map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-900">
                        {sub.campaignTitle}
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-xs font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {sub.platform}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-mono text-slate-700 text-xs">
                        {sub.currentViews.toLocaleString()} views
                      </td>
                      <td className="px-6 py-3 font-mono font-semibold text-emerald-600 text-xs">
                        {sub.status === "approved" || sub.status === "paid" ? (
                          formatCentsToCurrency(sub.estimatedEarnings)
                        ) : (
                          <span className="text-slate-400 font-normal">Pending approval</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={sub.status}>{sub.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Clip Modal */}
      <Modal
        isOpen={selectedCampaign !== null}
        onClose={() => {
          setSelectedCampaign(null);
          setErrorMessage(null);
          setSuccessMessage(null);
        }}
        title={`Submit Clip: ${selectedCampaign?.title || ""}`}
        description="Provide a link to your public video post on an accepted platform."
      >
        {successMessage ? (
          <div className="space-y-4 py-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{successMessage}</p>
              <p className="text-xs text-slate-500 mt-1">
                Your clip has been queued for admin verification.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCampaign(null);
                  setSuccessMessage(null);
                }}
              >
                Close
              </Button>
              <Link href="/creator/my-submissions">
                <Button size="sm">Go to My Submissions</Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex gap-2 items-start">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Platform Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Choose Platform
              </label>
              <div className="flex gap-2">
                {selectedCampaign?.platforms.map((p: Platform) => {
                  const isSelected = selectedPlatform === p;
                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => {
                        setSelectedPlatform(p);
                        setErrorMessage(null);
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Post URL Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Post URL ({selectedPlatform})
              </label>
              <Input
                type="url"
                required
                placeholder={
                  selectedPlatform === "tiktok"
                    ? "https://www.tiktok.com/@username/video/123456789"
                    : selectedPlatform === "instagram"
                    ? "https://www.instagram.com/reel/Cxyz123/"
                    : "https://www.youtube.com/shorts/abcd123"
                }
                value={postUrl}
                onChange={(e) => {
                  setPostUrl(e.target.value);
                  setErrorMessage(null);
                }}
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span>The same URL cannot be submitted to the same campaign twice.</span>
                {postUrl.length > 0 && (
                  <span
                    className={
                      isUrlValid ? "text-emerald-600 font-medium" : "text-amber-600"
                    }
                  >
                    {isUrlValid ? "✓ Valid URL format" : "Invalid post URL"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedCampaign(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isUrlValid || submitMutation.isPending}
              >
                {submitMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                )}
                Submit Video Clip
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
