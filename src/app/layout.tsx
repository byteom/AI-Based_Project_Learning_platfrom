
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

const fontBody = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const fontHeadline = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-headline",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Project Code - Learn by Building Real-World Projects",
    template: `%s | Project Code`,
  },
  description: "Stop watching tutorials and start building. Project Code offers AI-guided, step-by-step learning paths for building real-world applications.",
  keywords: ["learn to code", "project-based learning", "ai coding assistant", "nextjs projects", "react projects"],
  // Icons are automatically handled by Next.js from icon.svg and apple-icon.svg in app directory
  openGraph: {
    title: "Project Code - Learn by Building Real-World Projects",
    description: "Stop watching tutorials and start building. Project Code offers AI-guided, step-by-step learning paths for building real-world applications.",
    type: "website",
    siteName: "Project Code",
    url: siteUrl,
    // Open Graph image is automatically handled by opengraph-image.tsx in app directory
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Code - Learn by Building Real-World Projects",
    description: "Stop watching tutorials and start building. AI-guided, step-by-step learning paths.",
    // Twitter image is automatically handled by opengraph-image.tsx
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          "font-body antialiased",
          fontBody.variable,
          fontHeadline.variable
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
