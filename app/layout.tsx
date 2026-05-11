import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Cloud Cost Decision Notebook",
  description: "Fixture-first deploy tradeoff notebook for early-stage cloud decisions."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
