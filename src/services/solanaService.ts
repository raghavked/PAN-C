/**
 * solanaService.ts
 * Solana Web3 — two use cases:
 *   1. Immutable on-chain incident logging (tamper-proof record of panic events)
 *   2. Community support fund — accept SOL donations for legal aid
 *
 * Required secrets (Replit → Secrets):
 *   VITE_SOLANA_RPC_URL         — RPC endpoint, e.g. https://api.mainnet-beta.solana.com
 *                                  or use Helius/QuickNode: https://rpc.helius.xyz/?api-key=<KEY>
 *   VITE_SOLANA_NETWORK         — "mainnet-beta" | "devnet" | "testnet" (default: "devnet")
 *   VITE_SOLANA_FUND_WALLET     — Public key of the community legal aid fund wallet
 *
 * Note: Private keys are NEVER stored client-side.
 * Signing is done via browser wallet (Phantom, Solflare) using the Wallet Adapter.
 */

const RPC_URL     = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const NETWORK     = import.meta.env.VITE_SOLANA_NETWORK || 'devnet';
const FUND_WALLET = import.meta.env.VITE_SOLANA_FUND_WALLET || '';

export interface IncidentLogEntry {
  incidentId: string;
  userId: string;       // hashed — never raw PII on-chain
  timestamp: string;
  locationHash?: string; // hashed coordinates for privacy
  status: 'active' | 'disarmed' | 'resolved';
}

export const solanaService = {
  /**
   * Returns the current Solana network and RPC endpoint being used.
   */
  getNetworkInfo() {
    return { network: NETWORK, rpcUrl: RPC_URL };
  },

  /**
   * Get the SOL balance of a wallet address (in SOL, not lamports).
   * Uses the JSON-RPC API directly — no @solana/web3.js bundle needed client-side.
   */
  async getBalance(publicKey: string): Promise<number> {
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [publicKey],
      }),
    });

    if (!res.ok) throw new Error(`Solana getBalance failed: ${res.status}`);
    const data = await res.json();
    const lamports = data.result?.value ?? 0;
    return lamports / 1_000_000_000; // Convert lamports → SOL
  },

  /**
   * Log an incident hash to Solana via a memo transaction.
   * The actual transaction signing must be done via a connected wallet (Phantom etc.).
   * This function returns the memo data to be included in the transaction.
   *
   * Full on-chain logging requires @solana/web3.js + wallet adapter on the backend.
   */
  buildIncidentMemo(entry: IncidentLogEntry): string {
    return JSON.stringify({
      app: 'PAN-C',
      v: '1.0',
      id: entry.incidentId,
      uid: entry.userId,
      ts: entry.timestamp,
      st: entry.status,
    });
  },

  /**
   * Get the community legal aid fund wallet address and its current balance.
   */
  async getFundInfo(): Promise<{ wallet: string; balanceSol: number }> {
    if (!FUND_WALLET) {
      return { wallet: 'Not configured', balanceSol: 0 };
    }

    const balance = await solanaService.getBalance(FUND_WALLET);
    return { wallet: FUND_WALLET, balanceSol: balance };
  },

  /**
   * Returns a Solana Pay URL for donating to the community legal aid fund.
   * Users can scan this with any Solana wallet.
   *
   * Format: solana:<recipient>?amount=<SOL>&label=<label>&message=<msg>
   */
  getDonationUrl(amountSol = 0.1): string {
    if (!FUND_WALLET) return '';
    const label = encodeURIComponent('PAN-C Legal Aid Fund');
    const message = encodeURIComponent('Supporting immigrant communities');
    return `solana:${FUND_WALLET}?amount=${amountSol}&label=${label}&message=${message}`;
  },

  /**
   * Fetch recent transactions for the fund wallet (for transparency dashboard).
   */
  async getFundTransactions(limit = 10) {
    if (!FUND_WALLET) return [];

    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [FUND_WALLET, { limit }],
      }),
    });

    if (!res.ok) throw new Error(`Solana getSignatures failed: ${res.status}`);
    const data = await res.json();
    return data.result ?? [];
  },
};
