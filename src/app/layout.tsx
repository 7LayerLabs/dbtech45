import type { Metadata, Viewport } from "next";
import {
  Oswald,
  Special_Elite,
  Permanent_Marker,
  Playfair_Display,
  UnifrakturMaguntia,
  Zilla_Slab,
} from "next/font/google";
import "./globals.css";
import "./brand.css";

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const specialElite = Special_Elite({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400"],
});

const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  variable: "--font-sharpie",
  display: "swap",
  weight: ["400"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-editorial",
  display: "swap",
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
});

const unifraktur = UnifrakturMaguntia({
  subsets: ["latin"],
  variable: "--font-blackletter",
  display: "swap",
  weight: ["400"],
});

const zilla = Zilla_Slab({
  subsets: ["latin"],
  variable: "--font-slab",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "DBTech45, Fueled by Caffeine and Chaos",
  description:
    "Derek Bobola. Dad of 7. Futures trader. Restaurant owner. Self-taught builder running a swarm of AI agents. Shipping daily.",
};

export const viewport: Viewport = {
  themeColor: "#F7E79A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${oswald.variable} ${specialElite.variable} ${permanentMarker.variable} ${playfair.variable} ${unifraktur.variable} ${zilla.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
