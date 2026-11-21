import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppProvider } from "@/components/AppProvider";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GrassRoot — Pooled Condo Meal Kits & Guided Cooking",
  description:
    "Unlimited free beginner recipes paired with neighborhood-batched weekly halal meal boxes across Bandar Sunway & Subang Jaya.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var v=localStorage.getItem("color-scheme");if(v==="light"||v==="dark"){document.querySelector('meta[name="color-scheme"]').content=v}else if(v==="system"){document.querySelector('meta[name="color-scheme"]').content="light dark"}}catch(e){}`,
          }}
        />
      </head>
      <body className={`${inter.variable} min-h-screen antialiased`}>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
