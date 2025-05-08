import type { RegistrationParameters } from '@ensdomains/ens-contracts'
import type { RecordOptions } from '@ensdomains/ens-contracts/dist/types/contracts/registry/ENSRegistry'
import type { Hex } from 'viem'
import type { Account } from 'viem/accounts'

export type Name = {
  name: string
  namedOwner: string
  reverseRecord?: boolean
  records?: RecordOptions
  fuses?: RegistrationParameters['fuses']
  customDuration?: number
  subnames?: {
    label: string
    namedOwner: string
    fuses?: number
    expiry?: number
  }[]
}

export type ProcessedSubname = {
  label: string
  owner: Account
  expiry: number
  fuses: number
}

export type ProcessedNameData = Omit<RegistrationParameters, 'owner'> & {
  label: string
  subnames: ProcessedSubname[]
  resolverAddress: Address
  secret: Hex
  duration: number
  owner: Account
  name: string
  fuses?: RegistrationParameters['fuses']
}
