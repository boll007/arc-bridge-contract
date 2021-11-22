/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const { BigNumber } = require('ethers');
const contractJson = require('../artifacts/contracts/ERC20Rollup.sol/ERC20Rollup.json');
const { tx1, genWithdrawProof, blocks } = require('../mock/blocks');

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

  const blockHeight = 1;
  const proof = genWithdrawProof(tx1, blockHeight - 1, blocks);
  const amount = BigNumber.from(tx1.amount);
  const result = await contract.withdraw(tx1.hash, tx1.to, amount.toHexString(), blockHeight, proof);
  console.log('withdraw', result);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
