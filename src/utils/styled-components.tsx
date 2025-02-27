'use client'

import StyledComponentsRegistry from '@/lib/registry'
import { GlobalStyle } from '@/styles/global'
import { ReactNode } from 'react'

export function StyledComponents({ children }: { children: ReactNode }) {
  return (
    <StyledComponentsRegistry>
      <GlobalStyle />
      {children}
    </StyledComponentsRegistry>
  )
}
