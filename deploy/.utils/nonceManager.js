/**
 * @template T
 * @typedef {Awaited<ReturnType<import('hardhat')['viem']['getNamedClients']>>} NamedClients
 */

/**
 * @template T
 * @typedef {(nonce: number) => (data: T, index: number) => Promise<number>} NonceFunction
 */

/**
 * @template T
 * @typedef {(
*   allNamedClients: NamedClients<T>,
*   allNameData: T[]
* ) => (
*   property: keyof T,
*   func: NonceFunction<T>,
*   filter?: (data: T) => boolean,
*   nonceMap?: Record<string, number>
* ) => Promise<Record<string, number>>} NonceManager
*/

/**
* @type {<T>(...args: Parameters<NonceManager<T>>) => ReturnType<NonceManager<T>>}
*/
export const nonceManager = (
    allNamedClients,
    allNameData,
  ) =>
  async (
    property,
    func,
    filter,
    nonceMap,
  ) => {
    const newNonceMap = nonceMap || {}
    for (const client of Object.values(allNamedClients)) {
      const account = client.account
      const address = account.address
      const namesWithAccount = allNameData.filter((data) => {
        const propertyValue = data[property]
        if (typeof propertyValue === 'string') {
          if (propertyValue !== address) return false
        } else if (typeof propertyValue === 'object') {
          if (propertyValue === null) return false
          if (!('address' in propertyValue)) return false
          if (propertyValue.address !== address) return false
        } else {
          return false
        }
        if (filter) return filter(data)
        return true
      })
      if (!newNonceMap[address]) {
        const nonce = await client.public.getTransactionCount({ address })
        newNonceMap[address] = nonce
      }
      let usedNonces = 0

      for (let i = 0; i < namesWithAccount.length; i += 1) {
        const data = namesWithAccount[i]
        usedNonces += await func(newNonceMap[address])(data, usedNonces)
      }
      newNonceMap[address] += usedNonces
    }
    return newNonceMap
  }
