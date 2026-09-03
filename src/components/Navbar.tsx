"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Users, Video, ShieldCheck, ChevronDown, Globe } from "lucide-react";
import { useI18n } from "@/i18n/context";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { locale, setLocale, t } = useI18n();

  const meQuery = trpc.auth.me.useQuery();
  const devUsersQuery = trpc.auth.listDevUsers.useQuery();
  const switchUserMutation = trpc.auth.switchUser.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });

  const currentUser = meQuery.data;
  const devUsers = devUsersQuery.data || [];

  const handleSwitchUser = async (userId: string) => {
    setDropdownOpen(false);
    await switchUserMutation.mutateAsync({ userId });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Video className="h-4 w-4" />
            </div>
            <span>{t("appName")}</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {currentUser?.role === "admin" ? (
              <>
                <Link
                  href="/admin"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    pathname.startsWith("/admin")
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t("adminCampaigns")}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/creator"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    pathname === "/creator"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t("browseCampaigns")}
                </Link>
                <Link
                  href="/creator/my-submissions"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    pathname === "/creator/my-submissions"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t("mySubmissions")}
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right Section: Language Switcher + Dev User Switcher */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setLocale("en")}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                locale === "en"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🇬🇧 EN
            </button>
            <button
              onClick={() => setLocale("tr")}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                locale === "tr"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🇹🇷 TR
            </button>
          </div>

          {/* Dev User Switcher */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-xs font-mono text-slate-400">
                {t("devAuth")}
              </span>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {currentUser?.role === "admin" ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                ) : (
                  <Users className="h-3.5 w-3.5 text-emerald-600" />
                )}
                <span>{currentUser ? currentUser.name : t("selectUser")}</span>
                <Badge
                  variant={currentUser?.role === "admin" ? "default" : "secondary"}
                  className="text-[10px] px-1.5 py-0"
                >
                  {currentUser?.role || "guest"}
                </Badge>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 z-40 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                  <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {t("switchDevRole")}
                  </div>
                  <div className="space-y-1">
                    {devUsers.map((user) => {
                      const isSelected = currentUser?.id === user.id;
                      return (
                        <button
                          key={user.id}
                          onClick={() => handleSwitchUser(user.id)}
                          className={`w-full flex items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium text-left transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-slate-900 text-white"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div>
                            <div className="font-semibold">{user.name}</div>
                            <div
                              className={`text-[10px] ${
                                isSelected ? "text-slate-300" : "text-slate-400"
                              }`}
                            >
                              {user.email}
                            </div>
                          </div>
                          <Badge
                            variant={user.role === "admin" ? "default" : "secondary"}
                            className={`text-[10px] px-1.5 ${
                              isSelected ? "bg-slate-800 text-white border-slate-700" : ""
                            }`}
                          >
                            {user.role}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
