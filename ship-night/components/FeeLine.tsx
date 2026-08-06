export function FeeLine({ ourFee, squareFee }: { ourFee: number; squareFee: number }) {
  return (
    <div className="flex flex-wrap items-baseline gap-3 rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
      <span className="text-3xl font-bold text-emerald-600">${ourFee.toFixed(2)}</span>
      <span className="text-lg text-zinc-400 line-through">${squareFee.toFixed(2)}</span>
      <span className="text-sm text-zinc-500">our fee vs. Square</span>
    </div>
  );
}
