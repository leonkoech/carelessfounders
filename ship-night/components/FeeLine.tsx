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
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      {amount !== undefined && (
        <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
          {formatMoney(amount)} spend
        </p>
      )}
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Our fee
          </p>
          <p className="mt-1 text-4xl font-bold text-[#ff2f00] sm:text-5xl">
            {formatMoney(ourFee)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Square
          </p>
          <p className="mt-1 text-5xl font-black text-zinc-500 line-through decoration-4 sm:text-6xl">
            {formatMoney(squareFee)}
          </p>
        </div>
      </div>
    </div>
  );
}
