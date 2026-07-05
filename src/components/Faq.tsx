"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

const ITEMS = [
  {
    q: "Apa itu Kios Tani Digital?",
    a: "Layanan digital untuk mengecek sisa kuota pupuk subsidi, mendaftar sebagai penerima, dan mendapat edukasi pemupukan, cukup lewat percakapan dengan Asisten Tani. Dilengkapi panel petugas untuk verifikasi dan pencatatan penebusan.",
  },
  {
    q: "Siapa yang berhak menerima pupuk subsidi?",
    a: "Petani yang terdaftar dalam e-RDKK melalui kelompok tani, mengelola lahan maksimal 2 hektar, dan menanam salah satu dari 10 komoditas prioritas (padi, jagung, kedelai, cabai, bawang merah, bawang putih, kopi, tebu, kakao, ubi kayu).",
  },
  {
    q: "Bagaimana cara mengecek sisa kuota saya?",
    a: "Buka Asisten Tani, lalu ketik NIK 16 digit atau nomor telepon yang terdaftar. Sistem langsung menampilkan sisa jatah Urea, NPK, dan Organik Anda beserta HET-nya.",
  },
  {
    q: "Saya belum terdaftar, bagaimana?",
    a: "Ajukan diri lewat menu Daftar. Data Anda masuk antrean verifikasi petugas; setelah disetujui, alokasi pupuk Anda terbit dan bisa langsung dicek di Asisten Tani.",
  },
  {
    q: "Apakah pembayaran dilakukan lewat aplikasi?",
    a: "Tidak. Penebusan dan pembayaran dilakukan tunai di Kios Pupuk Lengkap (KPL) resmi sesuai HET, dengan membawa KTP asli. Aplikasi tidak pernah meminta PIN, OTP, atau pembayaran.",
  },
  {
    q: "Apakah data NIK saya aman?",
    a: "Data disimpan pada basis data terkontrol dengan akses berlapis; hanya petugas berwenang yang dapat mengelolanya. Asisten tidak akan pernah meminta PIN/OTP/password.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mt-9 divide-y divide-pine-100 overflow-hidden rounded-2xl border border-pine-100 bg-white/60 shadow-card">
      {ITEMS.map((it, i) => {
        const aktif = open === i;
        return (
          <div key={it.q}>
            <button
              onClick={() => setOpen(aktif ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-white/70"
            >
              <span className="font-display text-[17px] font-600 text-pine-800">{it.q}</span>
              <Plus
                size={18}
                className={`shrink-0 text-harvest-500 transition-transform duration-300 ${
                  aktif ? "rotate-45" : ""
                }`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ease-out ${
                aktif ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-5 text-[15px] leading-relaxed text-pine-600">{it.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
