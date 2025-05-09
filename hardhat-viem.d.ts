import type { config } from './hardhat.config.js'

declare module '@nomicfoundation/hardhat-viem/types.js' {
  interface Register {
    config: config
  }
}
