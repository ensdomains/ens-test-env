
import { labelhash, namehash, zeroHash } from 'viem'

const names = ['legacy']

/**
 * @type {import('hardhat-deploy/types.js').DeployFunction}
 * @param {import('hardhat/types/runtime.js').HardhatRuntimeEnvironment} hre 
 * @returns {Promise<boolean>}
 */
const func = async (hre) => {
  const { viem } = hre
  const { owner } = await viem.getNamedClients()

  const registry = await viem.getContract(
    'LegacyENSRegistry',
    owner,
  )

  const tldTx = await registry.write.setSubnodeOwner(
    [zeroHash, labelhash('test'), owner.address],
    { chain: owner.public.chain, account: owner.account },
  )
  console.log(`Creating .test TLD (tx: ${tldTx})...`)

  await Promise.all(
    names.map(async (name) => {
      const nameTx = await registry.write.setSubnodeOwner(
        [namehash('test'), labelhash(name), owner.address],
        { chain: owner.public.chain, account: owner.account },
      )
      console.log(`Creating ${name}.test (tx: ${nameTx})...`)
    }),
  )

  return true
}

func.id = 'legacy-registry-names'
func.tags = ['legacy-registry-names']
func.dependencies = ['ENSRegistry']
/**
 * 
 * @param {import('hardhat/types/runtime.js').HardhatRuntimeEnvironment} hre 
 * @returns 
 */
func.skip = async (hre) => {
  const { viem } = hre
  const { owner } = await viem.getNamedClients()

  const registry = await viem.getContract(
    'LegacyENSRegistry',
    owner,
  )

  const ownerOfTestTld = await registry.read.owner([namehash('test')])
  if (ownerOfTestTld !== owner.address) {
    return false
  }
  return true
}
func.runAtTheEnd = true

export default func
