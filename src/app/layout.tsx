import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AZ Architects — Enterprise ERP",
  description:
    "Project management, procurement, inventory, client billing and secure document management for AZ Architects.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
