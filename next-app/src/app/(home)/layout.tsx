import Header from "../../components/layout/Header";
import MobileNav from "../../components/layout/MobileNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <MobileNav />
        {children}
      </body>
    </html>
  );
}
