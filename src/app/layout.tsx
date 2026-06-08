import type { Metadata } from "next";

import TimeThemeProvider from "@/components/TimeThemeProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Serena's Knowledge Graph",
  description: "A public personal knowledge graph for articles, thoughts, and tags",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-theme="day" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,1..1000&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var h=new Date().getHours(),p="day";if((h>=5&&h<8)||(h>=17&&h<20))p="golden";else if(h>=20||h<5)p="night";document.documentElement.dataset.theme=p;})();`,
          }}
        />
      </head>
      <body className="h-full overflow-hidden">
        <TimeThemeProvider>{children}</TimeThemeProvider>
      </body>
    </html>
  );
}
