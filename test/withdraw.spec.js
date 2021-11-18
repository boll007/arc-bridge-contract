const { ethers } = require('hardhat');
const { expect } = require('chai');
const { BigNumber } = require('ethers');
const MerkleTree = require('@ocap/merkle-tree');
const { hexToBytes } = require('web3-utils');
const Web3 = require('web3');
const { blocksWithMeta, block2, block3, genWithdrawProof } = require('../mock/blocks');
const { seedValidators, seedSigners, validatorsToAdd } = require('../mock/validators');
let { block1 } = require('../mock/blocks');

const web3 = new Web3();
const minSingerCount = 2;
const withdrawTestAmount = '100000000000000000000';
const totalTransferAmount = '200000000000000000000';
const emptyETHAddress = '0x0000000000000000000000000000000000000000';
const allBlocks = [];

describe('Withdraw', () => {
  let rollup;
  it('should withdraw work as expected', async () => {
    const ERC20Rollup = await ethers.getContractFactory('ERC20Rollup');
    const ERC20Token = await ethers.getContractFactory('ERC20Token');
    const token = await ERC20Token.deploy();
    rollup = await ERC20Rollup.deploy(token.address, minSingerCount, seedValidators);
    const validatorsHash = MerkleTree.getListHash(validatorsToAdd);
    const signatures = getSignatures(validatorsHash);
    await rollup.updateValidator(hexToBytes(validatorsHash), validatorsToAdd, signatures, 0);

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

    const previousHeight = await rollup.blockHeight();
    const height = previousHeight.toNumber() + 1;

    const block = blocksWithMeta(allBlocks)[height - 1];
    const signaturesForBlock = getSignatures(block.blockHash);
    await rollup.appendBlock(height, block.blockHash, block.merkleRoot, block.txsHash, signaturesForBlock);

    const blockHeight = 1;
    const proof = genWithdrawProof(txForTest, blockHeight - 1, allBlocks);

    await expect(
      rollup
        .connect(addr1)
        .withdraw(
          Buffer.alloc(32),
          txForTest.to,
          MerkleTree.encodePacked({ type: 'uint256', value: txForTest.amount }),
          blockHeight,
          proof
        )
    ).to.be.revertedWith('E301');

    await expect(
      rollup
        .connect(addr1)
        .withdraw(
          txForTest.hash,
          emptyETHAddress,
          MerkleTree.encodePacked({ type: 'uint256', value: txForTest.amount }),
          blockHeight,
          proof
        )
    ).to.be.revertedWith('E302');

    await expect(
      rollup
        .connect(addr1)
        .withdraw(
          txForTest.hash,
          txForTest.to,
          MerkleTree.encodePacked({ type: 'uint256', value: '0' }),
          blockHeight,
          proof
        )
    ).to.be.revertedWith('E303');

    await expect(
      rollup
        .connect(addr1)
        .withdraw(
          txForTest.hash,
          txForTest.to,
          MerkleTree.encodePacked({ type: 'uint256', value: txForTest.amount }),
          0,
          proof
        )
    ).to.be.revertedWith('E304');

    await expect(
      rollup
        .connect(addr1)
        .withdraw(
          txForTest.hash,
          txForTest.to,
          MerkleTree.encodePacked({ type: 'uint256', value: txForTest.amount }),
          1000,
          proof
        )
    ).to.be.revertedWith('E305');

    await expect(
      rollup.withdraw(
        txForTest.hash,
        txForTest.to,
        MerkleTree.encodePacked({ type: 'uint256', value: txForTest.amount }),
        blockHeight,
        proof
      )
    ).to.be.revertedWith('E307');

    await expect(
      rollup
        .connect(addr1)
        .withdraw(
          txForTest.hash,
          txForTest.to,
          MerkleTree.encodePacked({ type: 'uint256', value: txForTest.amount }),
          blockHeight,
          []
        )
    ).to.be.revertedWith('E308');

    await expect(
      rollup
        .connect(addr1)
        .withdraw(
          txForTest.hash,
          txForTest.to,
          MerkleTree.encodePacked({ type: 'uint256', value: txForTest.amount }),
          blockHeight,
          proof
        )
    ).to.be.revertedWith('E008');

    const amount = BigNumber.from(totalTransferAmount);
    await token.transfer(rollup.address, amount);

    await rollup
      .connect(addr1)
      .withdraw(
        txForTest.hash,
        txForTest.to,
        MerkleTree.encodePacked({ type: 'uint256', value: txForTest.amount }),
        blockHeight,
        proof
      );
    // FIXME: 这里 withdraw 之后应该断言 token 中的余额是否正确

    await expect(
      rollup
        .connect(addr1)
        .withdraw(
          txForTest.hash,
          txForTest.to,
          MerkleTree.encodePacked({ type: 'uint256', value: txForTest.amount }),
          blockHeight,
          proof
        )
    ).to.be.revertedWith('E306');
  });
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
