"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  // Halaman login tampil penuh tanpa sidebar.
  if (path === "/admin/login") {
    return <div className="min-h-screen bg-paper bg-grain">{children}</div>;
  }
  return (
    <div className="flex min-h-screen flex-col bg-paper bg-grain md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
