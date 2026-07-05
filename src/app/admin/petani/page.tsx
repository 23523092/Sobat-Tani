import { getPetaniList } from "@/lib/queries";
import { PetaniTable } from "./PetaniTable";

export const dynamic = "force-dynamic";

export default async function PetaniPage() {
  const petani = await getPetaniList();

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-10">
      <header className="mb-7">
        <span className="text-xs font-700 uppercase tracking-[0.2em] text-harvest-500">Basis Data</span>
        <h1 className="mt-1 font-display text-3xl font-600 text-pine-800">Data Petani</h1>
        <p className="mt-1.5 text-sm text-pine-500">
          {petani.length} petani pada e-RDKK · kelola status keanggotaan
        </p>
      </header>

      <PetaniTable petani={petani} />
    </div>
  );
}
