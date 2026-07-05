"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard,
  Users,
  ReceiptText,
  ArrowUpRight,
  ScanLine,
  UserCheck,
  LogOut,
} from "lucide-react";
import { logoutAction } from "@/app/admin/login/actions";

const NAV = [
  { href: "/admin", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/admin/pendaftar", label: "Verifikasi", icon: UserCheck },
  { href: "/admin/petani", label: "Data Petani", icon: Users },
  { href: "/admin/tebus", label: "Catat Tebus", icon: ScanLine },
  { href: "/admin/transaksi", label: "Riwayat Tebus", icon: ReceiptText },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="flex w-full flex-row gap-1 overflow-x-auto border-b border-pine-100 bg-pine-800 p-3 md:sticky md:top-0 md:h-screen md:w-60 md:flex-col md:gap-1 md:self-start md:overflow-x-visible md:overflow-y-auto md:border-b-0 md:border-r md:p-5">
      <div className="hidden md:mb-6 md:block">
        <Logo className="[&_*]:text-paper" />
      </div>
      <nav className="flex flex-1 flex-row gap-1 md:flex-col">
        {NAV.map((n) => {
          const active = path === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-500 transition ${
                active
                  ? "bg-pine-600 text-paper"
                  : "text-pine-200 hover:bg-pine-700 hover:text-paper"
              }`}
            >
              <n.icon size={17} />
              <span className="hidden md:inline">{n.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-row gap-1 md:mt-auto md:flex-col">
        <Link
          href="/asisten"
          className="flex items-center gap-2 rounded-xl border border-pine-600 px-3.5 py-2.5 text-sm font-500 text-pine-100 transition hover:bg-pine-700"
        >
          <ArrowUpRight size={16} />
          <span className="hidden md:inline">Buka Asisten</span>
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-500 text-pine-300 transition hover:bg-pine-700 hover:text-paper"
          >
            <LogOut size={16} />
            <span className="hidden md:inline">Keluar</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
