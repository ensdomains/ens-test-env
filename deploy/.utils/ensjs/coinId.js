import {
  getCoderByCoinName,
  getCoderByCoinType,
} from '@ensdomains/address-encoder'
import { CoinFormatterNotFoundError } from './errors.js'

/**
 * 
 * @param {string | number} coinId
 * @returns {{type: 'id', value: number} | {type: 'name', value: string}}
 */
export const normaliseCoinId = (coinId) => {
  const isString = typeof coinId === 'string'

  if (isString && Number.isNaN(Number.parseInt(coinId))) {
    return {
      type: 'name',
      value: coinId.toLowerCase().replace(/legacy$/, 'Legacy'),
    }
  }
  return {
    type: 'id',
    value: isString ? Number.parseInt(coinId) : (coinId),
  }
}
/**
 * 
 * @param {string | number} coinId
 * @returns {import('@ensdomains/address-encoder').Coin}
 */
export const getCoderFromCoin = (coinId) => {
  const normalisedCoin = normaliseCoinId(coinId)
  /**
   * @type {import('@ensdomains/address-encoder').Coin}
   */
  let coder
  try {
    coder =
      normalisedCoin.type === 'id'
        ? getCoderByCoinType(normalisedCoin.value)
        : getCoderByCoinName(normalisedCoin.value)
  } catch {
    throw new CoinFormatterNotFoundError({ coinType: coinId })
  }

  return coder
}
