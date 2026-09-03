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
} from "lucide-react";
import { formatCentsToCurrency, Platform, PLATFORMS, isValidPlatformUrl } from "@/shared/types";

export default function CreatorBrowsePage() {
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("tiktok");
  const [postUrl, setPostUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeCampaignsQuery = trpc.campaign.listActiveForCreators.useQuery();
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
          </Button>
        </Link>
      </div>

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
          {activeCampaignsQuery.data.map((camp) => (
            <Card key={camp.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
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

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    Ends: {new Date(camp.endsAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <Button
                  className="w-full gap-2"
                  onClick={() => handleOpenSubmitModal(camp)}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit Video Clip</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
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
