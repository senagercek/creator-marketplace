"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShieldCheck, Video, ArrowRight, Loader2 } from "lucide-react";
import { useI18n } from "@/i18n/context";

export default function HomePage() {
  const router = useRouter();
  const { t } = useI18n();
  const meQuery = trpc.auth.me.useQuery();
  const switchUserMutation = trpc.auth.switchUser.useMutation();

  useEffect(() => {
    if (meQuery.data) {
      if (meQuery.data.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/creator");
      }
    }
  }, [meQuery.data, router]);

  const handleSelectRole = async (userId: string, targetPath: string) => {
    await switchUserMutation.mutateAsync({ userId });
    router.push(targetPath);
  };

  if (meQuery.isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          {t("landingTitle")}
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          {t("landingSubtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Admin Portal Card */}
        <Card className="hover:border-slate-400 transition-all shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{t("adminPortal")}</CardTitle>
                <CardDescription>{t("adminPortalDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              {t("adminPortalContent")}
            </p>
            <Button
              className="w-full justify-between"
              onClick={() => handleSelectRole("usr_admin", "/admin")}
            >
              <span>{t("continueAsAdmin")}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Creator Portal Card */}
        <Card className="hover:border-slate-400 transition-all shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <Video className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{t("creatorPortal")}</CardTitle>
                <CardDescription>{t("creatorPortalDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              {t("creatorPortalContent")}
            </p>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => handleSelectRole("usr_creator_1", "/creator")}
            >
              <span>{t("continueAsCreator")}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
