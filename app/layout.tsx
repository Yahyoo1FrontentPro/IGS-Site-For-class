import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";

export const metadata: Metadata = {
  title: "MYP 3 Activity Hub • International GoldStars School",
  description:
    "Live Solo Standings, Weekly Awards, Homework, Attendance Roll-Call, Classroom TV Mode & Daily Activity Tracker for International GoldStars School MYP 3 (Class Leaders: Yahyo & Fazliya).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
