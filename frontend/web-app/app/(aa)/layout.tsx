import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";

export const metadata: Metadata = {
  title: "EventHub | Book the most trusted events across Africa",
  description: "Discover curated events, concerts, conferences, and nightlife experiences. Reserve seats, unlock presales, and follow your favourite organizers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <><Header />
          <main className="min-h-screen bg-background">{children}</main>
          <Footer /></>
          
       
  );
}
