import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/trpc/Provider";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Creator Marketplace - Paid Clipping Platform",
  description: "Next.js 15, tRPC v11, Drizzle ORM, and PostgreSQL Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <TRPCProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </TRPCProvider>
      </body>
    </html>
  );
}
