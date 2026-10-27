import "./globals.css";

export const metadata = {
  title: "AssetMeet · Commercial property in Kerala",
  description:
    "Find commercial space in Kerala before it reaches the market. Scored shortlists for expanding businesses, with owner permission confirmed before every site visit.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "AssetMeet · Commercial property in Kerala",
    description: "Find commercial space in Kerala before it reaches the market.",
    images: ["/og.png"],
  },
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Manrope:wght@600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
