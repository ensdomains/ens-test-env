export type ProtocolType =
  | 'ipfs'
  | 'ipns'
  | 'bzz'
  | 'onion'
  | 'onion3'
  | 'sia'
  | 'ar'
  | null

export type DecodedContentHash = {
  protocolType: ProtocolType
  decoded: string
}
