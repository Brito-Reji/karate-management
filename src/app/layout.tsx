import { Inter } from "next/font/google";
import QueryProvider from "@/components/QueryProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Karate Management System",
  description: "Manage students, belts, and dojos with precision",
};

/** Pin functions next to a Mumbai Atlas cluster (change if Atlas is elsewhere). */
export const preferredRegion = "bom1";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full`}>
      <body
        suppressHydrationWarning
        className="min-h-full overflow-x-hidden"
        style={{ fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif" }}
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
