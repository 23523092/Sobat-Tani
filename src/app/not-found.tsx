import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ArrowLeft, Sprout } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper bg-grain px-5">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-pine-50 text-pine-600">
          <Sprout size={30} />
        </span>
        <h1 className="mt-6 font-display text-5xl font-600 text-pine-800">404</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-pine-600">
          Halaman yang Anda cari tidak ditemukan. Mungkin sudah dipindahkan atau tautannya keliru.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-pine-700 px-6 py-3 text-sm font-600 text-paper transition hover:bg-pine-800"
        >
          <ArrowLeft size={16} /> Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
