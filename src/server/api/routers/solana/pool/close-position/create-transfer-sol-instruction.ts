import {
  SystemProgram,
  TransactionInstruction,
  PublicKey,
  Keypair,
} from '@solana/web3.js'

import {
  createSyncNativeInstruction,
  TOKEN_PROGRAM_ID,
  createInitializeAccountInstruction,
  createCloseAccountInstruction,
} from '@solana/spl-token'

export function createTransferSolInstruction({
  source,
  destination,
  amount,
}: {
  source: PublicKey
  destination: PublicKey
  amount: bigint
}): TransactionInstruction {
  return SystemProgram.transfer({
    fromPubkey: source,
    toPubkey: destination,
    lamports: Number(amount), // Convert `bigint` to `number`
  })
}

export function createSyncNativeSolInstruction({
  account,
}: {
  account: PublicKey
}): TransactionInstruction {
  return createSyncNativeInstruction(account, TOKEN_PROGRAM_ID)
}

export function createAccountInstruction({
  payer,
  newAccount,
  lamports,
  space,
  programAddress,
}: {
  payer: PublicKey
  newAccount: Keypair
  lamports: bigint
  space: number
  programAddress: PublicKey
}): TransactionInstruction {
  return SystemProgram.createAccount({
    fromPubkey: payer,
    newAccountPubkey: newAccount.publicKey,
    lamports: Number(lamports), // Convert bigint to number
    space,
    programId: programAddress,
  })
}

export function createInitializeAccountSolInstruction({
  account,
  mint,
  owner,
}: {
  account: PublicKey
  mint: PublicKey
  owner: PublicKey
}): TransactionInstruction {
  return createInitializeAccountInstruction(
    account,
    mint,
    owner,
    TOKEN_PROGRAM_ID,
  )
}

export function createAccountWithSeedInstruction({
  payer,
  newAccount,
  base,
  baseAccount,
  seed,
  space,
  amount,
  programAddress,
}: {
  payer: PublicKey
  newAccount: PublicKey
  base: PublicKey
  baseAccount: PublicKey
  seed: string
  space: number
  amount: bigint
  programAddress: PublicKey
}): TransactionInstruction {
  return SystemProgram.createAccountWithSeed({
    fromPubkey: payer,
    basePubkey: base,
    seed,
    newAccountPubkey: newAccount,
    lamports: Number(amount), // Convert bigint to number
    space,
    programId: programAddress,
  })
}

export function createInitializeAccountInstructionForToken({
  account,
  mint,
  owner,
}: {
  account: PublicKey
  mint: PublicKey
  owner: PublicKey
}): TransactionInstruction {
  return createInitializeAccountInstruction(
    account,
    mint,
    owner,
    TOKEN_PROGRAM_ID,
  )
}

export function createCloseAccountInstructionForToken({
  account,
  owner,
  destination,
}: {
  account: PublicKey
  owner: PublicKey
  destination: PublicKey
}): TransactionInstruction {
  return createCloseAccountInstruction(
    account,
    destination,
    owner,
    undefined,
    TOKEN_PROGRAM_ID,
  )
}
