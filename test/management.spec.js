const { ethers } = require('hardhat');
const { expect } = require('chai');
const { BigNumber } = require('ethers');
const { seedValidators } = require('../mock/validators');

const minSingerCount = 2;
const withdrawTestAmount = '100000000000000000000';
const totalTransferAmount = '200000000000000000000';
const emptyETHAddress = '0x0000000000000000000000000000000000000000';

describe('TransferLockedFund', () => {
  let rollup;
  it('should transferLockedFund work as expected', async () => {
    const ERC20Rollup = await ethers.getContractFactory('ERC20Rollup');
    const ERC20Token = await ethers.getContractFactory('ERC20Token');
    const token = await ERC20Token.deploy();
    rollup = await ERC20Rollup.deploy(token.address, minSingerCount, seedValidators);
    await token.transfer(rollup.address, BigNumber.from(totalTransferAmount));
    await rollup.pause();
    const owner = await rollup.owner();
    const amount = BigNumber.from(withdrawTestAmount);
    const balance = await token.balanceOf(owner);
    expect(balance.toString()).to.equal('185999800000000000000000000');
    await expect(rollup.transferLockedFund(emptyETHAddress, amount.toHexString())).to.be.revertedWith('E401');
    await expect(rollup.transferLockedFund(owner, '0')).to.be.revertedWith('E402');
    await expect(
      rollup.transferLockedFund(owner, BigNumber.from('400000000000000000000').toHexString())
    ).to.be.revertedWith('E008');
    await rollup.unpause();
  });
});
