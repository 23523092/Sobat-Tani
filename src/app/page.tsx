import Link from "next/link";
import { Logo } from "@/components/Logo";
import { EDUKASI, formatRupiah, statistikGlobal } from "@/lib/data";
import {
  ArrowRight,
  ShieldCheck,
  MessageCircle,
  Sprout,
  ScanLine,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  const stat = statistikGlobal();

  return (
    <main className="min-h-screen bg-paper bg-grain">
      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-pine-100/70 bg-paper/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Logo />
          <div className="hidden items-center gap-8 text-sm font-500 text-pine-600 md:flex">
            <a href="#cara" className="transition hover:text-pine-800">Cara Kerja</a>
            <a href="#edukasi" className="transition hover:text-pine-800">Edukasi</a>
            <Link href="/admin" className="transition hover:text-pine-800">Petugas</Link>
          </div>
          <Link
            href="/asisten"
            className="group inline-flex items-center gap-1.5 rounded-full bg-pine-700 px-4 py-2 text-sm font-600 text-paper transition hover:bg-pine-800"
          >
            Cek Kuota
            <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative mx-auto max-w-6xl px-5 pb-10 pt-14 md:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-pine-200 bg-white/60 px-3 py-1 text-xs font-600 text-pine-600">
              <ShieldCheck size={13} className="text-harvest-500" />
              Terhubung skema e-RDKK · i-Pubers
            </span>
            <h1 className="mt-5 font-display text-[42px] font-600 leading-[1.05] tracking-tight text-pine-800 text-balance md:text-[58px]">
              Kuota pupuk Anda,
              <br />
              <span className="text-harvest-500">satu pesan</span> jaraknya.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-pine-600">
              Tak perlu antre atau bingung formulir. Sapa Asisten Tani, masukkan NIK,
              dan langsung tahu sisa jatah pupuk subsidi Anda—lengkap dengan tuntunan
              cara memupuk yang benar.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/asisten"
                className="group inline-flex items-center gap-2 rounded-full bg-pine-700 px-6 py-3 text-sm font-600 text-paper shadow-lift transition hover:bg-pine-800"
              >
                <MessageCircle size={17} />
                Mulai Cek Kuota
                <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#cara"
                className="inline-flex items-center gap-2 rounded-full border border-pine-200 px-6 py-3 text-sm font-600 text-pine-700 transition hover:border-pine-300 hover:bg-white/50"
              >
                Pelajari dulu
              </a>
            </div>
          </div>

          {/* Signature: chat + kuota preview card */}
          <div className="animate-fade-up [animation-delay:120ms]">
            <ChatPreview />
          </div>
        </div>

        {/* stat strip */}
        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-pine-100 bg-pine-100 shadow-card sm:grid-cols-4">
          {[
            { k: stat.totalPetani.toString(), v: "Petani terdaftar" },
            { k: (stat.totalKuota / 1000).toFixed(1) + " ton", v: "Total alokasi" },
            { k: (stat.tertebus / 1000).toFixed(1) + " ton", v: "Sudah ditebus" },
            { k: formatRupiah(stat.nilaiTransaksi), v: "Nilai transaksi" },
          ].map((s) => (
            <div key={s.v} className="bg-paper px-5 py-5">
              <div className="font-display text-xl font-600 text-pine-800">{s.k}</div>
              <div className="mt-0.5 text-xs font-500 text-pine-500">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CARA KERJA */}
      <section id="cara" className="mx-auto max-w-6xl px-5 py-16">
        <SectionHead eyebrow="Tiga langkah" title="Sesederhana mengobrol" />
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {[
            { i: ScanLine, t: "Masukkan NIK", d: "Ketik NIK 16 digit atau nomor telepon yang terdaftar di kelompok tani Anda." },
            { i: Sprout, t: "Lihat sisa kuota", d: "Sistem menampilkan jatah Urea, NPK, dan Organik yang masih bisa Anda tebus." },
            { i: BookOpen, t: "Dapat tuntunan", d: "Asisten menjelaskan dosis pupuk, syarat, dan cara menebus di kios resmi." },
          ].map((s, i) => (
            <div key={s.t} className="group relative rounded-2xl border border-pine-100 bg-white/60 p-6 shadow-card transition hover:shadow-lift">
              <span className="absolute right-5 top-5 font-mono text-xs text-pine-300">0{i + 1}</span>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-pine-50 text-pine-600 transition group-hover:bg-pine-700 group-hover:text-harvest-300">
                <s.i size={20} />
              </span>
              <h3 className="mt-4 font-display text-lg font-600 text-pine-800">{s.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-pine-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* EDUKASI */}
      <section id="edukasi" className="border-y border-pine-100 bg-sage/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionHead
            eyebrow="Belajar sambil mengurus"
            title="Pupuk tepat, panen meningkat"
            sub="Tema edukasi menyatu dalam layanan—setiap petani yang bertanya juga belajar."
          />
          <div className="mt-9 grid gap-5 lg:grid-cols-3">
            {/* Syarat */}
            <div className="rounded-2xl border border-pine-100 bg-paper p-6 shadow-card">
              <h3 className="font-display text-lg font-600 text-pine-800">Syarat penerima subsidi</h3>
              <ul className="mt-4 space-y-2.5">
                {EDUKASI.syaratSubsidi.map((s) => (
                  <li key={s} className="flex gap-2.5 text-sm leading-snug text-pine-600">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-harvest-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            {/* HET */}
            <div className="rounded-2xl border border-pine-100 bg-paper p-6 shadow-card">
              <h3 className="font-display text-lg font-600 text-pine-800">Harga Eceran Tertinggi</h3>
              <p className="mt-1.5 text-xs text-pine-500">Bayar tunai di kios resmi—bukan lewat chat.</p>
              <div className="mt-4 space-y-3">
                {(Object.keys(EDUKASI.het) as Array<keyof typeof EDUKASI.het>).map((j) => (
                  <div key={j} className="flex items-baseline justify-between border-b border-dashed border-pine-100 pb-2.5">
                    <span className="text-sm font-500 text-pine-700">{j}</span>
                    <span className="font-mono text-sm font-500 text-pine-800">{formatRupiah(EDUKASI.het[j])}<span className="text-pine-400">/kg</span></span>
                  </div>
                ))}
              </div>
            </div>
            {/* Tips */}
            <div className="rounded-2xl border border-pine-700 bg-pine-700 p-6 text-paper shadow-card">
              <h3 className="font-display text-lg font-600 text-harvest-200">Tips dari penyuluh</h3>
              <ul className="mt-4 space-y-3">
                {EDUKASI.tips.map((t, i) => (
                  <li key={t} className="flex gap-3 text-sm leading-snug text-pine-100">
                    <span className="font-mono text-xs text-harvest-300">{i + 1}</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h2 className="mx-auto max-w-xl font-display text-3xl font-600 leading-tight text-pine-800 text-balance md:text-4xl">
          Siap mengecek jatah pupuk Anda?
        </h2>
        <Link
          href="/asisten"
          className="group mt-7 inline-flex items-center gap-2 rounded-full bg-harvest-400 px-7 py-3.5 text-sm font-700 text-pine-800 shadow-lift transition hover:bg-harvest-300"
        >
          Buka Asisten Tani
          <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-pine-100 bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-pine-500 sm:flex-row">
          <Logo />
          <p className="text-center text-xs">
            Prototipe layanan pupuk subsidi · Data demo fiktif · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </main>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="max-w-xl">
      <span className="text-xs font-700 uppercase tracking-[0.2em] text-harvest-500">{eyebrow}</span>
      <h2 className="mt-2 font-display text-3xl font-600 leading-tight text-pine-800 text-balance md:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-[15px] leading-relaxed text-pine-600">{sub}</p>}
    </div>
  );
}

function ChatPreview() {
  return (
    <div className="rounded-[26px] border border-pine-100 bg-white/70 p-3 shadow-lift backdrop-blur">
      <div className="rounded-[18px] bg-pine-800 p-5">
        {/* bubble user */}
        <div className="mb-3 flex justify-end">
          <div className="max-w-[78%] rounded-2xl rounded-br-md bg-harvest-400 px-3.5 py-2 font-mono text-[13px] text-pine-800">
            1371042503780001
          </div>
        </div>
        {/* bubble asisten */}
        <div className="flex justify-start">
          <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-pine-600 px-3.5 py-3 text-[13px] leading-relaxed text-pine-50">
            Halo <b>Bujang Salim</b> 🌾 Berikut sisa kuota Anda:
            <div className="mt-3 space-y-2.5">
              <KuotaBar label="Urea" sisa={140} total={240} />
              <KuotaBar label="NPK" sisa={180} total={180} />
              <KuotaBar label="Organik" sisa={120} total={300} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KuotaBar({ label, sisa, total }: { label: string; sisa: number; total: number }) {
  const pct = Math.round((sisa / total) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="font-600 text-pine-100">{label}</span>
        <span className="font-mono text-harvest-200">{sisa}/{total} kg</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-pine-800/60">
        <div
          className="h-full origin-left animate-grow-bar rounded-full bg-harvest-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
