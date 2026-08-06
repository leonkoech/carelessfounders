export function SplitAnimation({
  total,
  food,
  tip,
}: {
  total: number;
  food: number;
  tip: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
      <div className="text-3xl font-bold tabular-nums">${total.toFixed(2)}</div>
      <div className="text-2xl text-zinc-400">→</div>
      <div className="flex flex-col gap-1">
        <span className="text-lg font-semibold tabular-nums">
          ${food.toFixed(2)} <span className="text-sm font-normal text-zinc-500">restaurant</span>
        </span>
        <span className="text-lg font-semibold tabular-nums text-emerald-600">
          ${tip.toFixed(2)}{" "}
          <span className="text-sm font-normal text-zinc-500">to Maria, instantly</span>
        </span>
      </div>
    </div>
  );
}
