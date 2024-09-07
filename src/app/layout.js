import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata = {
  title: "Login",
  description: "Login R&H",
  openGraph: {
    title: "Login",
    description: "Login R&H",
    images: [
      "https://res.cloudinary.com/dbgnyc842/image/upload/v1721753647/kiphxzqvoa66wisrc1qf.jpg",
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
