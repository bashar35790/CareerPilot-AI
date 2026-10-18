import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/store/auth-context";
import { ToastProvider } from "@/components/ui";
import { Navbar, Footer } from "@/components/layout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CareerPilot AI - Career Alignment & Skill Gap Platform",
  description:
    "AI-powered resume and job matching platform with skill gap analysis, explainable qualification scores, and personalized career roadmaps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} min-h-full flex flex-col antialiased bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900`}
      >
        <AuthProvider>
          <ToastProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <div className="flex-1 flex flex-col">{children}</div>
              <Footer />
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
