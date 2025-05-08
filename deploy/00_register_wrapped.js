/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-await-in-loop */


import { namehash } from 'viem/ens'
import { encodeFuses } from './.utils/ensjs/fuses.js'
import {
  makeCommitment as generateCommitment,
  makeRegistrationTuple,
} from './.utils/ensjs/registerHelpers.js'
import { nonceManager } from './.utils/nonceManager.js'

/** @type {{ readonly parent: { readonly named: readonly ['PARENT_CANNOT_CONTROL'] } }} */
const parentPcc = { parent: { named: ['PARENT_CANNOT_CONTROL'] } }
/**
 * @type {import('./00_register_wrapped.js').Name[]}
 */
const names = [
  {
    name: 'wrapped.eth',
    namedOwner: 'owner',
    subnames: [
      { label: 'sub', namedOwner: 'deployer' },
      { label: 'test', namedOwner: 'deployer' },
      { label: 'legacy', namedOwner: 'deployer' },
      { label: 'xyz', namedOwner: 'deployer' },
    ],
  },
  {
    name: 'wrapped-expired-subnames.eth',
    namedOwner: 'owner',
    fuses: {
      named: ['CANNOT_UNWRAP'],
    },
    subnames: [
      {
        label: 'day-expired',
        namedOwner: 'owner',
        // set expiry to 24 hours ago
        expiry: Math.floor(Date.now() / 1000) - 86400,
        fuses: encodeFuses({
          input: parentPcc,
        }),
      },
      {
        label: 'hour-expired',
        namedOwner: 'owner',
        // set expiry to 24 hours ago
        expiry: Math.floor(Date.now() / 1000) - 3600,
        fuses: encodeFuses({
          input: parentPcc,
        }),
      },
      {
        label: 'two-minute-expired',
        namedOwner: 'owner',
        expiry: Math.floor(Date.now() / 1000) - 120,
        fuses: encodeFuses({
          input: parentPcc,
        }),
      },
      {
        label: 'two-minute-expiring',
        namedOwner: 'owner',
        expiry: Math.floor(Date.now() / 1000) + 120,
        fuses: encodeFuses({
          input: parentPcc,
        }),
      },
      {
        label: 'hour-expiring',
        namedOwner: 'owner',
        // set expiry to 24 hours ago
        expiry: Math.floor(Date.now() / 1000) + 3600,
        fuses: encodeFuses({
          input:parentPcc,
        }),
      },
      {
        label: 'no-pcc',
        namedOwner: 'owner',
        expiry: Math.floor(Date.now() / 1000) - 86400,
      },
      {
        label: 'not-expired',
        namedOwner: 'owner',
        fuses: encodeFuses({
          input:parentPcc,
        }),
      },
    ],
  },
  {
    name: 'wrapped-to-delete.eth',
    namedOwner: 'owner',
    subnames: [
      { label: 'parent-not-child', namedOwner: 'deployer' },
      { label: 'parent-child', namedOwner: 'owner' },
      { label: 'not-parent-child', namedOwner: 'deployer' },
    ],
  },
  {
    name: 'emancipated-to-delete.eth',
    namedOwner: 'owner',
    fuses: {
      named: ['CANNOT_UNWRAP'],
    },
    subnames: [
      {
        label: 'parent-not-child',
        namedOwner: 'deployer',
        expiry: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
        fuses: encodeFuses({
          input:parentPcc,
        }),
      },
      {
        label: 'parent-child',
        namedOwner: 'owner',
        expiry: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
        fuses: encodeFuses({
          input:parentPcc,
        }),
      },
      {
        label: 'not-parent-child',
        namedOwner: 'deployer',
        expiry: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
        fuses: encodeFuses({
          input:parentPcc,
        }),
      },
    ],
  },
]

/**
 * @type {import('hardhat-deploy/types.js').DeployFunction}
 * @param {import('hardhat/types/runtime.js').HardhatRuntimeEnvironment} hre 
 */
