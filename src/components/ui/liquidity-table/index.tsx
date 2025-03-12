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
import { formatCurrency } from './helpers'

export default function LiquidityTable() {
  const { data: pools } = whirlpoolProgram.usePools({ perPage: 20, page: 1 })

  console.log('pools', pools)

  const tableData =
    pools?.accounts?.map(account => {
      const pool = account.account

      return {
        address: account.publicKey.toString(),
        pool: `${pool.tokenMintA.toString().slice(0, 4)}... / ${pool.tokenMintB
          .toString()
          .slice(0, 4)}...`,
        feeRate: `${(pool.feeRate / 10000).toFixed(3)}%`,
        liquidity: pool.liquidity.toString(),
        liquidityC: formatCurrency(Number(pool.liquidity)),
      }
    }) || []

  return (
    <Card className="p-4 bg-[#0b0f1a] rounded-lg shadow-md">
      <Table className="w-full text-left text-gray-200">
        <TableHeader className="bg-[#111827] text-gray-400">
          <TableRow>
            <TableHead>Pool address</TableHead>
            <TableHead>Pool</TableHead>
            <TableHead>Fee rate</TableHead>
            <TableHead>Liquidity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.map((row, index) => (
            <TableRow
              key={index}
              className="border-b border-gray-700 hover:bg-gray-800"
            >
              <TableCell className="font-medium text-white">
                {row.address}
              </TableCell>
              <TableCell className="font-medium text-white">
                {row.pool}
              </TableCell>
              <TableCell className="flex items-center gap-2">
                {row.feeRate}
              </TableCell>
              <TableCell>{row.liquidityC}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
