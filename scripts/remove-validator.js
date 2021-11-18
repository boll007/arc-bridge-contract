/* eslint-disable unicorn/filename-case */
/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const { hexToBytes } = require('web3-utils');
const { utf8ToHex } = require('@ocap/util');
const { Hasher } = require('@ocap/mcrypto');
const Web3 = require('web3');
const { validatorsToRemove, seedSigners } = require('../mock/validators');
const contractJson = require('../artifacts/contracts/ERC20Rollup.sol/ERC20Rollup.json');

const web3 = new Web3();
const sha3 = Hasher.Keccak.hash256;

async function main() {
  const rollupContractAddress = process.env.DID_ROLLUP_CONTRACT_ADDRESS;
  if (!rollupContractAddress) {
    throw new Error('Please set did rollup contract address in the .env first');
  }
  console.log(`ERC20Rollup Contract Address=>${rollupContractAddress}`);

  const [deployer] = await ethers.getSigners();
  console.log('Test did rollup add validator with the account:', deployer.address);

  // create ERC20Rollup contract instance
  const contract = new ethers.Contract(rollupContractAddress, contractJson.abi, deployer);

  // 初次做加入，此时合约中的 validators 还是空的，所以只能用 seedValidators 来签名
  let validatorAddresses = '';
  validatorsToRemove.forEach((item) => {
    validatorAddresses += item;
  });
  // 因为合约中的地址都是小写，这里做一个适配
  // js 这里的方法，如果传一个 hexString 进去会被识别成 hex
  // 但是合约中只会严格把这里当做 string to bytes，所以需要用下面的写法
  const validatorsHash = sha3(hexToBytes(utf8ToHex(validatorAddresses.toLocaleLowerCase())));
  const signatures = seedSigners.map((item) => {
    const signResult = web3.eth.accounts.sign(validatorsHash, item.sk);
    return {
      signer: item.addr,
      signature: hexToBytes(signResult.signature),
    };
  });
  const action = 1;
  // validatorsHash: sha3(所有的 address 字符串拼接)
  // validatorsToRemove: 待更新的 validators
  // signatures: 此次签名的 validators
  // action: 此次更新的操作类型，0-add，1-remove
  const result = await contract.updateValidator(hexToBytes(validatorsHash), validatorsToRemove, signatures, action);
  console.log('remove validator', result);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
