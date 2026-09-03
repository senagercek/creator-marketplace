"use client";

import React from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ExternalLink,
  Eye,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { formatCentsToCurrency } from "@/shared/types";

export default function MySubmissionsPage() {
  const mySubmissionsQuery = trpc.submission.mySubmissions.useQuery();
  const meQuery = trpc.auth.me.useQuery();

  const submissions = mySubmissionsQuery.data || [];

  // Summary stats for creator
  const totalEarned = submissions
    .filter((s) => s.status === "approved" || s.status === "paid")
    .reduce((acc, curr) => acc + curr.estimatedEarnings, 0);

  const totalViews = submissions.reduce((acc, curr) => acc + curr.currentViews, 0);

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
          </CardContent>
        </Card>

        <Card className="bg-white">
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
            <p className="text-[11px] text-slate-400 mt-1">
              From approved clip views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <Card>
        <CardContent className="p-0">
          {mySubmissionsQuery.isLoading ? (
            <div className="p-16 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <p className="font-medium">You have not submitted any clips yet.</p>
              <p className="text-xs text-slate-400">
                Browse active brand campaigns and submit your first video URL!
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {sub.campaignTitle}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {sub.platform}
                          </span>
                          <a
                            href={sub.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-mono truncate max-w-xs"
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
                          formatCentsToCurrency(sub.estimatedEarnings)
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
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(sub.createdAt).toLocaleDateString()}
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
  );
}
