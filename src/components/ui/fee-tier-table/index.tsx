import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import * as whirlpoolProgram from '@/hooks/whirlpool'

export const FEE_RATE_RATIO = 100 // 100 basis points = 1%

export default function FeeTierTable() {
  const { data: feeTiers } = whirlpoolProgram.useFeeTiers()
  console.log({ feeTiers })

  const formatFeeRate = (feeRate: number) => {
    return `${(feeRate / FEE_RATE_RATIO).toFixed(2)}%`
  }

  const formatTickSpacing = (tickSpacing: number) => {
    return tickSpacing.toString()
  }

  return (
    <Card className="p-4 bg-[#0b0f1a] rounded-lg shadow-md">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">Fee Tiers</h2>
        <p className="text-gray-400 text-sm">
          Available fee tiers for liquidity pools
        </p>
      </div>

      <Table className="w-full text-left text-gray-200">
        <TableHeader className="bg-[#111827] text-gray-400">
          <TableRow>
            <TableHead>Tick Spacing</TableHead>
            <TableHead>Fee Rate</TableHead>
            <TableHead>Fee Tier Address</TableHead>
            <TableHead>Whirlpool Config</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feeTiers?.accounts?.map(feeTier => (
            <TableRow
              key={feeTier.publicKey.toString()}
              className="border-b border-gray-700 hover:bg-gray-800"
            >
              <TableCell className="font-medium text-white">
                {formatTickSpacing(feeTier.account.tickSpacing)}
              </TableCell>
              <TableCell className="font-medium text-white">
                {formatFeeRate(feeTier.account.defaultFeeRate)}
              </TableCell>
              <TableCell className="font-medium text-white">
                {feeTier.publicKey.toString()}
              </TableCell>
              <TableCell className="font-medium text-white">
                {feeTier.account.whirlpoolsConfig.toString()}
              </TableCell>
            </TableRow>
          ))}
          {!feeTiers?.accounts?.length && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-gray-400 py-4">
                No fee tiers found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
