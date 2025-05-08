export type Name = {
  label: string
  namedOwner: string
  namedAddr: string
  subname?: string
  namedController?: string
  resolver?: Address
  records?: {
    text?: {
      key: string
      value: string
    }[]
    addr?: {
      key: bigint
      value: Hash
    }[]
    contenthash?: Hash
    abi?:
      | {
          contentType: bigint
          data: any
        }
      | {
          contentType: bigint
          data: any
        }[]
  }
  subnames?: {
    label: string
    namedOwner: string
  }[]
  customDuration?: bigint
}
