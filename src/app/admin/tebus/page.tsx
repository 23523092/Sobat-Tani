import { getHET, getPetaniByStatus } from "@/lib/queries";
import { TebusForm } from "./TebusForm";

export const dynamic = "force-dynamic";

export default async function TebusPage() {
  const [terdaftar, het] = await Promise.all([
    getPetaniByStatus("Terdaftar"),
    getHET(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-10">
      <header className="mb-7">
        <span className="text-xs font-700 uppercase tracking-[0.2em] text-harvest-500">Loket Kios</span>
        <h1 className="mt-1 font-display text-3xl font-600 text-pine-800">Catat Penebusan</h1>
        <p className="mt-1.5 text-sm text-pine-500">Petugas mencatat penebusan, sisa kuota berkurang dan tersimpan di database.</p>
      </header>

      <TebusForm petani={terdaftar} het={het} />
    </div>
  );
}
