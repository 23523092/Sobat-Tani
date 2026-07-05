import { getPetaniList } from "@/lib/queries";
import { UserCheck, Clock, XCircle, type LucideIcon } from "lucide-react";
import { PendaftarList } from "./PendaftarList";

export const dynamic = "force-dynamic";

export default async function PendaftarPage() {
  const all = await getPetaniList();
  const pending = all.filter((p) => p.status === "Pending");
  const ditolak = all.filter((p) => p.status === "Ditolak");

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-10">
      <header className="mb-7">
        <span className="text-xs font-700 uppercase tracking-[0.2em] text-harvest-500">
          Manajemen Pendaftar
        </span>
        <h1 className="mt-1 font-display text-3xl font-600 text-pine-800">Verifikasi Pendaftar</h1>
        <p className="mt-1.5 text-sm text-pine-500">
          Tinjau pengajuan petani, setujui dengan menetapkan alokasi kuota, atau tolak bila tak memenuhi syarat.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatMini icon={Clock} label="Menunggu" value={pending.length} tone="harvest" />
        <StatMini icon={UserCheck} label="Disetujui" value={all.filter((p) => p.status === "Terdaftar").length} tone="pine" />
        <StatMini icon={XCircle} label="Ditolak" value={ditolak.length} tone="clay" />
      </div>

      <PendaftarList pending={pending} ditolak={ditolak} />
    </div>
  );
}

function StatMini({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: "harvest" | "pine" | "clay";
}) {
  const toneCls =
    tone === "harvest"
      ? "bg-harvest-100 text-harvest-600"
      : tone === "clay"
      ? "bg-clay/10 text-clay"
      : "bg-pine-50 text-pine-600";
  return (
    <div className="rounded-2xl border border-pine-100 bg-white/70 p-4 shadow-card">
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${toneCls}`}>
        <Icon size={17} />
      </span>
      <div className="mt-2.5 font-display text-2xl font-600 leading-none text-pine-800">{value}</div>
      <div className="mt-1 text-xs font-500 text-pine-500">{label}</div>
    </div>
  );
}
