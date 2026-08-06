import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import bs58 from "bs58";

// Demo token: self-minted SPL on Solana devnet, 9 decimals. Not mainnet USDC.
const DECIMALS = 9;

const RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl("devnet");
const connection = new Connection(RPC_URL, "confirmed");

function getTreasury(): Keypair {
  const secret = process.env.TREASURY_SECRET;
  if (!secret) throw new Error("Missing TREASURY_SECRET");
  return Keypair.fromSecretKey(bs58.decode(secret));
}

export async function settle(amount: number): Promise<{ sig: string; fallback: boolean }> {
  try {
    const mintAddress = process.env.MINT_ADDRESS;
    const recipientAddress = process.env.RECIPIENT_ADDRESS;
    if (!mintAddress || !recipientAddress) {
      throw new Error("Missing MINT_ADDRESS or RECIPIENT_ADDRESS");
    }

    const treasury = getTreasury();
    const mint = new PublicKey(mintAddress);
    const recipient = new PublicKey(recipientAddress);

    const treasuryAta = await getOrCreateAssociatedTokenAccount(connection, treasury, mint, treasury.publicKey);
    const recipientAta = await getOrCreateAssociatedTokenAccount(connection, treasury, mint, recipient);

    const rawAmount = BigInt(Math.round(amount * 10 ** DECIMALS));

    const sig = await transfer(
      connection,
      treasury,
      treasuryAta.address,
      recipientAta.address,
      treasury,
      rawAmount
    );

    return { sig, fallback: false };
  } catch (err) {
    console.error("settle() failed, using fallback tx:", err);
    return { sig: process.env.FALLBACK_TX_SIG ?? "", fallback: true };
  }
}
