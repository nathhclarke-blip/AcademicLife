import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Academic Life",
  description: "Academic structure and scheduling command centre"
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/billing", label: "Billing" }
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="grid min-h-screen md:grid-cols-[240px_1fr]">
          <aside className="border-r border-slate-200 bg-white p-6">
            <h1 className="text-xl font-semibold">Academic Life</h1>
            <nav className="mt-8 space-y-3">
              {navItems.map((item) => (
                <Link className="block rounded-md px-3 py-2 hover:bg-slate-100" key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="p-6 md:p-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
