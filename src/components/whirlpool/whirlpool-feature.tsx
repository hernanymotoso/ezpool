'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { ExplorerLink } from '../cluster/cluster-ui'
import { WalletButton } from '../solana/solana-provider'
import { AppHero, ellipsify } from '../ui/ui-layout'
import { WhirlpoolData } from './whirlpool'
import * as whirlpoolProgram from '@/hooks/whirlpool'

export default function WhirlpoolFeature() {
  const { publicKey } = useWallet()
  const { programId } = whirlpoolProgram.useProgram()
  const { data } = whirlpoolProgram.useAccounts('whirlpool')

  console.log('whirlpools', data)
  return publicKey ? (
    <div>
      <AppHero
        title="Whirlpool"
        subtitle={
          'Create a new account by clicking the "Create" button. The state of a account is stored on-chain and can be manipulated by calling the program\'s methods (increment, decrement, set, and close).'
        }
      >
        <p className="mb-6">
          <ExplorerLink
            path={`account/${programId}`}
            label={ellipsify(programId.toString())}
          />
        </p>
      </AppHero>

      <WhirlpoolData />
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  )
}
