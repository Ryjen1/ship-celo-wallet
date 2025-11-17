import { defineChain } from 'viem'

export const celo = defineChain({
  id: 42220,
  name: 'Celo',
  nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://forno.celo.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Celo Explorer', url: 'https://celoscan.io' },
  },
})

export const celoAlfajores = defineChain({
  id: 44787,
  name: 'Alfajores',
  nativeCurrency: { name: 'Alfajores Celo', symbol: 'CELO', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://alfajores-forno.celo-testnet.org'],
    },
  },
  blockExplorers: {
    default: { name: 'CeloScan Alfajores', url: 'https://alfajores.celoscan.io' },
  },
})
