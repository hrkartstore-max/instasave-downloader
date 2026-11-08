import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "InstaSave — Authorized Media Downloader", description: "Save media you own or have permission to download. Simple, secure and privacy focused.", metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"), openGraph: { title: "InstaSave", description: "Download media you are authorized to save.", type: "website" }, twitter: { card: "summary_large_image" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
