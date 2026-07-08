import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Faq } from "@/components/Faq";
import { formatRupiah } from "@/lib/data";
import { getEdukasi, statistikGlobal } from "@/lib/queries";
import {
  ArrowRight,
  ShieldCheck,
  MessageCircle,
  Sprout,
  ScanLine,
  BookOpen,
  CheckCircle2,
  UserPlus,
  Clock,
  MapPinned,
  FileWarning,
  LayoutDashboard,
  UserCheck,
  Receipt,
  BarChart3,
  Bot,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [stat, edu] = await Promise.all([statistikGlobal(), getEdukasi()]);
  const hetKeys = Object.keys(edu.het) as Array<keyof typeof edu.het>;

  return (
    <main className="min-h-screen bg-paper bg-grain">
      {/* NAV */}
      <header className="sticky top-0 z-30 transform-gpu border-b border-pine-100/70 bg-paper/80 backdrop-blur-md [will-change:transform]">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Logo />
          <div className="hidden items-center gap-8 text-sm font-500 text-pine-600 md:flex">
            <a href="#cara" className="transition hover:text-pine-800">Cara Kerja</a>
            <a href="#sistem" className="transition hover:text-pine-800">Sistem</a>
            <a href="#edukasi" className="transition hover:text-pine-800">Edukasi</a>
            <a href="#faq" className="transition hover:text-pine-800">FAQ</a>
            <Link href="/daftar" className="transition hover:text-pine-800">Daftar</Link>
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
              dan langsung tahu sisa jatah pupuk subsidi Anda, lengkap dengan tuntunan
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
              <Link
                href="/daftar"
                className="inline-flex items-center gap-2 rounded-full border border-pine-200 px-6 py-3 text-sm font-600 text-pine-700 transition hover:border-pine-300 hover:bg-white/50"
              >
                <UserPlus size={16} />
                Daftar sebagai penerima
              </Link>
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

        {/* trust strip */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 opacity-80">
          <span className="text-xs font-600 uppercase tracking-[0.15em] text-pine-400">Selaras dengan</span>
          {["e-RDKK", "i-Pubers", "Kartu Tani", "HET Permentan"].map((t) => (
            <span key={t} className="text-sm font-700 text-pine-500">{t}</span>
          ))}
        </div>
      </section>

      {/* MASALAH → SOLUSI */}
      <section className="border-y border-pine-100 bg-white/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionHead
            eyebrow="Kenapa ini penting"
            title="Menyalurkan subsidi seharusnya tidak menyulitkan"
            sub="Tiga hambatan klasik penyaluran pupuk subsidi, dan bagaimana Kios Tani Digital menuntaskannya."
          />
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {[
              {
                i: Clock,
                m: "Antre & informasi simpang siur",
                s: "Petani tak lagi menebak jatahnya. Cek sisa kuota kapan saja lewat chat, tanpa datang ke kantor.",
              },
              {
                i: FileWarning,
                m: "Data pendaftar sulit diverifikasi",
                s: "Petugas mengelola pengajuan dalam satu panel: setujui, tetapkan alokasi, atau tolak, semuanya terekam rapi.",
              },
              {
                i: MapPinned,
                m: "Penyaluran susah dipantau",
                s: "Setiap penebusan terekam otomatis dengan waktu & kios, jadi distribusi transparan dan bisa diaudit.",
              },
            ].map((c) => (
              <div key={c.m} className="rounded-2xl border border-pine-100 bg-paper p-6 shadow-card">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-clay/10 text-clay">
                  <c.i size={20} />
                </span>
                <h3 className="mt-4 font-display text-lg font-600 text-pine-800">{c.m}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-pine-600">{c.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CARA KERJA */}
      <section id="cara" className="mx-auto max-w-6xl px-5 py-16">
        <SectionHead eyebrow="Untuk petani · tiga langkah" title="Sesederhana mengobrol" />
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

      {/* SATU SISTEM, DUA SISI */}
      <section id="sistem" className="border-y border-pine-100 bg-pine-800 text-paper">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="max-w-xl">
            <span className="text-xs font-700 uppercase tracking-[0.2em] text-harvest-300">Satu sistem, dua sisi</span>
            <h2 className="mt-2 font-display text-3xl font-600 leading-tight text-paper text-balance md:text-4xl">
              Mudah untuk petani, terkendali untuk petugas
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-pine-100">
              Bukan sekadar chatbot. Di baliknya ada sistem informasi manajemen (MIS) lengkap
              yang dipakai petugas kios untuk mengelola seluruh alur distribusi.
            </p>
          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-2">
            {/* sisi petani */}
            <div className="rounded-2xl border border-pine-600 bg-pine-700/60 p-6">
              <div className="flex items-center gap-2 text-harvest-200">
                <Bot size={18} />
                <h3 className="font-display text-lg font-600">Sisi Petani</h3>
              </div>
              <ul className="mt-4 space-y-3">
                {[
                  "Cek sisa kuota via NIK/telepon lewat Asisten Tani",
                  "Tanya dosis, syarat, cara menebus, dijawab AI",
                  "Daftar sebagai penerima subsidi secara mandiri",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5 text-sm leading-snug text-pine-50">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-harvest-300" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            {/* sisi petugas */}
            <div className="rounded-2xl border border-pine-600 bg-pine-700/60 p-6">
              <div className="flex items-center gap-2 text-harvest-200">
                <LayoutDashboard size={18} />
                <h3 className="font-display text-lg font-600">Panel Petugas (MIS)</h3>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { i: UserCheck, t: "Verifikasi pendaftar" },
                  { i: Receipt, t: "Catat penebusan" },
                  { i: BarChart3, t: "Dashboard penyerapan" },
                  { i: ShieldCheck, t: "Audit trail transaksi" },
                ].map((f) => (
                  <div key={f.t} className="flex items-center gap-2 rounded-xl bg-pine-800/60 px-3 py-2.5 text-sm font-500 text-pine-50">
                    <f.i size={15} className="text-harvest-300" />
                    {f.t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EDUKASI */}
      <section id="edukasi" className="border-b border-pine-100 bg-sage/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionHead
            eyebrow="Belajar sambil mengurus"
            title="Pupuk tepat, panen meningkat"
            sub="Tema edukasi menyatu dalam layanan, setiap petani yang bertanya juga belajar."
          />
          <div className="mt-9 grid gap-5 lg:grid-cols-3">
            {/* Syarat */}
            <div className="rounded-2xl border border-pine-100 bg-paper p-6 shadow-card">
              <h3 className="font-display text-lg font-600 text-pine-800">Syarat penerima subsidi</h3>
              <ul className="mt-4 space-y-2.5">
                {edu.syaratSubsidi.map((s) => (
                  <li key={s} className="flex gap-2.5 text-sm leading-snug text-pine-600">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-harvest-500" />
                    {s}
                  </li>
                ))}
                {edu.syaratSubsidi.length === 0 && (
                  <li className="text-sm text-pine-400">Data belum tersedia.</li>
                )}
              </ul>
            </div>
            {/* HET */}
            <div className="rounded-2xl border border-pine-100 bg-paper p-6 shadow-card">
              <h3 className="font-display text-lg font-600 text-pine-800">Harga Eceran Tertinggi</h3>
              <p className="mt-1.5 text-xs text-pine-500">Bayar tunai di kios resmi, bukan lewat chat.</p>
              <div className="mt-4 space-y-3">
                {hetKeys.map((j) => (
                  <div key={j} className="flex items-baseline justify-between border-b border-dashed border-pine-100 pb-2.5">
                    <span className="text-sm font-500 text-pine-700">{j}</span>
                    <span className="font-mono text-sm font-500 text-pine-800">
                      {formatRupiah(edu.het[j])}
                      <span className="text-pine-400">/kg</span>
                    </span>
                  </div>
                ))}
                {hetKeys.length === 0 && <p className="text-sm text-pine-400">Data belum tersedia.</p>}
              </div>
            </div>
            {/* Tips */}
            <div className="rounded-2xl border border-pine-700 bg-pine-700 p-6 text-paper shadow-card">
              <h3 className="font-display text-lg font-600 text-harvest-200">Tips dari penyuluh</h3>
              <ul className="mt-4 space-y-3">
                {edu.tips.map((t, i) => (
                  <li key={t} className="flex gap-3 text-sm leading-snug text-pine-100">
                    <span className="font-mono text-xs text-harvest-300">{i + 1}</span>
                    {t}
                  </li>
                ))}
                {edu.tips.length === 0 && <li className="text-sm text-pine-200">Data belum tersedia.</li>}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-16">
        <SectionHead eyebrow="Pertanyaan umum" title="Hal yang sering ditanyakan" />
        <Faq />
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20 text-center">
        <div className="rounded-3xl border border-pine-100 bg-white/60 px-6 py-14 shadow-card">
          <h2 className="mx-auto max-w-xl font-display text-3xl font-600 leading-tight text-pine-800 text-balance md:text-4xl">
            Siap mengecek jatah pupuk Anda?
          </h2>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/asisten"
              className="group inline-flex items-center gap-2 rounded-full bg-harvest-400 px-7 py-3.5 text-sm font-700 text-pine-800 shadow-lift transition hover:bg-harvest-300"
            >
              Buka Asisten Tani
              <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/daftar"
              className="inline-flex items-center gap-2 rounded-full border border-pine-300 px-7 py-3.5 text-sm font-700 text-pine-700 transition hover:bg-white/60"
            >
              Belum terdaftar? Daftar di sini
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-pine-100 bg-paper">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Logo />
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-pine-500">
                Layanan digital verifikasi, distribusi, dan edukasi pupuk subsidi berbasis
                asisten cerdas.
              </p>
            </div>
            <FooterCol
              title="Layanan"
              links={[
                { t: "Cek Kuota", href: "/asisten" },
                { t: "Daftar Penerima", href: "/daftar" },
                { t: "Edukasi", href: "/#edukasi" },
              ]}
            />
            <FooterCol
              title="Informasi"
              links={[
                { t: "Cara Kerja", href: "/#cara" },
                { t: "FAQ", href: "/#faq" },
                { t: "Sistem", href: "/#sistem" },
              ]}
            />
            <FooterCol
              title="Internal"
              links={[{ t: "Portal Petugas", href: "/admin" }]}
            />
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-pine-100 pt-6 text-xs text-pine-400 sm:flex-row">
            <p>© {new Date().getFullYear()} Kios Tani Digital · Layanan Pupuk Subsidi</p>
            <p>Dibangun untuk transparansi penyaluran subsidi.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FooterCol({ title, links }: { title: string; links: { t: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-700 uppercase tracking-[0.15em] text-pine-400">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.t}>
            <Link href={l.href} className="text-sm font-500 text-pine-600 transition hover:text-pine-800">
              {l.t}
            </Link>
          </li>
        ))}
      </ul>
    </div>
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
        {/* bubble asisten (ilustrasi) */}
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
