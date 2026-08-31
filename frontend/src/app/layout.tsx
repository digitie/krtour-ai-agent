import type { Metadata } from "next";

import { QueryProvider } from "@/components/QueryProvider";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Korea Travel Concierge",
  description: "유튜브로 찾는 한국 여행지",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="font-sans">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
