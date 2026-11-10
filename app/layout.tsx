import "./globals.css";
import "./apple.css";
import "./highway.css";
import "./market-dashboard.css";
import "./landing.css";
import "./workspace.css";
import { siteUrl } from "../lib/site-url";

export const metadata = {
  metadataBase: new URL(siteUrl() ?? "http://localhost:3000"),
  title: "AssetMeet — Property Intelligence & Brokerage",
  description:
    "AssetMeet connects properties in Kerala with the businesses and people who need them. List a property or post a requirement, free to start, private by default.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "AssetMeet — Property Intelligence & Brokerage",
    description: "Every building is an asset. Every requirement is an opportunity.",
    images: ["/og.png"],
  },
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
