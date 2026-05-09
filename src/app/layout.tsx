import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/trpc";
import { ThemeProvider } from "@/components/providers/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Diffy | AI Code Review",
    template: "%s | Diffy",
  },
  description:
    "Automated AI-powered code reviews that catch bugs, security issues, and maintainability problems before they reach production.",
  keywords: [
    "code review",
    "AI code review",
    "GitHub",
    "pull request",
    "automated review",
    "security scanning",
    "bug detection",
    "Next.js",
    "TypeScript",
  ],
  authors: [{ name: "Diffy" }],
  creator: "Diffy",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Diffy",
    title: "Diffy | AI Code Review",
    description:
      "Automated AI-powered code reviews that catch bugs, security issues, and maintainability problems before they reach production.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Diffy | AI Code Review",
    description:
      "Automated AI-powered code reviews that catch bugs, security issues, and maintainability problems before they reach production.",
  },
  icons: {
    icon: [
      { url: "/logo.svg", media: "(prefers-color-scheme: light)" },
      { url: "/logo-dark.svg", media: "(prefers-color-scheme: dark)" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TRPCProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
