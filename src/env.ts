export const env = {
  server: {
    NODE_ENV: process.env.NODE_ENV,
    FUNDER_WALLET_SECRET_KEY: process.env.FUNDER_WALLET,
    TOKEN_VAULT_WALLET_SECRET_KEY: process.env.TOKEN_VAULT_WALLET,
    CONFIG_WALLET_PUBLIC_KEY: process.env.CONFIG_WALLET_PUBLIC_KEY,
    SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
  },
  frontend: {
    WHIRLPOOL_CONFIG_PUBLIC_KEY: process.env.NEXT_PUBLIC_KEY_CONFIG_WALLET!,
  },
}
