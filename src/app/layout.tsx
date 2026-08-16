import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/auth";
import { AuthNav } from "@/components/auth-nav";
import { HeaderNav } from "@/components/header-nav";
import { isAdmin } from "@/server/admin";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pokémon Team Builder",
  description: "Browse Pokémon and build teams",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  const showAdminLink = session?.user?.id ? await isAdmin(session.user.id) : false;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-6 border-b border-black/10 bg-[var(--background)] px-4 py-3 dark:border-white/10">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-base font-bold tracking-tight">
              Pokémon Team Builder
            </Link>
            <HeaderNav showAdminLink={showAdminLink} />
          </div>
          <AuthNav />
        </header>
        {children}
      </body>
    </html>
  );
}
