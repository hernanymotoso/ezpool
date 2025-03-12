'use client'
import LiquidityTable from '../ui/liquidity-table'
import MyPositionsTable from '../ui/my-positions-table'
import { CreatePoolForm } from '../ui/create-pool-form'
import { CreatePositionForm } from '../ui/create-position-form'
import { ClosePositionForm } from '../ui/close-position-form'

export function WhirlpoolData() {
  // Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr

  return (
    <>
      <div className="flex flex-col gap-4 mt-4">
        <h1>Available Pools</h1>
        <LiquidityTable />
      </div>

      <div className="flex flex-col gap-4 mt-4">
        <CreatePoolForm />
      </div>

      <div className="flex flex-col gap-4 mt-10">
        <h1>My positions</h1>
        <MyPositionsTable />
      </div>

      <div className="flex flex-col gap-4 mt-2">
        <CreatePositionForm />
      </div>
      <div className="flex flex-col gap-4 mt-2">
        <ClosePositionForm />
      </div>

      <div className={'space-y-6'}>
        {/* <button
          onClick={() =>
            createPool({
              tokenMintA: '68sfq2YwWmrhjXGNok5Nk2wPDGC4QvE74AxRuXAKHvu5',
              tokenMintB: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
              tickSpacing: 10,
              initialPrice: 1,
            })
          }
        >
          Create pool
        </button> */}
        {/* <button
          onClick={() =>
            mutate({
              poolAddress: '4p1VLUoJFDNqyrhm1kx82XwtuXbwyfRRWrGbNjfBZrEH',
              liquidity: BigInt('1000'),
            })
          }
        >
          Create position
        </button> */}
        {/* <button
          onClick={() =>
            closePosition({
              positionMintAddress:
                'FGG3XzZVnZYmZxgNQuLexzUFrji6gY5RQ3P7gAjog1Hq',
            })
          }
        >
          Close position
        </button> */}
      </div>
    </>
  )
}
