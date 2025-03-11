import { WHIRLPOOL_PROGRAM_ID } from '@project/anchor'
import {
  assertAccountsExist,
  createSolanaRpc,
  decodeAccount as decodeAccount2,
  decodeAccount as decodeAccount3,
  fetchEncodedAccounts as fetchEncodedAccounts2,
  fetchEncodedAccounts as fetchEncodedAccounts3,
  fixDecoderSize as fixDecoderSize2,
  fixDecoderSize as fixDecoderSize3,
  getAddressDecoder as getAddressDecoder3,
  getAddressDecoder as getAddressDecoder4,
  getArrayDecoder as getArrayDecoder3,
  getBytesDecoder as getBytesDecoder2,
  getBytesDecoder as getBytesDecoder3,
  getI32Decoder,
  getStructDecoder as getStructDecoder2,
  getStructDecoder as getStructDecoder7,
  getStructDecoder as getStructDecoder8,
  getU128Decoder,
  getU128Decoder as getU128Decoder4,
  getU64Decoder,
  getU64Decoder as getU64Decoder2,
} from '@solana/kit'
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Connection, PublicKey, TokenAccountsFilter } from '@solana/web3.js'

interface PositionData {
  position: any
  tokenProgram: PublicKey
  isPositionBundle: boolean
  positions?: any[]
}

export async function fetchPositionsForOwner(
  connection: Connection,
  owner: string,
) {
  const ownerPublicKey = new PublicKey(owner)

  const tokenFilters: TokenAccountsFilter = { programId: TOKEN_PROGRAM_ID }
  const token2022Filters: TokenAccountsFilter = {
    programId: TOKEN_2022_PROGRAM_ID,
  }

  const [tokenAccounts, token2022Accounts] = await Promise.all([
    connection.getParsedTokenAccountsByOwner(ownerPublicKey, tokenFilters),
    connection.getParsedTokenAccountsByOwner(ownerPublicKey, token2022Filters),
  ])

  const potentialTokens = [...tokenAccounts.value, ...token2022Accounts.value]
    .map(x => ({
      mint: new PublicKey(x.account.data.parsed.info.mint),
      amount: BigInt(x.account.data.parsed.info.tokenAmount.amount),
      tokenProgram: x.account.owner,
    }))
    .filter(x => x.amount === BigInt(1))

  const positionAddresses = await Promise.all(
    potentialTokens.map(async x => await getPositionAddress(x.mint)),
  )

  const positionBundleAddresses = await Promise.all(
    potentialTokens.map(async x => await getPositionBundleAddress(x.mint)),
  )

  const [positions, positionBundles] = await Promise.all([
    fetchAllMaybePosition(connection, positionAddresses),
    fetchAllMaybePositionBundle(connection, positionBundleAddresses),
  ])

  const bundledPositionAddressesPromises = positionBundles
    .filter(x => x?.address && x?.data?.positionBitmap)
    .map(async x => await getPositionInBundleAddresses(x.data))

  const bundledPositionAddressesArrays = await Promise.all(
    bundledPositionAddressesPromises,
  )
  const bundledPositionAddresses = bundledPositionAddressesArrays.flat()

  const bundledPositions = await fetchAllPosition(
    connection,
    bundledPositionAddresses,
  )

  const bundledPositionMap = new Map<PublicKey, any[]>()
  bundledPositions.forEach(pos => {
    if (!pos?.data?.positionMint) return
    const current =
      bundledPositionMap.get(pos.data.positionMint.toString() as any) || []
    bundledPositionMap.set(pos.data.positionMint.toString() as any, [
      ...current,
      pos,
    ])
  })

  const positionsOrBundles: PositionData[] = []

  for (let i = 0; i < potentialTokens.length; i++) {
    const position = positions[i]
    const positionBundle = positionBundles[i]
    const token = potentialTokens[i]

    if (position?.address) {
      positionsOrBundles.push({
        position,
        tokenProgram: token.tokenProgram,
        isPositionBundle: false,
      })
    }

    if (positionBundle?.address && positionBundle?.data?.positionBundleMint) {
      const bundled =
        bundledPositionMap.get(
          positionBundle.data.positionBundleMint.toString() as any,
        ) || []
      positionsOrBundles.push({
        position: positionBundle,
        positions: bundled,
        tokenProgram: token.tokenProgram,
        isPositionBundle: true,
      })
    }
  }

  return positionsOrBundles
}

