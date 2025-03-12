import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import { PublicKey, TransactionInstruction } from '@solana/web3.js'

export async function createATAInstruction({
  payer,
  owner,
  mint,
}: {
  payer: PublicKey
  owner: PublicKey
  mint: PublicKey
}): Promise<TransactionInstruction> {
  // Get the Associated Token Account (ATA) address
  const ata = await getAssociatedTokenAddress(
    mint,
    owner,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )

  // Create the instruction to create the ATA
  return createAssociatedTokenAccountInstruction(
    payer, // Payer who will fund the creation
    ata, // Associated Token Account (ATA)
    owner, // Owner of the ATA
    mint, // Token Mint
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )
}
