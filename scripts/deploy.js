/* eslint-disable no-console */
const hre = require('hardhat');

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const tokenAddress = process.env.ERC20_TOKEN_ADDRESS;
  const seedValidators = process.env.SEED_VALIDATOR_ADDR
    ? process.env.SEED_VALIDATOR_ADDR.split(',').map((x) => x.trim())
    : [process.env.SEED_VALIDATOR_ADDRESS];
  const minSingerCount = Math.max(process.env.MIN_SINGER_COUNT || 1, seedValidators.length);

  if (!tokenAddress) {
    throw new Error('Please set arc-bridge contract address in the .env first');
  }
  console.log('deploy config', { tokenAddress, seedValidators, minSingerCount });

  const ERC20Rollup = await hre.ethers.getContractFactory('ERC20Rollup');
  const contract = await ERC20Rollup.deploy(tokenAddress, minSingerCount, seedValidators);
  const result = await contract.deployed();
  console.log('ERC20Rollup deployed to:', result.deployTransaction);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
