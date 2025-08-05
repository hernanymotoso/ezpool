import funder from '@/wallets/funder.json'
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import { useMutation } from '@tanstack/react-query'
import { useProgram } from '../use-program'
import {
  InitializeConfigDTO,
  InitializeConfigResponse,
  RequestThis,
} from './types'

// FIXME: remove wallets from frontend and do the serialisation way
const funderKeyPairBytes = new Uint8Array(funder)

async function request(
  this: RequestThis,
  dto: InitializeConfigDTO,
): Promise<InitializeConfigResponse> {
  const funderKeypair = Keypair.fromSecretKey(funderKeyPairBytes)

  function buildTickSpacingBuffer(tickSpacing: number): Buffer<ArrayBuffer> {
    const tickSpacingBuffer = Buffer.alloc(2)
    tickSpacingBuffer.writeUInt16LE(tickSpacing, 0)
    return tickSpacingBuffer
  }

  function buildFeeTierPDA(tickSpacing: number, programId: PublicKey) {
    const tickSpacingBuffer = buildTickSpacingBuffer(tickSpacing)
    const [feeTierPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('fee_tier'),
        new PublicKey(
          '9ULabXCKBX3Vug9iz4XptgMqjWPz1ufT3G8nuD3NTctF',
        ).toBuffer(),
        tickSpacingBuffer,
      ],
      programId,
    )

    return feeTierPDA
  }

  const feeTierPda = buildFeeTierPDA(64, this.program.programId)

  console.log('feeTierPda:', feeTierPda.toString())

  const test = '9ULabXCKBX3Vug9iz4XptgMqjWPz1ufT3G8nuD3NTctF'
  console.log('test:', test)

  const txSignature = await this.program.methods
    .initializeFeeTier(64, 300)
    .accounts({
      config: test,
      feeTier: feeTierPda,
      funder: funderKeypair.publicKey,
      feeAuthority: funderKeypair.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([funderKeypair])
    .rpc()

  return {
    signature: txSignature,
    funderPubkey: funderKeypair.publicKey,
  }
}

export function useTest() {
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
