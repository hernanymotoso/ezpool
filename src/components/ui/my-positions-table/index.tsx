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

export default function MyPositionsTable() {
  const { data: positions } = whirlpoolProgram.useFetchPositions()

  const formatBigInt = (value: bigint) => {
    return Number(value).toLocaleString()
  }

  console.log('positions', positions)

  return (
    <Card className="p-4 bg-[#0b0f1a] rounded-lg shadow-md">
      <Table className="w-full text-left text-gray-200">
        <TableHeader className="bg-[#111827] text-gray-400">
          <TableRow>
            <TableHead>Position mint</TableHead>
            <TableHead>Pool address</TableHead>
            <TableHead>Liquidity</TableHead>
            <TableHead>Fee Owned A</TableHead>
            <TableHead>Fee Owned B</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions?.positions.map((row, index) => (
            <TableRow
              key={index}
              className="border-b border-gray-700 hover:bg-gray-800"
            >
              <TableCell className="font-medium text-white">
                {row.position.data.positionMint}
              </TableCell>
              <TableCell className="font-medium text-white">
                {row.position.data.whirlpool}
              </TableCell>
              <TableCell className="font-medium text-white">
                {formatBigInt(row.position.data.liquidity)}
              </TableCell>
              <TableCell className="font-medium text-white">
                {formatBigInt(row.position.data.feeOwedA)}
              </TableCell>
              <TableCell className="font-medium text-white">
                {formatBigInt(row.position.data.feeOwedB)}
              </TableCell>

              {/* <TableCell className="font-medium text-white">
                {row.pool}
              </TableCell>
              <TableCell className="flex items-center gap-2">
                {row.feeRate}
              </TableCell>
              <TableCell>{row.liquidityC}</TableCell> */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
