import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ProgressProvider } from "@/components/Progress";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: { default: "Books", template: "%s · Books" },
  description: "Two reading lists, Non-fiction and Literature, read in order. Sign in to keep track of what you have read.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6f4" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
};

// Applies the saved theme before first paint, so the page never flashes the wrong one.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ProgressProvider>
          <Header />
          <main>{children}</main>
        </ProgressProvider>
      </body>
    </html>
  );
}
