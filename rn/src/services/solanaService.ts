const RPC_URL     = process.env.EXPO_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const NETWORK     = process.env.EXPO_PUBLIC_SOLANA_NETWORK || 'devnet';
const FUND_WALLET = process.env.EXPO_PUBLIC_SOLANA_FUND_WALLET || '';

export interface IncidentLogEntry {
  incidentId: string;
  userId: string;
  timestamp: string;
  locationHash?: string;
  status: 'active' | 'disarmed' | 'resolved';
}

export const solanaService = {
  getNetworkInfo() {
    return { network: NETWORK, rpcUrl: RPC_URL };
  },

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
    return (data.result?.value ?? 0) / 1_000_000_000;
  },

  buildIncidentMemo(entry: IncidentLogEntry): string {
    return JSON.stringify({
      app: 'PAN!C',
      v: '1.0',
      id: entry.incidentId,
      uid: entry.userId,
      ts: entry.timestamp,
      st: entry.status,
    });
  },

  async getFundInfo(): Promise<{ wallet: string; balanceSol: number }> {
    if (!FUND_WALLET) return { wallet: 'Not configured', balanceSol: 0 };
    const balance = await solanaService.getBalance(FUND_WALLET);
    return { wallet: FUND_WALLET, balanceSol: balance };
  },

  getDonationUrl(amountSol = 0.1): string {
    if (!FUND_WALLET) return '';
    const label = encodeURIComponent('PAN!C Legal Aid Fund');
    const message = encodeURIComponent('Supporting immigrant communities');
    return `solana:${FUND_WALLET}?amount=${amountSol}&label=${label}&message=${message}`;
  },

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
