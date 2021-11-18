/* eslint-disable unicorn/filename-case */
/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const { BigNumber } = require('ethers');
const contractJson = require('../artifacts/contracts/ERC20Rollup.sol/ERC20Rollup.json');
const abtTokenJson = require('../artifacts/contracts/ERC20.sol/ERC20.json');

async function main() {
  const rollupContractAddress = process.env.DID_ROLLUP_CONTRACT_ADDRESS;
  const tokenContractAddress = process.env.ERC20_TOKEN_ADDRESS;
  if (!rollupContractAddress) {
    throw new Error('Please set did rollup contract address in the .env first');
  }
  if (!tokenContractAddress) {
    throw new Error('Please set abt token contract address in the .env first');
  }
  console.log(`ERC20Rollup Contract Address=>${rollupContractAddress}`);
  console.log(`Token Contract Address=>${tokenContractAddress}`);

  const [deployer] = await ethers.getSigners();
  console.log('Send ERC20 tokens with the account:', deployer.address);

  // create ERC20Rollup contract instance
  const contract = new ethers.Contract(rollupContractAddress, contractJson.abi, deployer);
  const abtToken = new ethers.Contract(tokenContractAddress, abtTokenJson.abi, deployer);
  console.log('contract address:', contract.address);
  console.log('abtToken address:', abtToken.address);

  // send 20000000000000000000000 token to ERC20Rollup
  const amount = BigNumber.from('2000000000000000000000000');
  const result = await abtToken.transfer(contract.address, amount);
  console.log(result);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
