"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Di produksi: kirim ke layanan logging.
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-paper bg-grain px-5">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-clay/10 text-clay">
          <AlertTriangle size={28} />
        </span>
        <h1 className="mt-6 font-display text-2xl font-600 text-pine-800">Terjadi kendala</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-pine-600">
          Maaf, sistem mengalami gangguan sesaat. Silakan coba lagi.
        </p>
        <button
          onClick={reset}
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-pine-700 px-6 py-3 text-sm font-600 text-paper transition hover:bg-pine-800"
        >
          <RotateCcw size={16} /> Coba lagi
        </button>
      </div>
    </main>
  );
}
