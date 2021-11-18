const MerkleTree = require('@ocap/merkle-tree');
const { ethers } = require('hardhat');
const { expect } = require('chai');
const { hexToBytes } = require('web3-utils');
const Web3 = require('web3');
const {
  seedValidator1,
  seedValidator2,
  validator1,
  validator4,
  seedValidators,
  seedSigners,
  validatorsToAdd,
} = require('../mock/validators');

const minSingerCount = 3;

const web3 = new Web3();

describe('UpdateValidator', () => {
  let rollup;
  it('should updateValidator work as expected', async () => {
    const ERC20Rollup = await ethers.getContractFactory('ERC20Rollup');
    const ERC20Token = await ethers.getContractFactory('ERC20Token');
    const token = await ERC20Token.deploy();
    rollup = await ERC20Rollup.deploy(token.address, minSingerCount, seedValidators);

    const validatorsHash = MerkleTree.getListHash(validatorsToAdd);
    const signatures = getSignatures(validatorsHash);

    const wrongValidatorsHash = MerkleTree.getListHash([validator4.addr]);
    await expect(
      rollup.updateValidator(hexToBytes(wrongValidatorsHash), validatorsToAdd, signatures, 0)
    ).to.be.revertedWith('E108');

    await expect(rollup.updateValidator(Buffer.alloc(32), validatorsToAdd, signatures, 0)).to.be.revertedWith('E101');

    await expect(rollup.updateValidator(hexToBytes(validatorsHash), [], signatures, 0)).to.be.revertedWith('E102');

    await expect(rollup.updateValidator(hexToBytes(validatorsHash), validatorsToAdd, [], 0)).to.be.revertedWith('E001');

    const signaturesWithWaitUpdateValidators = getSignatures(validatorsHash, [...seedSigners, validator1]);
    await expect(
      rollup.updateValidator(hexToBytes(validatorsHash), validatorsToAdd, signaturesWithWaitUpdateValidators, 0)
    ).to.be.revertedWith('E103');

    await expect(
      rollup.updateValidator(hexToBytes(validatorsHash), [...validatorsToAdd, validator1.addr], signatures, 0)
    ).to.be.revertedWith('E104');

    const signaturesWithOutSeedValidatorOne = getSignatures(validatorsHash, [seedValidator2]);
    await expect(
      rollup.updateValidator(
        hexToBytes(validatorsHash),
        [...validatorsToAdd, seedValidator1.addr],
        signaturesWithOutSeedValidatorOne,
        0
      )
    ).to.be.revertedWith('E105');
    await signatureCountInvalid();
    await rollup.updateValidator(hexToBytes(validatorsHash), validatorsToAdd, signatures, 0);
    await canNotAddExistValidator();
    await canNotRemoveNotExistValidator();
  });

  const signatureCountInvalid = async () => {
    const validatorsHash = MerkleTree.getListHash(validatorsToAdd);
    const signatures = getSignatures(validatorsHash, [seedValidator1]);
    await expect(rollup.updateValidator(hexToBytes(validatorsHash), validatorsToAdd, signatures, 0)).to.be.revertedWith(
      'E002'
    );
  };

  const canNotAddExistValidator = async () => {
    const validatorsHashNew = MerkleTree.getListHash([validator1.addr]);
    const signaturesNew = getSignatures(validatorsHashNew);
    await expect(
      rollup.updateValidator(hexToBytes(validatorsHashNew), [validator1.addr], signaturesNew, 0)
    ).to.be.revertedWith('E106');
  };

  const canNotRemoveNotExistValidator = async () => {
    const validatorsHashNew = MerkleTree.getListHash([validator4.addr]);
    const signaturesNew = getSignatures(validatorsHashNew);
    await expect(
      rollup.updateValidator(hexToBytes(validatorsHashNew), [validator4.addr], signaturesNew, 1)
    ).to.be.revertedWith('E107');
  };
});

const getSignatures = (message, signers = seedSigners) => {
  return signers.map((x) => {
    const signResult = web3.eth.accounts.sign(message, x.sk);
    return {
      signer: x.addr,
      signature: hexToBytes(signResult.signature),
    };
  });
};
