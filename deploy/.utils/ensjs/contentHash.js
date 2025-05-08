import {
  decode,
  encode,
  getCodec,
} from '@ensdomains/content-hash'
import {  isHex } from 'viem'
import { InvalidContentHashError } from './errors.js'


/**
 * Supported protocol identifiers or `null`.
 * @typedef {'ipfs' | 'ipns' | 'bzz' | 'onion' | 'onion3' | 'sia' | 'ar' | null} ProtocolType
 */


/**
 * 
 * @param {string} text 
 * @returns 
 */
function matchProtocol(text) {
  return (
    text.match(/^(ipfs|sia|ipns|bzz|onion|onion3|arweave|ar):\/\/(.*)/) ||
    text.match(/\/(ipfs)\/(.*)/) ||
    text.match(/\/(ipns)\/(.*)/)
  )
}

/**
 * 
 * @param {string} encoded 
 * @returns {import('./contentHash.js').ProtocolType}
 */
export const getDisplayCodec = (encoded) => {
  const codec = getCodec(encoded)
  switch (codec) {
    case 'ipfs':
    case 'ipns':
    case 'onion':
    case 'onion3':
      return codec
    case 'swarm':
      return 'bzz'
    case 'skynet':
      return 'sia'
    case 'arweave':
      return 'ar'
    default:
      return null
  }
}

/**
 * 
 * @param {NonNullable<import('./contentHash.js').ProtocolType>} displayCodec 
 * @returns {import('@ensdomains/content-hash').Codec}
 */
export const getInternalCodec = (
  displayCodec,
) => {
  switch (displayCodec) {
    case 'bzz':
      return 'swarm'
    case 'sia':
      return 'skynet'
    case 'ar':
      return 'arweave'
    default:
      return displayCodec
  }
}

/**
 * 
 * @param {import('viem').Hex} encoded 
 * @returns {{  protocolType: ProtocolType; decoded: string}} | null}
 */
export function decodeContentHash(encoded) {
  if (!encoded || encoded === '0x') {
    return null
  }
  const decoded = decode(encoded)
  const protocolType = getDisplayCodec(encoded)
  return { protocolType, decoded }
}

/**
 * 
 * @param {unknown} encoded 
 * @returns {boolean}
 */
export function isValidContentHash(encoded) {
  if (typeof encoded !== 'string') return false
  const codec = getCodec(encoded)
  return Boolean(codec && isHex(encoded))
}

/**
 * 
 * @param {string} encoded 
 * @returns {{ protocolType: import('./contentHash.js').ProtocolType, decoded: string }} | null
 */
export function getProtocolType(encoded) {
  const matched = matchProtocol(encoded)
  if (!matched) return null

  const [, protocolType, decoded] = matched
  return { protocolType: /** @type {import('./contentHash.js').ProtocolType} */ (protocolType), decoded }
}

/**
 * 
 * @param {string} text 
 * @returns {import('viem').Hex}
 */
export function encodeContentHash(text) {
  const typeData = getProtocolType(text)
  if (!typeData) throw new InvalidContentHashError()

  const internalCodec = getInternalCodec(typeData.protocolType)

  // manual exceptions for onion/onion3 which are just utf8 encoded
  if (internalCodec === 'onion' && typeData.decoded.length !== 16)
    throw new InvalidContentHashError()
  if (internalCodec === 'onion3' && typeData.decoded.length !== 56)
    throw new InvalidContentHashError()

  return `0x${encode(internalCodec, typeData.decoded)}`
}
