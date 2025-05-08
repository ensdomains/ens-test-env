import {
  type Address,
  type Hex,
  type Prettify,
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
  namehash: Hex
  key: string
  value: string | null
}

export type EncodeSetTextReturnType = Hex

export const encodeSetText = ({
  namehash,
  key,
  value,
}: EncodeSetTextParameters): EncodeSetTextReturnType => {
  return encodeFunctionData({
    abi: publicResolverSetTextSnippet,
    functionName: 'setText',
    args: [namehash, key, value ?? ''],
  })
}

type AbiContentType = 1 | 2 | 4 | 8
export type EncodedAbi<TContentType extends AbiContentType = AbiContentType> = {
  contentType: TContentType
  encodedData: Hex
}

export type EncodeSetAddrParameters = {
  namehash: Hex
  coin: string | number
  value: Address | string | null
}

export type RecordOptions = Prettify<{
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

export const encodeClearRecords = (namehash: Hex) =>
  encodeFunctionData({
    abi: publicResolverClearRecordsSnippet,
    functionName: 'clearRecords',
    args: [namehash],
  })

export type EncodeSetAddrReturnType = Hex

export const encodeSetAddr = ({
  namehash,
  coin,
  value,
}: EncodeSetAddrParameters): EncodeSetAddrReturnType => {
  const coder = getCoderFromCoin(coin)
  const inputCoinType = coder.coinType
  let encodedAddress: Hex | Uint8Array = value ? coder.decode(value) : '0x'
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

export type EncodeSetAbiParameters = {
  namehash: Hex
} & EncodedAbi

export type EncodeSetAbiReturnType = Hex

export const encodeSetAbi = ({
  namehash,
  contentType,
  encodedData,
}: EncodeSetAbiParameters): EncodeSetAbiReturnType => {
  return encodeFunctionData({
    abi: publicResolverSetAbiSnippet,
    functionName: 'setABI',
    args: [namehash, BigInt(contentType), encodedData],
  })
}

export type EncodeSetContentHashParameters = {
  namehash: Hex
  contentHash: string | null
}

export type EncodeSetContentHashReturnType = Hex

export const encodeSetContentHash = ({
  namehash,
  contentHash,
}: EncodeSetContentHashParameters): EncodeSetContentHashReturnType => {
  let encodedHash: Hex = '0x'
  if (contentHash) {
    encodedHash = encodeContentHash(contentHash)
  }
  return encodeFunctionData({
    abi: publicResolverSetContenthashSnippet,
    functionName: 'setContenthash',
    args: [namehash, encodedHash],
  })
}

export const generateRecordCallArray = ({
  namehash,
  clearRecords,
  contentHash,
  texts,
  coins,
  abi,
}: { namehash: Hex } & RecordOptions): Hex[] => {
  const calls: Hex[] = []

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
      const data = encodeSetAbi({ namehash, ...abi_ } as EncodeSetAbiParameters)
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
