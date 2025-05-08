import {
  bytesToHex,
  encodeFunctionData,
  zeroAddress,
} from 'viem'
import { getCoderFromCoin } from './coinId.js'
import { encodeContentHash } from './contentHash.js'
import {
  publicResolverClearRecordsSnippet,
  publicResolverSetAbiSnippet,
  publicResolverSetAddrSnippet,
  publicResolverSetContenthashSnippet,
  publicResolverSetTextSnippet,
} from './contracts.js'

export type EncodeSetTextParameters = {
  namehash: import('viem').Hex
  key: string
  value: string | null
}

/**
 * 
 * @param {EncodeSetAbiParameters} param0 
 * @returns {import('viem').Hex}
 */
export const encodeSetText = ({
  namehash,
  key,
  value,
}: EncodeSetTextParameters) => {
  return encodeFunctionData({
    abi: publicResolverSetTextSnippet,
    functionName: 'setText',
    args: [namehash, key, value ?? ''],
  })
}

type AbiContentType = 1 | 2 | 4 | 8
export type EncodedAbi<TContentType extends AbiContentType = AbiContentType> = {
  contentType: TContentType
  encodedData: import('viem').Hex
}

export type EncodeSetAddrParameters = {
  namehash: import('viem').Hex
  coin: string | number
  value: import('hardhat-deploy/types.js').Address | string | null
}

export type RecordOptions = import('viem').Prettify<{
  /** Clears all current records */
  clearRecords?: boolean
  /** ContentHash value */
  contentHash?: string | null
  /** Array of text records */
  texts?: Omit<EncodeSetTextParameters, 'namehash'>[]
  /** Array of coin records */
  coins?: Omit<EncodeSetAddrParameters, 'namehash'>[]
  /** ABI value */
  abi?: EncodedAbi | EncodedAbi[]
}>

export const encodeClearRecords = (namehash: import('viem').Hex) =>
  encodeFunctionData({
    abi: publicResolverClearRecordsSnippet,
    functionName: 'clearRecords',
    args: [namehash],
  })

/**
 * 
 * @param {EncodeSetAddrParameters} param0 
 * @returns {import('viem').Hex}
 */
export const encodeSetAddr = ({
  namehash,
  coin,
  value,
 }) => {
  const coder = getCoderFromCoin(coin)
  const inputCoinType = coder.coinType
  /**
   * @type { import('viem').Hex | Uint8Array}
   */
  let encodedAddress = value ? coder.decode(value) : '0x'
  if (inputCoinType === 60 && encodedAddress === '0x')
    encodedAddress = coder.decode(zeroAddress)
  if (typeof encodedAddress !== 'string') {
    encodedAddress = bytesToHex(encodedAddress)
  }

  return encodeFunctionData({
    abi: publicResolverSetAddrSnippet,
    functionName: 'setAddr',
    args: [namehash, BigInt(inputCoinType), encodedAddress],
  })
}

/**
 * 
 * @param {{ namehash: import('viem').Hex} & EncodedAbi} param0 
 * @returns {import('viem').Hex}
 */
export const encodeSetAbi = ({
  namehash,
  contentType,
  encodedData,
}) => {
  return encodeFunctionData({
    abi: publicResolverSetAbiSnippet,
    functionName: 'setABI',
    args: [namehash, BigInt(contentType), encodedData],
  })
}

/**
 * 
 * @param {{namehash: import('viem').Hex; contentHash: string | null}} param0 
 * @returns {import('viem').Hex}
 */
export const encodeSetContentHash = ({
  namehash,
  contentHash,
}) => {
  /**
   * @type {import('viem').Hex}
   */
  let encodedHash = '0x'
  if (contentHash) {
    encodedHash = encodeContentHash(contentHash)
  }
  return encodeFunctionData({
    abi: publicResolverSetContenthashSnippet,
    functionName: 'setContenthash',
    args: [namehash, encodedHash],
  })
}
/**
 * 
 * @param {{ namehash: import('viem').Hex } & RecordOptions} param0 
 * @returns {import('viem').Hex[]}
 */
export const generateRecordCallArray = ({
  namehash,
  clearRecords,
  contentHash,
  texts,
  coins,
  abi,
}) => {
  /**
   * @type {import('viem').Hex[]}
   */
  const calls = []

  if (clearRecords) {
    calls.push(encodeClearRecords(namehash))
  }

  if (contentHash !== undefined) {
    const data = encodeSetContentHash({ namehash, contentHash })
    if (data) calls.push(data)
  }

  if (abi !== undefined) {
    const abis = Array.isArray(abi) ? abi : [abi]
    for (const abi_ of abis) {
      const data = encodeSetAbi({ namehash, ...abi_ })
      if (data) calls.push(data)
    }
  }

  if (texts && texts.length > 0) {
    const data = texts.map((textItem) =>
      encodeSetText({ namehash, ...textItem }),
    )
    if (data) calls.push(...data)
  }

  if (coins && coins.length > 0) {
    const data = coins.map((coinItem) =>
      encodeSetAddr({ namehash, ...coinItem }),
    )
    if (data) calls.push(...data)
  }

  return calls
}
