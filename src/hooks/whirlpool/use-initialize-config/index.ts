import config from '@/wallets/config.json'
import funder from '@/wallets/funder.json'
import { Keypair, SystemProgram } from '@solana/web3.js'
import { useMutation } from '@tanstack/react-query'
import { useProgram } from '../use-program'
import {
  InitializeConfigDTO,
  InitializeConfigResponse,
  RequestThis,
} from './types'

// FIXME: remove wallets from frontend and do the serialisation way
const funderKeyPairBytes = new Uint8Array(funder)
const configKeyPairBytes = new Uint8Array(config)

async function request(
  this: RequestThis,
  dto: InitializeConfigDTO,
): Promise<InitializeConfigResponse> {
  const funderKeypair = Keypair.fromSecretKey(funderKeyPairBytes)
  const configKeypair = Keypair.fromSecretKey(configKeyPairBytes)

  const txSignature = await this.program.methods
    .initializeConfig(
      funderKeypair.publicKey,
      funderKeypair.publicKey,
      funderKeypair.publicKey,
      dto.defaultProtocolFeeRate,
    )
    .accounts({
      config: configKeypair.publicKey,
      funder: funderKeypair.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([configKeypair, funderKeypair])
    .rpc()

  return {
    signature: txSignature,
    configPubkey: configKeypair.publicKey,
    funderPubkey: funderKeypair.publicKey,
  }
}

export function useInitializeConfig() {
  const { cluster, program } = useProgram()

  return useMutation<InitializeConfigResponse, Error, InitializeConfigDTO>({
    mutationKey: ['whirlpool', 'initialize-config', { cluster }],
    mutationFn: request.bind({
      program,
    }),
    onSuccess(data) {
      console.log('Initialize config data:', data)
    },
    onError(error) {
      console.error('Initialize config error:', error)
    },
  })
}