export function _POSITION_BUNDLE_SIZE(): number {
  return 256 >>> 0
}

async function getPositionAddress(positionMint: PublicKey) {
  const positionMintPublicKey = positionMint
  const [positionAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('position'), positionMintPublicKey.toBuffer()],
    WHIRLPOOL_PROGRAM_ID,
  )
  return positionAddress
}

async function getPositionBundleAddress(positionBundleMint: PublicKey) {
  const positionBundleMintPublicKey = positionBundleMint
  const [positionBundleAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('position_bundle'), positionBundleMintPublicKey.toBuffer()],
    WHIRLPOOL_PROGRAM_ID,
  )
  return positionBundleAddress
}

async function getPositionInBundleAddresses(
  positionBundle: any,
): Promise<PublicKey[]> {
  const buffer = Buffer.from(positionBundle.positionBitmap)
  const positions: Array<Promise<PublicKey>> = []

  for (let i = 0; i < _POSITION_BUNDLE_SIZE(); i++) {
    const byteIndex = Math.floor(i / 8)
    const bitIndex = i % 8

    if (buffer[byteIndex] & (1 << bitIndex)) {
      positions.push(
        getBundledPositionAddress(positionBundle.positionBundleMint, i).then(
          positionAddress => positionAddress,
        ),
      )
    }
  }
  return await Promise.all(positions)
}

async function getBundledPositionAddress(
  positionBundleMint: PublicKey,
  index: number,
): Promise<PublicKey> {
  const [positionAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('position_bundle'),
      positionBundleMint.toBuffer(),
      Buffer.from([index]),
    ],
    WHIRLPOOL_PROGRAM_ID,
  )
  return positionAddress
}

async function fetchAllMaybePositionBundle(
  connection: Connection,
  addresses: PublicKey[],
  config?: any,
) {
  const rpc = createSolanaRpc(connection.rpcEndpoint)
  const addrs = addresses.map(addr => addr.toString())

  const maybeAccounts = await fetchEncodedAccounts3(rpc, addrs as any, config)
  return maybeAccounts.map(maybeAccount => decodePositionBundle(maybeAccount))
}

function decodePositionBundle(encodedAccount: any) {
  return decodeAccount3(encodedAccount, getPositionBundleDecoder())
}

function getPositionBundleDecoder() {
  return getStructDecoder8([
    ['discriminator', fixDecoderSize3(getBytesDecoder3(), 8)],
    ['positionBundleMint', getAddressDecoder4()],
    ['positionBitmap', fixDecoderSize3(getBytesDecoder3(), 32)],
  ])
}

async function fetchAllPosition(
  connection: Connection,
  addresses: PublicKey[],
  config?: any,
) {
  const maybeAccounts = await fetchAllMaybePosition(
    connection,
    addresses,
    config,
  )
  assertAccountsExist(maybeAccounts as any)
  return maybeAccounts
}

async function fetchAllMaybePosition(
  connection: Connection,
  addresses: PublicKey[],
  config?: any,
) {
  const rpc = createSolanaRpc(connection.rpcEndpoint)
  const addrs = addresses.map(addr => addr.toString())
  const maybeAccounts = await fetchEncodedAccounts2(rpc, addrs as any, config)
  return maybeAccounts.map(maybeAccount => decodePosition(maybeAccount))
}

function decodePosition(encodedAccount: any) {
  return decodeAccount2(encodedAccount, getPositionDecoder())
}

function getPositionRewardInfoDecoder() {
  return getStructDecoder2([
    ['growthInsideCheckpoint', getU128Decoder()],
    ['amountOwed', getU64Decoder()],
  ])
}

function getPositionDecoder() {
  return getStructDecoder7([
    ['discriminator', fixDecoderSize2(getBytesDecoder2(), 8)],
    ['whirlpool', getAddressDecoder3()],
    ['positionMint', getAddressDecoder3()],
    ['liquidity', getU128Decoder4()],
    ['tickLowerIndex', getI32Decoder()],
    ['tickUpperIndex', getI32Decoder()],
    ['feeGrowthCheckpointA', getU128Decoder4()],
    ['feeOwedA', getU64Decoder2()],
    ['feeGrowthCheckpointB', getU128Decoder4()],
    ['feeOwedB', getU64Decoder2()],
    [
      'rewardInfos',
      getArrayDecoder3(getPositionRewardInfoDecoder(), { size: 3 }),
    ],
  ])
}
