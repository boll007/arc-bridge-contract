/* eslint-disable no-unused-expressions */
const MerkleTree = require('@ocap/merkle-tree');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BigNumber } = require('ethers');
const Web3 = require('web3');
const { hexToBytes } = require('web3-utils');

const { seedValidators, seedSigners, validatorsToAdd, validatorsToRemove } = require('../mock/validators');
const { blocksWithMeta, genWithdrawProof, block2, block3 } = require('../mock/blocks');
let { block1 } = require('../mock/blocks');

const minSingerCount = 2;

const web3 = new Web3();

const totalTransferAmount = '200000000000000000000';
const withdrawTestAmount = '100000000000000000000';

const allBlocks = [];

describe('CoreWorkflow', () => {
  let contract;
  let token;
  beforeEach(async () => {
    const ERC20Rollup = await ethers.getContractFactory('ERC20Rollup');
    const ERC20Token = await ethers.getContractFactory('ERC20Token');
    token = await ERC20Token.deploy();
    contract = await ERC20Rollup.deploy(token.address, minSingerCount, seedValidators);
    const amount = BigNumber.from(totalTransferAmount);
    await token.transfer(contract.address, amount);
  });

  it('should deploy contract success', async () => {
    expect(await contract.tokenAddress()).to.equal(token.address);
    expect(await contract.minSignerCount()).to.equal(minSingerCount);

    const seedValidatorsFromContract = await contract.getSeedValidators();
    seedValidatorsFromContract.forEach((v) => {
      const findByAddrAndPk = seedValidators.find((x) => x.addr === v.addr && x.pk === v.pk);
      expect(findByAddrAndPk).not.null;
    });

    const validatorsFromContract = await contract.getValidators();
    validatorsFromContract.forEach((v) => {
      const findByAddrAndPk = seedValidators.find((x) => x.addr === v.addr && x.pk === v.pk);
      expect(findByAddrAndPk).not.null;
    });

    const balanceOfRollupContract = await token.balanceOf(contract.address);
    expect(balanceOfRollupContract.toString()).to.equal(totalTransferAmount);
  });

  it('should deposit/withdraw workflow work', async () => {
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

    await doAdd();
    await doRemove();

    await appendBlock();
    await appendBlock();
    await appendBlock();
    await appendBlock();

    await checkBlock();

    await withdraw(txForTest);
    await withdrawWithSameTx(txForTest);
    await withdrawWithOnlyOneTxBlock(txForTestOnlyOneTx);
  });

  it('should support pause and resume', async () => {
    let paused = await contract.paused();
    expect(paused).to.equal(false);

    await contract.pause();
    paused = await contract.paused();
    expect(paused).to.equal(true);

    await contract.unpause();
    paused = await contract.paused();
    expect(paused).to.equal(false);
  });

  it('should support transfer locked funds when paused', async () => {
    await contract.pause();
    const owner = await contract.owner();
    const amount = BigNumber.from(withdrawTestAmount);
    let balance = await token.balanceOf(owner);
    expect(balance.toString()).to.equal('185999800000000000000000000');
    await contract.transferLockedFund(owner, amount.toHexString());
    balance = await token.balanceOf(owner);
    expect(balance.toString()).to.equal('185999900000000000000000000');
    await contract.unpause();
  });

  // Currently we only use seed validators to sign
  const getSignatures = (message, signers = seedSigners) => {
    return signers.map((x) => {
      const signResult = web3.eth.accounts.sign(message, x.sk);
      return {
        signer: x.addr,
        signature: hexToBytes(signResult.signature),
      };
    });
  };

  async function doAdd() {
    const validatorsHash = MerkleTree.getListHash(validatorsToAdd);
    const signatures = getSignatures(validatorsHash);

    await contract.updateValidator(hexToBytes(validatorsHash), validatorsToAdd, signatures, 0);

    const validators = await contract.getValidators();
    validatorsToAdd.forEach((x) => expect(validators.includes(x)).to.equal(true));
    seedValidators.forEach((x) => expect(validators.includes(x)).to.equal(true));
  }

  async function doRemove() {
    const validatorsHash = MerkleTree.getListHash(validatorsToRemove);
    const signatures = getSignatures(validatorsHash);

    await contract.updateValidator(hexToBytes(validatorsHash), validatorsToRemove, signatures, 1);

    const validators = await contract.getValidators();
    validatorsToRemove.forEach((x) => expect(validators.includes(x)).to.equal(false));
    seedValidators.forEach((x) => expect(validators.includes(x)).to.equal(true));
  }

  async function appendBlock() {
    const previousHeight = await contract.blockHeight();
    const height = previousHeight.toNumber() + 1;

    const block = blocksWithMeta(allBlocks)[height - 1];
    const signatures = getSignatures(block.blockHash);

    await contract.appendBlock(height, block.blockHash, block.merkleRoot, block.txsHash, signatures);

    const currentHeight = await contract.blockHeight();
    expect(currentHeight.toNumber()).to.equal(height);
  }

  async function checkBlock() {
    const height = await contract.blockHeight();
    const local = blocksWithMeta(allBlocks)[height - 1];
    const remote = await contract.getBlock(height);
    ['txsHash', 'blockHash', 'merkleRoot'].forEach((x) => expect(local[x]).to.equal(remote[x]));
  }

  async function withdraw(tx) {
    const blockHeight = 1;
    const proof = genWithdrawProof(tx, blockHeight - 1, allBlocks);
    const amount = BigNumber.from(tx.amount);

    const [, addr1] = await ethers.getSigners();
    await contract
      .connect(addr1)
      .withdraw(tx.hash, tx.to, MerkleTree.encodePacked({ type: 'uint256', value: tx.amount }), blockHeight, proof);

    const contractBalance = await token.balanceOf(contract.address);
    expect(contractBalance.toString()).to.equal(amount);
    const userBalance = await token.balanceOf(tx.to);
    expect(userBalance.toString()).to.equal(tx.amount);
  }

  async function withdrawWithSameTx(tx) {
    const blockHeight = 1;
    const proof = genWithdrawProof(tx, blockHeight - 1, allBlocks);
    const amount = BigNumber.from(tx.amount);
    const [, addr1] = await ethers.getSigners();
    await expect(
      contract.connect(addr1).withdraw(tx.hash, tx.to, amount.toHexString(), blockHeight, proof)
    ).to.be.revertedWith('E306');
  }

  async function withdrawWithOnlyOneTxBlock(tx) {
    const blockHeight = 4;
    const proof = genWithdrawProof(tx, blockHeight - 1, allBlocks);
    const amount = BigNumber.from(tx.amount);
    const [, addr1] = await ethers.getSigners();
    await contract.connect(addr1).withdraw(tx.hash, tx.to, amount.toHexString(), blockHeight, proof);
    const balanceOfRollupContract = await token.balanceOf(contract.address);
    expect(balanceOfRollupContract.toString()).to.equal('0');
    const balanceOfAccount = await token.balanceOf(tx.to);
    expect(balanceOfAccount.toString()).to.equal(totalTransferAmount);
  }
});
