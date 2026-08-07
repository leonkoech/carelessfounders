"use client";

type FeeLineProps = {
  ourFee: number;
  squareFee: number;
  amount?: number;
};

function formatMoney(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function FeeLine({ ourFee, squareFee, amount }: FeeLineProps) {
  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900/95 p-6">
      {amount !== undefined && (
        <p className="mb-4 text-sm uppercase tracking-wide text-zinc-400">
          {formatMoney(amount)} spend
        </p>
      )}
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-400">
            Our fee
          </p>
          <p className="mt-1 text-4xl font-bold text-emerald-400 sm:text-5xl">
            {formatMoney(ourFee)}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-400">
            Square
          </p>
          <p className="mt-1 text-5xl font-black text-red-500 line-through decoration-4 sm:text-6xl">
            {formatMoney(squareFee)}
          </p>
        </div>
      </div>
    </div>
  );
}
