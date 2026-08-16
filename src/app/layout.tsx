import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/auth";
import { AuthNav } from "@/components/auth-nav";
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
        <header className="flex items-center justify-between border-b border-black/10 p-3 dark:border-white/10">
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/">Teams</Link>
            <Link href="/pokedex">Pokédex</Link>
            {showAdminLink && <Link href="/admin">Admin</Link>}
          </nav>
          <AuthNav />
        </header>
        {children}
      </body>
    </html>
  );
}
