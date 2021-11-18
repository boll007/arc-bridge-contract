const { ethers } = require('hardhat');
const { expect } = require('chai');
const MerkleTree = require('@ocap/merkle-tree');
const { hexToBytes } = require('web3-utils');
const Web3 = require('web3');
const { blocksWithMeta, block2, block3 } = require('../mock/blocks');
const {
  seedValidator1,
  seedValidator2,
  validator1,
  validator2,
  validator4,
  seedValidators,
  seedSigners,
  validatorsToAdd,
} = require('../mock/validators');
let { block1 } = require('../mock/blocks');

const web3 = new Web3();
const minSingerCount = 2;
const withdrawTestAmount = '100000000000000000000';
const allBlocks = [];

describe('AppendBlock', () => {
  let rollup;

  before(async () => {
    // prepare tx data for withdraw
    const [, addr1] = await ethers.getSigners();
    const txForTest = {
      hash: '0xCEB308A082A81F186FE3E5B845140EAB146E4EC6AB8CAE0AE3A7040C138EC9A3',
      to: addr1.address,
      amount: withdrawTestAmount, // 100 ABT
    };
    const txForTestOnlyOneTx = {
      hash: '0x2BC67A075576F29E9EC5EFA8876639A1C9ABD55D994A79E5A273AEF9F609E15C',
      to: addr1.address,
      amount: withdrawTestAmount, // 100 ABT
    };
    block1 = [txForTest, ...block1];
    const block4 = [txForTestOnlyOneTx];
    allBlocks.push(...[block1, block2, block3, block4]);
  });

  it('should appendBlock work as expected', async () => {
    const ERC20Rollup = await ethers.getContractFactory('ERC20Rollup');
    const ERC20Token = await ethers.getContractFactory('ERC20Token');
    const token = await ERC20Token.deploy();
    rollup = await ERC20Rollup.deploy(token.address, minSingerCount, seedValidators);
    const validatorsHash = MerkleTree.getListHash(validatorsToAdd);
    const signatures = getSignatures(validatorsHash);
    await rollup.updateValidator(hexToBytes(validatorsHash), validatorsToAdd, signatures, 0);
  });

  it('should appendBlock throw on invalid param', async () => {
    const previousHeight = await rollup.blockHeight();
    const height = previousHeight.toNumber() + 1;

    const block = blocksWithMeta(allBlocks)[height - 1];
    const signaturesForBlock = getSignatures(block.blockHash);

    await expect(
      rollup.appendBlock(height + 1, block.blockHash, block.merkleRoot, block.txsHash, signaturesForBlock)
    ).to.be.revertedWith('E201');

    await expect(
      rollup.appendBlock(height, Buffer.alloc(32), block.merkleRoot, block.txsHash, signaturesForBlock)
    ).to.be.revertedWith('E202');

    await expect(
      rollup.appendBlock(height, block.blockHash, Buffer.alloc(32), block.txsHash, signaturesForBlock)
    ).to.be.revertedWith('E203');

    await expect(
      rollup.appendBlock(height, block.blockHash, block.merkleRoot, Buffer.alloc(32), signaturesForBlock)
    ).to.be.revertedWith('E204');

    await expect(rollup.appendBlock(height, block.blockHash, block.merkleRoot, block.txsHash, [])).to.be.revertedWith(
      'E001'
    );

    const otherBlock = blocksWithMeta(allBlocks)[height];
    await expect(
      rollup.appendBlock(height, otherBlock.blockHash, block.merkleRoot, block.txsHash, signaturesForBlock)
    ).to.be.revertedWith('E205');
  });

  it('should appendBlock throw on invalid signatures', async () => {
    await testSignatureTooFew();
    await testSeedValidatorNotExist();
    await testSignerInvalid();
    await testSignerDuplicate();
    await testSignatureInvalid();
  });

  const testSignatureTooFew = async () => {
    const previousHeight = await rollup.blockHeight();
    const height = previousHeight.toNumber() + 1;

    const block = blocksWithMeta(allBlocks)[height - 1];
    const signaturesForBlock = getSignatures(block.blockHash, [validator1]);
    await expect(
      rollup.appendBlock(height, block.blockHash, block.merkleRoot, block.txsHash, signaturesForBlock)
    ).to.be.revertedWith('E003');
  };

  const testSeedValidatorNotExist = async () => {
    const previousHeight = await rollup.blockHeight();
    const height = previousHeight.toNumber() + 1;

    const block = blocksWithMeta(allBlocks)[height - 1];
    const signaturesForBlock = getSignatures(block.blockHash, [validator1, validator2]);
    await expect(
      rollup.appendBlock(height, block.blockHash, block.merkleRoot, block.txsHash, signaturesForBlock)
    ).to.be.revertedWith('E004');
  };

  const testSignerInvalid = async () => {
    const previousHeight = await rollup.blockHeight();
    const height = previousHeight.toNumber() + 1;

    const block = blocksWithMeta(allBlocks)[height - 1];
    const signaturesForBlock = getSignatures(block.blockHash, [seedValidator1, seedValidator2, validator4]);
    await expect(
      rollup.appendBlock(height, block.blockHash, block.merkleRoot, block.txsHash, signaturesForBlock)
    ).to.be.revertedWith('E005');
  };

  const testSignerDuplicate = async () => {
    const previousHeight = await rollup.blockHeight();
    const height = previousHeight.toNumber() + 1;

    const block = blocksWithMeta(allBlocks)[height - 1];
    const signaturesForBlock = getSignatures(block.blockHash, [seedValidator1, seedValidator2, validator1, validator1]);
    await expect(
      rollup.appendBlock(height, block.blockHash, block.merkleRoot, block.txsHash, signaturesForBlock)
    ).to.be.revertedWith('E006');
  };

  const testSignatureInvalid = async () => {
    const previousHeight = await rollup.blockHeight();
    const height = previousHeight.toNumber() + 1;

    const block = blocksWithMeta(allBlocks)[height - 1];
    const signaturesForBlock = getSignatures(block.blockHash, [seedValidator1, seedValidator2, validator1]);
    const signResult = web3.eth.accounts.sign('1', seedValidator1.sk);
    signaturesForBlock[0].signature = hexToBytes(signResult.signature);
    await expect(
      rollup.appendBlock(height, block.blockHash, block.merkleRoot, block.txsHash, signaturesForBlock)
    ).to.be.revertedWith('E007');
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
