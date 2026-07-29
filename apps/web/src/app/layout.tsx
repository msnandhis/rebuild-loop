import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Quicksand } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "ReBuild Loop — Recover building materials before demolition",
    template: "%s · ReBuild Loop",
  },
  description:
    "Evidence-led pre-demolition material intelligence for safer reuse decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${inter.variable} ${quicksand.variable} ${plexMono.variable}`}
      data-scroll-behavior="smooth"
      lang="en"
    >
      <body>
        <a
          className="fixed top-3 left-3 z-50 -translate-y-20 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition-transform focus:translate-y-0 focus:outline-2 focus:outline-offset-2 focus:outline-focus"
          href="#main-content"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
