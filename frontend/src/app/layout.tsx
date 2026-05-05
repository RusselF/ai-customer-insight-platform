import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Customer Insight AI | Sentiment Analysis Platform",
  description:
    "AI-powered customer sentiment analysis platform. Analyze customer reviews and social media feedback in real-time using machine learning.",
  keywords: ["sentiment analysis", "customer insight", "AI", "NLP", "machine learning"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
