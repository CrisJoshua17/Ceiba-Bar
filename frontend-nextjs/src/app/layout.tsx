import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Ceiba Bar - Premium Delivery",
  description: "Disfruta de las mejores bebidas y snacks directamente en tu puerta.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${ubuntu.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-ubuntu bg-ceiba-paper text-ceiba-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

