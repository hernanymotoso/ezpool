import {
  fetchAllMaybeToken,
  fetchAllMint,
  findAssociatedTokenPda,
  getTokenSize,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token'
import {
  address,
  Address,
  GetAccountInfoApi,
  getAddressDecoder,
  getAddressEncoder,
  GetMinimumBalanceForRentExemptionApi,
  GetMultipleAccountsApi,
  lamports,
  Rpc,
} from '@solana/kit'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js'
import assert from 'assert'
import {
  createAccountInstruction,
  createAccountWithSeedInstruction,
  createCloseAccountInstructionForToken,
  createInitializeAccountInstructionForToken,
  createInitializeAccountSolInstruction,
  createSyncNativeSolInstruction,
  createTransferSolInstruction,
} from './create-transfer-sol-instruction'

/** The public key for the native mint (SOL) */
export const NATIVE_MINT = address(
  'So11111111111111111111111111111111111111112',
)

/**
 * Defines the strategy for handling Native Mint wrapping in a transaction.
 *
 * - **Keypair**:
 *   Creates an auxiliary token account using a keypair.
 *   Optionally adds funds to the account.
 *   Closes it at the end of the transaction.
 *
 * - **Seed**:
 *   Functions similarly to Keypair, but uses a seed account instead.
 *
 * - **ATA**:
 *   Treats the native balance and associated token account (ATA) for `NATIVE_MINT` as one.
 *   Will create the ATA if it doesn't exist.
 *   Optionally adds funds to the account.
 *   Closes it at the end of the transaction if it did not exist before.
 *
 * - **None**:
 *   Uses or creates the ATA without performing any Native Mint wrapping or unwrapping.
 */
export type NativeMintWrappingStrategy = 'keypair' | 'seed' | 'ata' | 'none'

/**
 * The default native mint wrapping strategy.
 */
export const DEFAULT_NATIVE_MINT_WRAPPING_STRATEGY: NativeMintWrappingStrategy =
  'keypair'

/**
 * The currently selected native mint wrapping strategy.
 */
export const NATIVE_MINT_WRAPPING_STRATEGY: NativeMintWrappingStrategy =
  DEFAULT_NATIVE_MINT_WRAPPING_STRATEGY

type TokenAccountInstructions = {
  /** A list of instructions required to create the necessary token accounts. */
  createInstructions: TransactionInstruction[]

  /** A list of instructions to clean up (e.g., close) token accounts after the transaction is complete. */
  cleanupInstructions: TransactionInstruction[]

  /** A mapping of mint addresses to their respective token account addresses. */
  tokenAccountAddresses: Record<Address, Address>
}

/**
 *
 * Prepare token acounts required for a transaction. This will create
 * ATAs for the supplied mints.
 *
 * The NATIVE_MINT is a special case where this function will optionally wrap/unwrap
 * Native Mint based on the NATIVE_MINT_WRAPPING_STRATEGY.
 *
 * @param rpc
 * @param owner the owner to create token accounts for
 * @param spec the mints (and amounts) required in the token accounts
 * @returns Instructions and addresses for the required token accounts
 */
export async function prepareTokenAccountsInstructions(
  rpc: Rpc<
    GetAccountInfoApi &
      GetMultipleAccountsApi &
      GetMinimumBalanceForRentExemptionApi
  >,
  owner: string,
  spec: Address[] | Record<Address, bigint | number>,
): Promise<TokenAccountInstructions> {
  const mintAddresses = Array.isArray(spec)
    ? spec
    : (Object.keys(spec) as Address[])
  const nativeMintIndex = mintAddresses.indexOf(NATIVE_MINT)
  const hasNativeMint = nativeMintIndex !== -1
  const mintFilter = (address: Address) =>
    address !== NATIVE_MINT || NATIVE_MINT_WRAPPING_STRATEGY === 'none'

  const mints = await fetchAllMint(rpc, mintAddresses.filter(mintFilter))

  const tokenAddresses = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    mints.map(mint =>
      findAssociatedTokenPda({
        owner: owner as any, // FIXME: this type is wrong
        mint: mint.address,
        tokenProgram: mint.programAddress,
      }).then(x => x[0]),
    ),
  )

  const tokenAccounts = await fetchAllMaybeToken(rpc, tokenAddresses)
  const tokenAccountAddresses: Record<Address, Address> = {}
  const createInstructions: TransactionInstruction[] = []
  const cleanupInstructions: TransactionInstruction[] = []

  for (let i = 0; i < mints.length; i++) {
    const mint = mints[i]
    const tokenAccount = tokenAccounts[i]
    tokenAccountAddresses[mint.address] = tokenAccount.address
    if (tokenAccount.exists) {
      continue
    }
    // createInstructions.push(
    //   getCreateAssociatedTokenInstruction({
    //     payer: owner,
    //     owner: owner.address,
    //     ata: tokenAccount.address,
    //     mint: mint.address,
    //     tokenProgram: mint.programAddress,
    //   }),
    // )
    // const createAssociatedTokenInstruction = await createATAInstruction({
    //   payer: new PublicKey(owner),
    //   owner: new PublicKey(owner),
    //   mint: new PublicKey(mint.address),
    // })

    createInstructions.push(
      createAssociatedTokenAccountInstruction(
        new PublicKey(owner), // Payer who will fund the creation
        new PublicKey(tokenAccount.address), // Associated Token Account (ATA)
        new PublicKey(owner), // Owner of the ATA
        new PublicKey(mint.address), // Token Mint
        new PublicKey(TOKEN_PROGRAM_ID),
        new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID),
      ),
    )
  }

  if (!Array.isArray(spec)) {
    for (let i = 0; i < mints.length; i++) {
      const mint = mints[i]
      if (
        mint.address === NATIVE_MINT &&
        NATIVE_MINT_WRAPPING_STRATEGY !== 'none'
      ) {
        continue
      }
      const tokenAccount = tokenAccounts[i]
      const existingBalance = tokenAccount.exists
        ? tokenAccount.data.amount
        : BigInt(0)
      assert(
        BigInt(spec[mint.address]) <= existingBalance,
        `Token account for ${mint.address} does not have the required balance`,
      )
    }
  }

  if (hasNativeMint && NATIVE_MINT_WRAPPING_STRATEGY === 'keypair') {
    const keypair = Keypair.generate()
    const space = getTokenSize()
    let amount = await rpc
      .getMinimumBalanceForRentExemption(BigInt(space))
      .send()

    if (!Array.isArray(spec)) {
      amount = lamports(amount + BigInt(spec[NATIVE_MINT]))
    }

    createInstructions.push(
      // getCreateAccountInstruction({
      //   payer: owner,
      //   newAccount: keypair,
      //   lamports: amount,
      //   space,
      //   programAddress: TOKEN_PROGRAM_ADDRESS,
      // }),
      createAccountInstruction({
        payer: new PublicKey(owner),
        newAccount: keypair,
        lamports: amount,
        space,
        programAddress: new PublicKey(TOKEN_PROGRAM_ADDRESS),
      }),
      // getInitializeAccount3Instruction({
      //   account: keypair.address,
      //   mint: NATIVE_MINT,
      //   owner: owner.address,
      // }),
      createInitializeAccountSolInstruction({
        account: keypair.publicKey,
        mint: new PublicKey(NATIVE_MINT),
        owner: new PublicKey(owner),
      }),
    )
    cleanupInstructions.push(
      createCloseAccountInstructionForToken({
        account: keypair.publicKey,
        owner: new PublicKey(owner),
        destination: new PublicKey(owner),
      }),
    )
    tokenAccountAddresses[NATIVE_MINT] = keypair.publicKey.toString() as any
  }

  if (hasNativeMint && NATIVE_MINT_WRAPPING_STRATEGY === 'seed') {
    const space = getTokenSize()
    let amount = await rpc
      .getMinimumBalanceForRentExemption(BigInt(space))
      .send()

    if (!Array.isArray(spec)) {
      amount = lamports(amount + BigInt(spec[NATIVE_MINT]))
    }

    // Generating secure seed takes longer and is not really needed here.
    // With date, it should only create collisions if the same owner
    // creates multiple accounts at exactly the same time (in ms)
    const seed = Date.now().toString()
    const buffer = await crypto.subtle.digest(
      'SHA-256',
      Buffer.concat([
        Buffer.from(getAddressEncoder().encode(owner as any)),
        Buffer.from(seed),
        Buffer.from(getAddressEncoder().encode(TOKEN_PROGRAM_ADDRESS)),
      ]),
    )
    tokenAccountAddresses[NATIVE_MINT] = getAddressDecoder().decode(
      new Uint8Array(buffer),
    )

    createInstructions.push(
      createAccountWithSeedInstruction({
        payer: new PublicKey(owner),
        newAccount: new PublicKey(tokenAccountAddresses[NATIVE_MINT]),
        base: new PublicKey(owner),
        baseAccount: new PublicKey(owner),
        seed,
        space,
        amount,
        programAddress: new PublicKey(TOKEN_PROGRAM_ADDRESS),
      }),
      createInitializeAccountInstructionForToken({
        account: new PublicKey(tokenAccountAddresses[NATIVE_MINT]),
        mint: new PublicKey(NATIVE_MINT),
        owner: new PublicKey(owner),
      }),
    )

    cleanupInstructions.push(
      createCloseAccountInstructionForToken({
        account: new PublicKey(tokenAccountAddresses[NATIVE_MINT]),
        owner: new PublicKey(owner),
        destination: new PublicKey(owner),
      }),
    )
  }

  if (hasNativeMint && NATIVE_MINT_WRAPPING_STRATEGY === 'ata') {
    const account = tokenAccounts[nativeMintIndex]
    const existingBalance = account.exists ? account.data.amount : BigInt(0)

    if (!Array.isArray(spec) && existingBalance < BigInt(spec[NATIVE_MINT])) {
      createInstructions.push(
        // getTransferSolInstruction({
        //   source: owner,
        //   destination: tokenAccountAddresses[NATIVE_MINT],
        //   amount: BigInt(spec[NATIVE_MINT]) - existingBalance,
        // }),
        createTransferSolInstruction({
          source: new PublicKey(owner),
          destination: new PublicKey(tokenAccountAddresses[NATIVE_MINT]),
          amount: BigInt(spec[NATIVE_MINT]) - existingBalance,
        }),
        // getSyncNativeInstruction({
        //   account: tokenAccountAddresses[NATIVE_MINT],
        // }),,
        createSyncNativeSolInstruction({
          account: new PublicKey(tokenAccountAddresses[NATIVE_MINT]),
        }),
      )
    }

    if (!account.exists) {
      cleanupInstructions.push(
        createCloseAccountInstructionForToken({
          account: new PublicKey(account.address),
          owner: new PublicKey(owner),
          destination: new PublicKey(owner),
        }),
      )
    }
  }
  console.log('createInstructions', createInstructions)
  console.log('cleanupInstructions', cleanupInstructions)
  console.log('tokenAccountAddresses', tokenAccountAddresses)
  return {
    createInstructions,
    cleanupInstructions,
    tokenAccountAddresses,
  }
}
