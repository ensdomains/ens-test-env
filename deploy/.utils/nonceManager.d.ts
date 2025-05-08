import type hre from 'hardhat'
export declare const nonceManager: <T extends object>(
  allNamedClients: Awaited<ReturnType<(typeof hre)['viem']['getNamedClients']>>,
  allNameData: Array<T>,
) => (
  property: keyof T,
  func: (nonce: number) => (data: T, index: number) => Promise<number>,
  filter?: (data: T) => boolean,
  nonceMap?: Record<string, number>,
) => Promise<Record<string, number>>
