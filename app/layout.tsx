import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Base Beat Tap",
  description: "Drop Kick, Snare, Clap, or Bass beats on Base.",
  applicationName: "Base Beat Tap",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Base Beat Tap",
    description: "Onchain rhythm taps for Base.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#05070b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="base:app_id" content="6a24ea6029b4287dd653e302" />
        <meta
          name="talentapp:project_verification"
          content="a71264b0c69010accce5335867f62713b009aab952fa311cc118add9673e41d801f93ed67094ba872360d230306ee9933c9ec8220cc16b3813eb5eb1c346270e"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
