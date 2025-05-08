type BaseErrorParameters = {
  metaMessages?: string[]
} & (
  | {
      cause?: never
      details?: string
    }
  | {
      cause: BaseError | Error
      details?: never
    }
)

export class BaseError extends Error {
  details: string

  metaMessages?: string[]

  shortMessage: string

  override name = 'EnsJsError'

  cause: BaseError | Error

  constructor(shortMesage: string, args: BaseErrorParameters = {}) {
    super()

    const details =
      args.cause instanceof BaseError
        ? args.cause.details
        : (args.cause?.message ?? args.details!)

    this.message = [
      shortMesage || 'An error occurred',
      '',
      ...(args.metaMessages ? [...args.metaMessages, ''] : []),
      ...(details ? [`Details: ${details}`, ''] : []),
    ].join('\n')

    if (args.cause) this.cause = args.cause
    this.details = details
    this.metaMessages = args.metaMessages
    this.shortMessage = shortMesage
  }
}

export class FusesOutOfRangeError extends BaseError {
  name = 'FusesOutOfRangeError'

  constructor({
    fuses,
    minimum = 0n,
    maximum = 2n ** 32n,
    details,
  }: {
    fuses: bigint
    minimum?: bigint
    maximum?: bigint
    details?: string
  }) {
    super('Fuse value out of range', {
      metaMessages: [
        `- Fuse value: ${fuses}`,
        `- Allowed range: ${minimum}-${maximum}`,
      ],
      details,
    })
  }
}

export class FusesRestrictionNotAllowedError extends BaseError {
  name = 'FusesRestrictionNotAllowed'

  constructor({
    fuses,
    details,
  }: {
    fuses: object | bigint
    details?: string
  }) {
    super('Restriction not allowed', {
      metaMessages: [`- Fuse value: ${fuses}`],
      details,
    })
  }
}

export class FusesInvalidFuseObjectError extends BaseError {
  name = 'FusesInvalidFuseObjectError'

  constructor({ fuses, details }: { fuses: object; details?: string }) {
    super('Invalid fuse value', {
      metaMessages: [`- Fuse value: ${fuses}`],
      details,
    })
  }
}

export class FusesValueRequiredError extends BaseError {
  name = 'FusesValueRequiredError'

  constructor() {
    super('Must specify at least one fuse')
  }
}

export class FusesInvalidNamedFuseError extends BaseError {
  name = 'FusesInvalidNamedFuseError'

  constructor({ fuse }: { fuse: string }) {
    super(`${fuse} is not a valid named fuse`)
  }
}

export class FusesFuseNotAllowedError extends BaseError {
  name = 'FusesFuseNotAllowedError'

  constructor({ fuse }: { fuse: string | bigint }) {
    super(`${fuse} is not allowed for this operation`)
  }
}

export class FusesInvalidUnnamedFuseError extends BaseError {
  name = 'FusesInvalidUnnamedFuseError'

  constructor({ fuse }: { fuse: unknown }) {
    super(`${fuse} is not a valid unnamed fuse`, {
      metaMessages: [
        '- If you are trying to set a named fuse, use the named property',
      ],
    })
  }
}

export class InvalidEncodedLabelError extends BaseError {
  name = 'InvalidEncodedLabelError'

  constructor({ label, details }: { label: string; details?: string }) {
    super('Invalid encoded label', {
      metaMessages: [`- Supplied label: ${label}`],
      details,
    })
  }
}

export class InvalidLabelhashError extends BaseError {
  name = 'InvalidLabelhashError'

  constructor({ labelhash, details }: { labelhash: string; details?: string }) {
    super('Invalid labelhash', {
      metaMessages: [`- Supplied labelhash: ${labelhash}`],
      details,
    })
  }
}

export class NameWithEmptyLabelsError extends BaseError {
  name = 'NameWithEmptyLabelsError'

  constructor({ name, details }: { name: string; details?: string }) {
    super('Name cannot have empty labels', {
      metaMessages: [`- Supplied name: ${name}`],
      details,
    })
  }
}

export class RootNameIncludesOtherLabelsError extends BaseError {
  name = 'RootNameIncludesOtherLabelsError'

  constructor({ name }: { name: string }) {
    super('Root name cannot have other labels', {
      metaMessages: [`- Supplied name: ${name}`],
    })
  }
}

export class WrappedLabelTooLargeError extends BaseError {
  name = 'WrappedLabelTooLargeError'

  constructor({ label, byteLength }: { label: string; byteLength: number }) {
    super('Supplied label was too long', {
      metaMessages: [
        `- Supplied label: ${label}`,
        '- Max byte length: 255',
        `- Actual byte length: ${byteLength}`,
      ],
    })
  }
}

export class CampaignReferenceTooLargeError extends BaseError {
  name = 'CampaignReferenceTooLargeError'

  constructor({ campaign }: { campaign: number }) {
    super(`Campaign reference ${campaign} is too large`, {
      metaMessages: [`- Max campaign reference: ${0xffffffff}`],
    })
  }
}

export class InvalidContentHashError extends BaseError {
  name = 'InvalidContentHashError'

  constructor() {
    super('Invalid content hash')
  }
}

export class UnknownContentTypeError extends BaseError {
  name = 'UnknownContentTypeError'

  constructor({ contentType }: { contentType: string }) {
    super(`Unknown content type: ${contentType}`)
  }
}

export class ResolverAddressRequiredError extends BaseError {
  name = 'ResolverAddressRequiredError'

  constructor({ data }: { data: object }) {
    super('Resolver address is required when data is supplied', {
      metaMessages: [
        'Supplied data:',
        ...Object.entries(data).map(([k, v]) => `- ${k}: ${v}`),
      ],
    })
  }
}

export class CoinFormatterNotFoundError extends BaseError {
  coinType: string | number

  override name = 'CoinFormatterNotFoundError'

  constructor({ coinType }: { coinType: string | number }) {
    super(`Coin formatter not found for ${coinType}`)
    this.coinType = coinType
  }
}
