import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

const inter = localFont({
  display: "swap",
  src: "../../public/fonts/inter-latin-variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
});

const quicksand = localFont({
  display: "swap",
  src: "../../public/fonts/quicksand-latin-variable.woff2",
  variable: "--font-quicksand",
  weight: "300 700",
});

const plexMono = localFont({
  display: "swap",
  src: [
    {
      path: "../../public/fonts/ibm-plex-mono-latin-400.woff2",
      weight: "400",
    },
    {
      path: "../../public/fonts/ibm-plex-mono-latin-500.woff2",
      weight: "500",
    },
  ],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: {
    default: "ReBuild Loop — Recover building materials before demolition",
    template: "%s · ReBuild Loop",
  },
  description:
    "Turn site photos into a human-reviewed materials list and recovery plan before demolition.",
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
