"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ArrowLeft, Send, ShieldCheck, Sparkles } from "lucide-react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SAPAAN: Msg = {
  role: "assistant",
  content:
    "Assalamualaikum, selamat datang di layanan Pupuk Subsidi 🌾\nSaya Asisten Tani. Untuk mengecek sisa kuota pupuk Anda, silakan ketik NIK (16 digit) atau nomor telepon yang terdaftar.",
};

const CONTOH = ["1371042503780001", "081398220145", "Apa syarat dapat subsidi?"];

export default function AsistenPage() {
  const [messages, setMessages] = useState<Msg[]>([SAPAAN]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [nik, setNik] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [mode, setMode] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function kirim(teks: string) {
    const t = teks.trim();
    if (!t || loading) return;
    const next = [...messages, { role: "user" as const, content: t }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, nik }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      if (data.nik) setNik(data.nik);
      setVerified(!!data.verified);
      setMode(data.mode);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Maaf, koneksi terganggu. Coba kirim ulang ya." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex h-screen flex-col bg-paper bg-grain">
      {/* HEADER */}
      <header className="border-b border-pine-100 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="grid h-9 w-9 place-items-center rounded-full border border-pine-200 text-pine-600 transition hover:bg-white/60"
              aria-label="Kembali"
            >
              <ArrowLeft size={17} />
            </Link>
            <Logo />
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-600 transition ${
              verified
                ? "bg-pine-700 text-harvest-200"
                : "border border-pine-200 text-pine-500"
            }`}
          >
            <ShieldCheck size={13} />
            {verified ? "Terverifikasi" : "Belum verifikasi"}
          </span>
        </div>
      </header>

      {/* CHAT */}
      <div ref={scrollRef} className="scroll-thin mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6">
        <div className="flex flex-col gap-4">
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} />
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-card">
                <span className="dot h-1.5 w-1.5 rounded-full bg-pine-400" />
                <span className="dot h-1.5 w-1.5 rounded-full bg-pine-400" />
                <span className="dot h-1.5 w-1.5 rounded-full bg-pine-400" />
              </div>
            </div>
          )}
        </div>

        {/* quick replies — hanya di awal */}
        {messages.length === 1 && !loading && (
          <div className="mt-5 flex flex-wrap gap-2">
            {CONTOH.map((c) => (
              <button
                key={c}
                onClick={() => kirim(c)}
                className="rounded-full border border-pine-200 bg-white/60 px-3.5 py-1.5 text-xs font-500 text-pine-600 transition hover:border-pine-300 hover:bg-white"
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* INPUT */}
      <div className="border-t border-pine-100 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl px-4 py-3">
          <div className="flex items-end gap-2 rounded-2xl border border-pine-200 bg-white p-1.5 shadow-card focus-within:border-pine-400">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  kirim(input);
                }
              }}
              rows={1}
              placeholder="Ketik NIK, nomor telepon, atau pertanyaan…"
              className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-pine-800 outline-none placeholder:text-pine-400"
            />
            <button
              onClick={() => kirim(input)}
              disabled={!input.trim() || loading}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pine-700 text-paper transition hover:bg-pine-800 disabled:opacity-40"
              aria-label="Kirim"
            >
              <Send size={17} />
            </button>
          </div>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-pine-400">
            <Sparkles size={11} />
            {mode === "groq"
              ? "Ditenagai Groq AI"
              : "Jangan bagikan PIN/OTP · pembayaran hanya di kios resmi"}
          </p>
        </div>
      </div>
    </main>
  );
}

// Render inline **bold** dengan aman (tanpa dangerouslySetInnerHTML).
function renderInline(text: string, keyBase: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={keyBase + i}>{p.slice(2, -2)}</strong>;
    return <span key={keyBase + i}>{p}</span>;
  });
}

// Format ringan: baris, bullet (- / •), dan **tebal**.
function FormattedMessage({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const isBullet = /^\s*[-•]\s+/.test(line);
        if (isBullet) {
          const isi = line.replace(/^\s*[-•]\s+/, "");
          return (
            <div key={i} className="flex gap-1.5">
              <span className="mt-px shrink-0 text-harvest-500">•</span>
              <span>{renderInline(isi, `b${i}-`)}</span>
            </div>
          );
        }
        return (
          <div key={i} className={line.trim() === "" ? "h-2" : undefined}>
            {line.trim() === "" ? null : renderInline(line, `l${i}-`)}
          </div>
        );
      })}
    </>
  );
}

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-up`}>
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-card ${
          isUser
            ? "whitespace-pre-wrap rounded-br-md bg-harvest-400 font-mono text-[13px] text-pine-800"
            : "rounded-bl-md bg-white text-pine-700"
        }`}
      >
        {isUser ? content : <FormattedMessage text={content} />}
      </div>
    </div>
  );
}
