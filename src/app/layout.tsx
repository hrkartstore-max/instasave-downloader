import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "InstaSave — Simple, Private Media Utility",
    template: "%s | InstaSave",
  },
  description: "Check Instagram links and save media you own or are authorized to use. A simple, mobile-friendly experience with privacy in mind.",
  applicationName: "InstaSave",
  keywords: ["Instagram link checker", "save your own media", "Instagram media utility", "local media saver"],
  robots: { index: true, follow: true },
  openGraph: {
    title: "InstaSave — Simple, Private Media Utility",
    description: "A simple way to check links and save media you are authorized to use.",
    type: "website",
    siteName: "InstaSave",
    url: siteUrl,
  },
  twitter: {
    card: "summary",
    title: "InstaSave",
    description: "A simple, privacy-conscious media utility.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7048e8",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
