import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair} from '@solana/web3.js'
import {Ezpool} from '../target/types/ezpool'

describe('ezpool', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.Ezpool as Program<Ezpool>

  const ezpoolKeypair = Keypair.generate()

  it('Initialize Ezpool', async () => {
    await program.methods
      .initialize()
      .accounts({
        ezpool: ezpoolKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([ezpoolKeypair])
      .rpc()

    const currentCount = await program.account.ezpool.fetch(ezpoolKeypair.publicKey)

    expect(currentCount.count).toEqual(0)
  })

  it('Increment Ezpool', async () => {
    await program.methods.increment().accounts({ ezpool: ezpoolKeypair.publicKey }).rpc()

    const currentCount = await program.account.ezpool.fetch(ezpoolKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Increment Ezpool Again', async () => {
    await program.methods.increment().accounts({ ezpool: ezpoolKeypair.publicKey }).rpc()

    const currentCount = await program.account.ezpool.fetch(ezpoolKeypair.publicKey)

    expect(currentCount.count).toEqual(2)
  })

  it('Decrement Ezpool', async () => {
    await program.methods.decrement().accounts({ ezpool: ezpoolKeypair.publicKey }).rpc()

    const currentCount = await program.account.ezpool.fetch(ezpoolKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Set ezpool value', async () => {
    await program.methods.set(42).accounts({ ezpool: ezpoolKeypair.publicKey }).rpc()

    const currentCount = await program.account.ezpool.fetch(ezpoolKeypair.publicKey)

    expect(currentCount.count).toEqual(42)
  })

  it('Set close the ezpool account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        ezpool: ezpoolKeypair.publicKey,
      })
      .rpc()

    // The account should no longer exist, returning null.
    const userAccount = await program.account.ezpool.fetchNullable(ezpoolKeypair.publicKey)
    expect(userAccount).toBeNull()
  })
})
