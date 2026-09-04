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
} from "lucide-react";
import { formatCentsToCurrency, Platform, PLATFORMS, isValidPlatformUrl } from "@/shared/types";

export default function CreatorBrowsePage() {
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("tiktok");
  const [postUrl, setPostUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeCampaignsQuery = trpc.campaign.listActiveForCreators.useQuery();
  const mySubmissionsQuery = trpc.submission.mySubmissions.useQuery();
  const meQuery = trpc.auth.me.useQuery();

  const utils = trpc.useUtils();
  const submitMutation = trpc.submission.create.useMutation({
    onSuccess: () => {
      setSuccessMessage("Clip submitted successfully! Awaiting brand review.");
      setErrorMessage(null);
      setPostUrl("");
      utils.submission.mySubmissions.invalidate();
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

  const mySubmissions = mySubmissionsQuery.data || [];
  const approvedSubs = mySubmissions.filter(
    (s) => s.status === "approved" || s.status === "paid"
  );
  const totalEarned = approvedSubs.reduce((acc, curr) => acc + curr.estimatedEarnings, 0);
  const totalViews = mySubmissions.reduce((acc, curr) => acc + curr.currentViews, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Active Creator Campaigns
          </h1>
          <p className="text-sm text-slate-500">
            Select an active campaign, submit your published short-form clips, and earn per 1,000 views.
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

      {/* Campaigns Grid */}
      {activeCampaignsQuery.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : !activeCampaignsQuery.data || activeCampaignsQuery.data.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <p className="font-medium">No active campaigns right now.</p>
          <p className="text-xs text-slate-400 mt-1">Check back soon for new brand launches.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeCampaignsQuery.data.map((camp) => {
            // Check if creator has submitted to this campaign
            const userSubsForCamp = mySubmissions.filter((s) => s.campaignId === camp.id);
            const latestSub = userSubsForCamp[0]; // Most recent

            return (
              <Card
                key={camp.id}
                className={`flex flex-col justify-between hover:shadow-md transition-shadow ${
                  latestSub?.status === "approved" ? "border-emerald-200 ring-1 ring-emerald-200/50" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="active" className="text-[11px] capitalize">
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
                  {latestSub && (
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
                      <Button
                        variant="outline"
                        className="gap-1 text-xs"
                        onClick={() => handleOpenSubmitModal(camp)}
                      >
                        <Plus className="h-3 w-3" />
                        <span>Submit Another</span>
                      </Button>
                    </div>
                  ) : latestSub?.status === "pending" ? (
                    <Button
                      variant="outline"
                      className="w-full gap-1.5 text-xs text-slate-600"
                      onClick={() => handleOpenSubmitModal(camp)}
                    >
                      <Plus className="h-3 w-3" />
                      <span>Submit Another Clip</span>
                    </Button>
                  ) : (
                    <Button
                      className="w-full gap-2"
                      onClick={() => handleOpenSubmitModal(camp)}
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Submit Video Clip</span>
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
