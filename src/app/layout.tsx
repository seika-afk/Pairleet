import type { Metadata } from "next";
import {PT_Sans} from "next/font/google"

import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";


const pt_sans= PT_Sans({
subsets:['latin'],
weight:['400','700'],

})

export const metadata: Metadata = {
  title: "Pairleet",
  description: "Collaborative Leetcode",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
	  <ClerkProvider>
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", pt_sans.className,"bg-white dark:bg-[#313338]")}
    >
      <body className="min-h-full flex flex-col">
<ThemeProvider
	 attribute="class"
            defaultTheme="dark"
            enableSystem={false} 
	storageKey="pairleet-theme"
	
>

      {children}
    
</ThemeProvider>
      </body>

      </html>
      </ClerkProvider>
  );
}
