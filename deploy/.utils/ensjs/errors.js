

export class BaseError extends Error {
  /**
   * @type {string}
   */
  details

  /**
   * @type {string[] | undefined}
   */
  metaMessages

  /**
   * @type {string}
   */
  shortMessage

  name = 'EnsJsError'

  /**
   * @type {BaseError | Error}
   */
  cause

  /**
   * 
   * @param {string} shortMesage 
   * @param {import('./errors.js').BaseErrorParameters} args 
   */
  constructor(shortMesage, args = {}) {
    super()

    const details =
      args.cause instanceof BaseError
        ? args.cause.details
        : (args.cause?.message ?? args.details)

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

  /**
   * 
   * @param {{
    fuses: bigint
    minimum?: bigint
    maximum?: bigint
    details?: string
  }} param0 
   */
  constructor({
    fuses,
    minimum = 0n,
    maximum = 2n ** 32n,
    details,
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

  /**
   * 
   * @param {{
    fuses: object | bigint
    details?: string
  }} param0 
   */
  constructor({
    fuses,
    details,
  }) {
    super('Restriction not allowed', {
      metaMessages: [`- Fuse value: ${fuses}`],
      details,
    })
  }
}

export class FusesInvalidFuseObjectError extends BaseError {
  name = 'FusesInvalidFuseObjectError'

  /**
   * 
   * @param {{ fuses: object; details?: string }} param0 
   */
  constructor({ fuses, details }) {
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

  /**
   * 
   * @param {{ fuse: string }} param0 
   */
  constructor({ fuse }) {
    super(`${fuse} is not a valid named fuse`)
  }
}

export class FusesFuseNotAllowedError extends BaseError {
  name = 'FusesFuseNotAllowedError'

  /**
   * 
   * @param {{ fuse: string | bigint }} param0 
   */
  constructor({ fuse }) {
    super(`${fuse} is not allowed for this operation`)
  }
}

export class FusesInvalidUnnamedFuseError extends BaseError {
  name = 'FusesInvalidUnnamedFuseError'

  /**
   * 
   * @param {{ fuse: unknown }} param0 
   */
  constructor({ fuse }) {
    super(`${fuse} is not a valid unnamed fuse`, {
      metaMessages: [
        '- If you are trying to set a named fuse, use the named property',
      ],
    })
  }
}

export class InvalidLabelhashError extends BaseError {
  name = 'InvalidLabelhashError'

  /**
   * 
   * @param {{ labelhash: string; details?: string }} param0 
   */
  constructor({ labelhash, details }) {
    super('Invalid labelhash', {
      metaMessages: [`- Supplied labelhash: ${labelhash}`],
      details,
    })
  }
}

export class CampaignReferenceTooLargeError extends BaseError {
  name = 'CampaignReferenceTooLargeError'

  /**
   * 
   * @param {{ campaign: number }} param0 
   */
  constructor({ campaign }) {
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

export class ResolverAddressRequiredError extends BaseError {
  name = 'ResolverAddressRequiredError'

  /**
   * 
   * @param {{ data: object }} param0
   */
  constructor({ data }) {
    super('Resolver address is required when data is supplied', {
      metaMessages: [
        'Supplied data:',
        ...Object.entries(data).map(([k, v]) => `- ${k}: ${v}`),
      ],
    })
  }
}

export class CoinFormatterNotFoundError extends BaseError {
  /**
   * @type {string | number}
   */
  coinType

  name = 'CoinFormatterNotFoundError'

  /**
   * 
   * @param {{ coinType: string | number }} param0
   */
  constructor({ coinType }) {
    super(`Coin formatter not found for ${coinType}`)
    this.coinType = coinType
  }
}