const func = async (hre) => {
  const { network, viem } = hre
  const allNamedClients = await viem.getNamedClients()
  const publicClient = await viem.getPublicClient()

  const controller = await viem.getContract('ETHRegistrarController')
  const publicResolver = await viem.getContract('PublicResolver')
  const nameWrapper = await viem.getContract('NameWrapper')

  /**
   * 
   * @param {import('./00_register_wrapped.js').Name} param0 
   * @returns 
   */
  const makeData = ({
    namedOwner,
    customDuration,
    fuses,
    name,
    subnames,
    ...rest
  }) => {
    const resolverAddress = publicResolver.address
    /**
     * @type {import('viem').Hex}
     */
    const secret =
      '0x0000000000000000000000000000000000000000000000000000000000000000'
    const duration = customDuration || 31536000
    // 1659467455 is an approximate base timestamp; adding duration to it gives the wrapper expiry
    const wrapperExpiry = 1659467455 + duration
    const owner = allNamedClients[namedOwner].account

    /**
     * @type {import('./00_register_wrapped.js').ProcessedSubname[]}
     */
    const processedSubnames =
      subnames?.map(
        ({
          label,
          namedOwner: subNamedOwner,
          fuses: subnameFuses,
          expiry: subnameExpiry,
        }) => ({
          label,
          owner: allNamedClients[subNamedOwner].account,
          expiry: subnameExpiry || wrapperExpiry,
          fuses: subnameFuses || 0,
        }),
      ) || []

    return {
      resolverAddress,
      secret,
      duration,
      owner,
      name,
      label: name.split('.')[0],
      subnames: processedSubnames,
      fuses: fuses || undefined,
      ...rest,
    }
  }

  /**
   * 
   * @param {number} nonce 
   */
  const makeCommitment =
    (nonce) =>
      /**
       * 
       * @param {import('./00_register_wrapped.js').ProcessedNameData} param0 
       * @param {number} index 
       * @returns 
       */
    async ({ owner, name, ...rest }, index) => {
      const commitment = generateCommitment({
        owner: owner.address,
        name,
        ...rest,
      })
      const commitTxHash = await controller.write.commit([commitment], {
        nonce: nonce + index,
        account: owner,
      })
      console.log(`Commiting commitment for ${name} (tx: ${commitTxHash})...`)
      return 1
    }
/**
 * 
 * @param {number} nonce 
 */
  const makeRegistration =
    (nonce) =>
          /**
       * 
       * @param {import('./00_register_wrapped.js').ProcessedNameData} param0 
       * @param {number} index 
       * @returns 
       */
    async (
      { owner, name, duration, label, ...rest },
      index,
    ) => {
      const { base: price } = await controller.read.rentPrice([
        label,
        BigInt(duration),
      ])
      const registerTxHash = await controller.write.register(
        makeRegistrationTuple({
          owner: owner.address,
          name,
          duration,
          ...rest,
        }),
        {
          account: owner,
          value: price,
          nonce: nonce + index,
        },
      )
      console.log(`Registering name ${name} (tx: ${registerTxHash})...`)
      return 1
    }

    /**
     * 
     * @param {number} nonce 
     */
  const makeSubname =
    (nonce) =>
          /**
       * 
       * @param {import('./00_register_wrapped.js').ProcessedNameData} param0 
       * @param {number} index 
       * @returns 
       */
    async ({ name, subnames, owner }, index) => {
      for (let i = 0; i < subnames.length; i += 1) {
        const { label, owner: subOwner, fuses, expiry } = subnames[i]
        const subnameTxHash = await nameWrapper.write.setSubnodeOwner(
          [namehash(name), label, subOwner.address, fuses, BigInt(expiry)],
          {
            account: owner,
            nonce: nonce + index + i,
          },
        )
        console.log(
          `Creating subname ${label}.${name} (tx: ${subnameTxHash})...`,
        )
      }
      return subnames.length
    }

  const allNameData = names.map(makeData)

  const getNonceAndApply = nonceManager(allNamedClients, allNameData)

  await network.provider.send('evm_setAutomine', [false])
  await getNonceAndApply('owner', makeCommitment)
  await network.provider.send('evm_mine')
  const oldTimestamp = await publicClient
    .getBlock()
    .then((b) => Number(b.timestamp))
  await network.provider.send('evm_setNextBlockTimestamp', [oldTimestamp + 60])
  await network.provider.send('evm_mine')
  await getNonceAndApply('owner', makeRegistration)
  await network.provider.send('evm_mine')
  await getNonceAndApply('owner', makeSubname)
  await network.provider.send('evm_mine')

  await network.provider.send('evm_setAutomine', [true])
  await network.provider.send('anvil_setBlockTimestampInterval', [1])
  await network.provider.send('evm_mine')

  return true
}

func.id = 'register-wrapped-names'
func.tags = ['register-wrapped-names']
func.dependencies = ['ETHRegistrarController']
func.runAtTheEnd = true

export default func
