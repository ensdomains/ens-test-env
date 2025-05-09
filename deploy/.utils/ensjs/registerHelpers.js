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
import {  encodeFuses } from './fuses.js'
import {
  generateRecordCallArray,
} from './generateRecordCallArray.js'

export type RegistrationParameters = {
  /** Name to register */
  name: string
  /** Address to set owner to */
  owner: import('viem/accounts').Address
  /** Duration of registration */
  duration: number
  /** Random 32 bytes to use for registration */
  secret: import('viem').Hex
  /** Custom resolver address, defaults to current public resolver deployment */
  resolverAddress?: import('viem/accounts').Address
  /** Records to set upon registration */
  records?: import('./generateRecordCallArray.js').RecordOptions
  /** Sets primary name upon registration */
  reverseRecord?: boolean
  /** Fuses to set upon registration */
  fuses?: import('./fuses.js').EncodeChildFusesInputObject
}


const cryptoRef =
  (typeof crypto !== 'undefined' && crypto) ||
  (typeof window !== 'undefined' &&
    typeof window.crypto !== 'undefined' &&
    window.crypto) ||
  undefined

  /**
   * 
   * @param {{
  platformDomain?: string
  campaign?: number
}} param0 
   * @returns 
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

export const makeCommitmentTuple = ({
  name,
  owner,
  duration,
  resolverAddress = zeroAddress,
  records: { coins = [], ...records } = { texts: [], coins: [] },
  reverseRecord,
  fuses,
  secret,
}: RegistrationParameters): CommitmentTuple => {
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
 * 
 * @param {*} params 
 * @returns {[
  label: string,
  owner: import('viem/accounts').Address,
  duration: bigint,
  secret: import('viem').Hex,
  resolver: import('viem/accounts').Address,
  data: import('viem').Hex[],
  reverseRecord: boolean,
  ownerControlledFuses: number,
]}
 */
export const makeRegistrationTuple = (
  params: RegistrationParameters,
) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_labelhash, ...commitmentData] = makeCommitmentTuple(params)
  const label = params.name.split('.')[0]
  return [label, ...commitmentData]
}

/**
 * 
 * @param {[
  labelHash: import('viem').Hex,
  owner: import('viem/accounts').Address,
  duration: bigint,
  secret: import('viem').Hex,
  resolver: import('viem/accounts').Address,
  data: import('viem').Hex[],
  reverseRecord: boolean,
  ownerControlledFuses: number,
]} params 
 * @returns {import('viem').Hex}
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
 * 
 * @param {*} params 
 * @returns {import('viem').Hex}
 */
export const makeCommitment = (params: RegistrationParameters) =>
  makeCommitmentFromTuple(makeCommitmentTuple(params))
