"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { Badge } from "./ui/badge";
import {
  Users,
  Video,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  Check,
  Sparkles,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false);
    await switchUserMutation.mutateAsync({ userId });
  };

  const isAdmin = currentUser?.role === "admin";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3.5 sm:px-6 lg:px-8 gap-2 sm:gap-6">
        {/* Left: Brand + Desktop Nav */}
        <div className="flex items-center gap-3 sm:gap-6 min-w-0 shrink-0">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          {/* Logo / Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-slate-900 tracking-tight shrink-0 hover:opacity-90 transition-opacity"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
              <Video className="h-4 w-4" />
            </div>
            <span className="text-base sm:text-lg font-extrabold tracking-tight">
              ClipMarket
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {isAdmin ? (
              <Link
                href="/admin"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname.startsWith("/admin")
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Admin Campaigns
              </Link>
            ) : (
              <>
                <Link
                  href="/creator"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    pathname === "/creator"
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  Browse Campaigns
                </Link>
                <Link
                  href="/creator/my-submissions"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    pathname === "/creator/my-submissions"
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  My Submissions
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right: Dev User Switcher */}
        <div className="relative shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="hidden lg:inline-block text-[11px] font-mono font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              DEV AUTH
            </span>

            {/* User Switcher Pill Button */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="group flex items-center gap-1.5 sm:gap-2 rounded-full sm:rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 px-2.5 py-1.5 sm:px-3 text-xs font-medium text-slate-700 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
            >
              {isAdmin ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shrink-0">
                  <Users className="h-3.5 w-3.5" />
                </div>
              )}

              {/* User Name: Shortened on mobile, full on desktop */}
              <span className="hidden sm:inline font-semibold text-slate-900 truncate max-w-[120px] lg:max-w-none">
                {currentUser ? currentUser.name : "Select User"}
              </span>
              <span className="inline sm:hidden font-semibold text-slate-900">
                {currentUser ? currentUser.name.split(" ")[0] : "User"}
              </span>

              {/* Role Badge */}
              <Badge
                variant={isAdmin ? "default" : "secondary"}
                className="text-[10px] px-1.5 py-0 uppercase font-bold tracking-wide"
              >
                {currentUser?.role || "guest"}
              </Badge>

              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-transform ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Dev Switcher Dropdown Menu */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 z-40 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95">
                <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100 pb-2 mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Switch Test User
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Signed Cookie Auth
                  </span>
                </div>

                <div className="space-y-1">
                  {devUsers.map((user) => {
                    const isSelected = currentUser?.id === user.id;
                    const isUserAdmin = user.role === "admin";
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleSwitchUser(user.id)}
                        className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 text-white shadow-xs"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                              isSelected
                                ? "bg-slate-800 text-white"
                                : isUserAdmin
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold truncate">
                              {user.name}
                            </div>
                            <div
                              className={`text-[10px] truncate ${
                                isSelected ? "text-slate-300" : "text-slate-400"
                              }`}
                            >
                              {user.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <Badge
                            variant={isUserAdmin ? "default" : "secondary"}
                            className={`text-[10px] px-1.5 py-0 uppercase ${
                              isSelected
                                ? "bg-slate-800 text-white border-slate-700"
                                : ""
                            }`}
                          >
                            {user.role}
                          </Badge>
                          {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Drawer / Collapsible Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-slate-50/95 px-4 py-3 space-y-1 animate-in slide-in-from-top-2">
          {isAdmin ? (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                pathname.startsWith("/admin")
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>Admin Campaigns</span>
              <ShieldCheck className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/creator"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname === "/creator"
                    ? "bg-slate-900 text-white font-semibold shadow-xs"
                    : "text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>Browse Campaigns</span>
                <Video className="h-4 w-4" />
              </Link>
              <Link
                href="/creator/my-submissions"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname === "/creator/my-submissions"
                    ? "bg-slate-900 text-white font-semibold shadow-xs"
                    : "text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>My Submissions</span>
                <Users className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
