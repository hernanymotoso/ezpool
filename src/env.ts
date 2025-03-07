export const env = {
  server: {
    NODE_ENV: process.env.NODE_ENV,
    SOLANA_RPC_URL: process.env.SOLANA_RPC_URL!,
    FUNDER_WALLET_SECRET_KEY: process.env.FUNDER_WALLET!,
    CONFIG_WALLET_PUBLIC_KEY: process.env.CONFIG_WALLET_PUBLIC_KEY!,
  },
  frontend: {
    FUNDER_PUBLIC_KEY: process.env.NEXT_PUBLIC_KEY_FUNDER_WALLET!,
    WHIRLPOOL_CONFIG_PUBLIC_KEY: process.env.NEXT_PUBLIC_KEY_CONFIG_WALLET!,
  },
}
