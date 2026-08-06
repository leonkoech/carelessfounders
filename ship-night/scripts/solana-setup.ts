// Run once, night before (or well before demo): npm run solana-setup
// Generates a treasury + recipient keypair, mints a self-minted demo SPL
// token on devnet, funds the treasury, and performs one warm-up transfer.
// Paste the printed values into .env.local — never run this on stage.
//
// Resumable: the treasury/recipient keys are cached in scripts/.setup-keys.json
// (gitignored) as soon as they're generated, so if the devnet faucet is dry
// (common on hackathon night — everyone's hitting the same faucet), you can
// fund the printed treasury address manually (faucet.solana.com, or a
// teammate sending devnet SOL) and rerun this script to pick up where it
// left off instead of losing the keypair.

import fs from "node:fs";
import path from "node:path";
import { Connection, Keypair, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, transfer } from "@solana/spl-token";
import bs58 from "bs58";

function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (value && !(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const DECIMALS = 9;
const SUPPLY = BigInt(1_000_000) * BigInt(10) ** BigInt(DECIMALS);
const WARMUP_AMOUNT = BigInt(1) * BigInt(10) ** BigInt(DECIMALS);
const MIN_TREASURY_SOL = 0.02; // enough for mint + 2 ATAs + fees

const KEYS_CACHE_PATH = path.resolve(process.cwd(), "scripts", ".setup-keys.json");

type KeysCache = { treasurySecret: string; recipientSecret: string };

function loadOrCreateKeys(): { treasury: Keypair; recipient: Keypair } {
  if (fs.existsSync(KEYS_CACHE_PATH)) {
    const cache = JSON.parse(fs.readFileSync(KEYS_CACHE_PATH, "utf8")) as KeysCache;
    console.log("Reusing cached treasury/recipient keys from scripts/.setup-keys.json");
    return {
      treasury: Keypair.fromSecretKey(bs58.decode(cache.treasurySecret)),
      recipient: Keypair.fromSecretKey(bs58.decode(cache.recipientSecret)),
    };
  }

  const treasury = Keypair.generate();
  const recipient = Keypair.generate();
  const cache: KeysCache = {
    treasurySecret: bs58.encode(treasury.secretKey),
    recipientSecret: bs58.encode(recipient.secretKey),
  };
  fs.writeFileSync(KEYS_CACHE_PATH, JSON.stringify(cache, null, 2));
  console.log(`Generated new treasury/recipient keys, cached at ${KEYS_CACHE_PATH}`);
  return { treasury, recipient };
}

async function ensureFunded(airdropConnection: Connection, treasury: Keypair): Promise<void> {
  const balance = await airdropConnection.getBalance(treasury.publicKey);
  if (balance >= MIN_TREASURY_SOL * LAMPORTS_PER_SOL) {
    console.log(`Treasury already funded: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    return;
  }

  console.log("Requesting devnet SOL airdrop for treasury (0.5 SOL) via public faucet...");
  try {
    const airdropSig = await airdropConnection.requestAirdrop(treasury.publicKey, 0.5 * LAMPORTS_PER_SOL);
    await airdropConnection.confirmTransaction(airdropSig, "confirmed");
    console.log(`  airdrop confirmed: ${airdropSig}`);
  } catch (err) {
    console.error("\nAirdrop failed — the devnet faucet is likely rate-limited/dry (common on hackathon night).");
    console.error(`Fund this address manually, then rerun 'npm run solana-setup':\n`);
    console.error(`  Treasury address: ${treasury.publicKey.toBase58()}`);
    console.error(`\nOptions: https://faucet.solana.com (paste the address above), or have a teammate`);
    console.error(`with devnet SOL send some to that address directly.\n`);
    throw err;
  }
}

async function main() {
  const rpcUrl = process.env.SOLANA_RPC_URL || clusterApiUrl("devnet");
  const connection = new Connection(rpcUrl, "confirmed");
  console.log(`Using RPC: ${rpcUrl}\n`);

  // Airdrops go through the public devnet faucet specifically — some dedicated
  // RPC providers (e.g. QuickNode) throttle/disable requestAirdrop on their
  // endpoint even though they're fine for everything else.
  const airdropConnection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const { treasury, recipient } = loadOrCreateKeys();
  console.log(`Treasury: ${treasury.publicKey.toBase58()}`);
  console.log(`Recipient: ${recipient.publicKey.toBase58()}\n`);

  await ensureFunded(airdropConnection, treasury);

  console.log("Creating SPL mint (9 decimals, demo stablecoin)...");
  const mint = await createMint(connection, treasury, treasury.publicKey, null, DECIMALS);
  console.log(`  mint: ${mint.toBase58()}`);

  console.log("Creating treasury ATA and minting supply...");
  const treasuryAta = await getOrCreateAssociatedTokenAccount(connection, treasury, mint, treasury.publicKey);
  await mintTo(connection, treasury, mint, treasuryAta.address, treasury, SUPPLY);
  console.log(`  treasury ATA: ${treasuryAta.address.toBase58()} (+1,000,000 tokens)`);

  console.log("Creating recipient ATA...");
  const recipientAta = await getOrCreateAssociatedTokenAccount(connection, treasury, mint, recipient.publicKey);
  console.log(`  recipient ATA: ${recipientAta.address.toBase58()}`);

  console.log("Performing warm-up transfer treasury -> recipient...");
  const warmupSig = await transfer(
    connection,
    treasury,
    treasuryAta.address,
    recipientAta.address,
    treasury,
    WARMUP_AMOUNT
  );
  await connection.confirmTransaction(warmupSig, "confirmed");
  console.log(`  warm-up tx: ${warmupSig}`);

  console.log("\n--- Paste into .env.local ---\n");
  console.log(`TREASURY_SECRET=${bs58.encode(treasury.secretKey)}`);
  console.log(`MINT_ADDRESS=${mint.toBase58()}`);
  console.log(`RECIPIENT_ADDRESS=${recipient.publicKey.toBase58()}`);
  console.log(`FALLBACK_TX_SIG=${warmupSig}`);
  console.log(`\nExplorer: https://explorer.solana.com/tx/${warmupSig}?cluster=devnet`);

  // Safe to delete now that .env.local can hold the same secret.
  fs.rmSync(KEYS_CACHE_PATH, { force: true });
}

main().catch((err) => {
  console.error("\nsolana-setup did not finish:", err.message ?? err);
  process.exit(1);
});
