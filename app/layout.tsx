import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { LocaleProvider } from "@/components/locale-provider";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Venus Makeup Artist | Kuala Lumpur",
  description:
    "Professional bridal, ROM, and event makeup & hairdo services by Venus. Based in Kuala Lumpur, Malaysia.",
  metadataBase: new URL("https://venusmakeupartist.site"),
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Venus Makeup Artist",
    description:
      "Professional bridal, ROM, and event makeup & hairdo services in Kuala Lumpur.",
    url: "https://venusmakeupartist.site",
    siteName: "Venus Makeup Artist",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#f3ece3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jost.variable} ${cormorant.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
