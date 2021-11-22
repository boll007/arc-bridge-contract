/* eslint-disable unicorn/filename-case */
/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const { hexToBytes } = require('web3-utils');
const Web3 = require('web3');
const contractJson = require('../artifacts/contracts/ERC20Rollup.sol/ERC20Rollup.json');
const { seedValidator1, allValidators } = require('../mock/validators');
const { blocksWithMeta } = require('../mock/blocks');

const web3 = new Web3();

async function main() {
  const rollupContractAddress = process.env.DID_ROLLUP_CONTRACT_ADDRESS;
  if (!rollupContractAddress) {
    throw new Error('Please set arc-bridge contract address in the .env first');
  }
  console.log(`ERC20Rollup Contract Address=>${rollupContractAddress}`);

  const [deployer] = await ethers.getSigners();
  console.log('Test arc-bridge add validator with the account:', deployer.address);

  // create ERC20Rollup contract instance
  const contract = new ethers.Contract(rollupContractAddress, contractJson.abi, deployer);

  const blockHeightFromContract = await contract.getBlockHeight();
  console.log('blockHeightFromContract', blockHeightFromContract);
  const height = blockHeightFromContract.toNumber() + 1;
  const block = blocksWithMeta[height - 1];
  const validatorsFormContract = await contract.getValidators();
  console.log('validatorsFormContract', validatorsFormContract);
  const validValidators = [...validatorsFormContract];
  validValidators.push(seedValidator1.addr);
  const signers = validValidators.map((item) => {
    const findItem = allValidators.find((allItem) => allItem.addr === item);
    let { sk } = item;
    if (findItem && findItem.sk) {
      sk = findItem.sk;
    }
    return {
      addr: item,
      sk,
    };
  });
  const signatures = signers.map((item) => {
    const signResult = web3.eth.accounts.sign(block.blockHash, item.sk);
    return {
      signer: item.addr,
      signature: hexToBytes(signResult.signature),
    };
  });
  const result = await contract.appendBlock(height, block.blockHash, block.merkleRoot, block.txsHash, signatures);
  console.log('append block', result);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
