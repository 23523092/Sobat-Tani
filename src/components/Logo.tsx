export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-pine-700 text-harvest-300 shadow-card">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
          {/* sprout / padi mark */}
          <path d="M12 21V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M12 11C12 11 8 10.5 6.5 8.5C5 6.5 5.5 4 5.5 4C5.5 4 8.5 4.2 10 6.2C11.5 8.2 12 11 12 11Z"
            fill="currentColor"
          />
          <path
            d="M12 13C12 13 15.2 12.6 16.6 11C18 9.4 17.6 7.2 17.6 7.2C17.6 7.2 14.8 7.4 13.4 9C12 10.6 12 13 12 13Z"
            fill="currentColor"
            opacity=".7"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[17px] font-600 text-pine-800">Kios Tani</span>
        <span className="text-[10px] font-600 uppercase tracking-[0.18em] text-pine-400">Digital · Subsidi</span>
      </span>
    </span>
  );
}
