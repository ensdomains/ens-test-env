import {
  encodeAbiParameters,
  keccak256,
  pad,
  toBytes,
  toHex,
  zeroAddress,
} from 'viem'
import { labelhash, namehash } from 'viem/ens'
import {
  CampaignReferenceTooLargeError,
  ResolverAddressRequiredError,
} from './errors.js'
import { encodeFuses } from './fuses.js'
import {
  generateRecordCallArray,
} from './generateRecordCallArray.js'

/**
 * @typedef {Object} RegistrationParameters
 * @property {string} name - Name to register
 * @property {import('viem/accounts').Address} owner - Address to set owner to
 * @property {number} duration - Duration of registration
 * @property {import('viem').Hex} secret - Random 32 bytes to use for registration
 * @property {import('viem/accounts').Address} [resolverAddress] - Custom resolver address, defaults to current public resolver deployment
 * @property {import('./generateRecordCallArray.js').RecordOptions} [records] - Records to set upon registration
 * @property {boolean} [reverseRecord] - Sets primary name upon registration
 * @property {import('./fuses.js').EncodeChildFusesInputObject} [fuses] - Fuses to set upon registration
 */

/**
 * @typedef {[
 *   labelHash: import('viem').Hex,
 *   owner: import('viem/accounts').Address,
 *   duration: bigint,
 *   secret: import('viem').Hex,
 *   resolver: import('viem/accounts').Address,
 *   data: import('viem').Hex[],
 *   reverseRecord: boolean,
 *   ownerControlledFuses: number
 * ]} CommitmentTuple
 */

const cryptoRef =
  (typeof crypto !== 'undefined' && crypto) ||
  (typeof window !== 'undefined' &&
    typeof window.crypto !== 'undefined' &&
    window.crypto) ||
  undefined

/**
 * Generates a random secret.
 * @param {Object} [param0] - The parameters for generating the secret.
 * @param {string} [param0.platformDomain] - The platform domain.
 * @param {number} [param0.campaign] - The campaign number.
 * @returns {import('viem').Hex} The generated secret.
 */
export const randomSecret = ({
  platformDomain,
  campaign,
} = {}) => {
  const bytes = cryptoRef.getRandomValues(new Uint8Array(32))
  if (platformDomain) {
    const hash = toBytes(namehash(platformDomain))
    for (let i = 0; i < 4; i += 1) {
      bytes[i] = hash[i]
    }
  }
  if (campaign) {
    if (campaign > 0xffffffff)
      throw new CampaignReferenceTooLargeError({ campaign })
    const campaignBytes = pad(toBytes(campaign), { size: 4 })
    for (let i = 0; i < 4; i += 1) {
      bytes[i + 4] = campaignBytes[i]
    }
  }
  return toHex(bytes)
}

/**
 * Creates a commitment tuple.
 * @param {RegistrationParameters} params - The registration parameters.
 * @returns {CommitmentTuple} The commitment tuple.
 */
export const makeCommitmentTuple = ({
  name,
  owner,
  duration,
  resolverAddress = zeroAddress,
  records: { coins = [], ...records } = { texts: [], coins: [] },
  reverseRecord,
  fuses,
  secret,
}) => {
  const labelHash = labelhash(name.split('.')[0])
  const hash = namehash(name)
  const fuseData = fuses
    ? encodeFuses({ restriction: 'child', input: fuses })
    : 0

  if (
    reverseRecord &&
    !coins.find(
      (c) =>
        (typeof c.coin === 'string' && c.coin.toLowerCase() === 'eth') ||
        (typeof c.coin === 'string'
          ? Number.parseInt(c.coin) === 60
          : c.coin === 60),
    )
  ) {
    coins.push({ coin: 60, value: owner })
  }

  const data = records
    ? generateRecordCallArray({ namehash: hash, coins, ...records })
    : []

  if (data.length > 0 && resolverAddress === zeroAddress)
    throw new ResolverAddressRequiredError({
      data: {
        name,
        owner,
        duration,
        resolverAddress,
        records,
        reverseRecord,
        fuses,
      },
    })

  return [
    labelHash,
    owner,
    BigInt(duration),
    secret,
    resolverAddress,
    data,
    !!reverseRecord,
    fuseData,
  ]
}

/**
 * Creates a registration tuple.
 * @param {RegistrationParameters} params - The registration parameters.
 * @returns {[
 *   label: string,
 *   owner: import('viem/accounts').Address,
 *   duration: bigint,
 *   secret: import('viem').Hex,
 *   resolver: import('viem/accounts').Address,
 *   data: import('viem').Hex[],
 *   reverseRecord: boolean,
 *   ownerControlledFuses: number
 * ]} The registration tuple.
 */
export const makeRegistrationTuple = (
  params,
) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_labelhash, ...commitmentData] = makeCommitmentTuple(params)
  const label = params.name.split('.')[0]
  return [label, ...commitmentData]
}

/**
 * Creates a commitment from a tuple.
 * @param {[
 *   labelHash: import('viem').Hex,
 *   owner: import('viem/accounts').Address,
 *   duration: bigint,
 *   secret: import('viem').Hex,
 *   resolver: import('viem/accounts').Address,
 *   data: import('viem').Hex[],
 *   reverseRecord: boolean,
 *   ownerControlledFuses: number
 * ]} params - The commitment tuple.
 * @returns {import('viem').Hex} The commitment.
 */
export const makeCommitmentFromTuple = (params) => {
  return keccak256(
    encodeAbiParameters(
      [
        { name: 'name', type: 'bytes32' },
        { name: 'owner', type: 'address' },
        { name: 'duration', type: 'uint256' },
        { name: 'secret', type: 'bytes32' },
        { name: 'resolver', type: 'address' },
        { name: 'data', type: 'bytes[]' },
        { name: 'reverseRecord', type: 'bool' },
        { name: 'ownerControlledFuses', type: 'uint16' },
      ],
      params,
    ),
  )
}

/**
 * Creates a commitment.
 * @param {RegistrationParameters} params - The registration parameters.
 * @returns {import('viem').Hex} The commitment.
 */
export const makeCommitment = (params) =>
  makeCommitmentFromTuple(makeCommitmentTuple(params))
