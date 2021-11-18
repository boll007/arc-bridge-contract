const MerkleTree = require('@ocap/merkle-tree');

const txAccounts = [
  {
    address: '0x9A538FF57E7FA06af526B755e8796BcFEB2df909',
    sk: '0x65dd26048e9b899e816f6c3ad1b5211b997e43aa9b100dd19c5319e1fd30feb9',
  },
  {
    address: '0x4Ec5c4E29c7DB9E8F44F29EbcAf340E6f3812E1C',
    sk: '0xddc58883e81ac623165da21766c52c5050334c4cf2a766d4f104668000657a1d',
  },
  {
    address: '0xa439649E717338A5133F5661709deb02BE5978b6',
    sk: '0xf33a1d4df92bd3bf838d1efe48369ac2f7c10f0c0e8b09413ae740f3c3d8490a',
  },
  {
    address: '0x9EA688A6bb97dA3623D25D58b9CdD259203f6932',
    sk: '0xb521f139cc9b5124840758d94162e912a4f91bcc51ea1d4bc0166164daad3d1a',
  },
  {
    address: '0xC4A3e2Af54fcc9E9f0F3Eb5Af9EF9e425eD44690',
    sk: '0x43097d336443bb43400ce29cdf150dc76a06fe99f9b1645e0739e5d70164bc74',
  },
  {
    address: '0xbf9F5a1f5F5b681Ce22e45B17A8333f21887Daa5',
    sk: '0x7ecf0ba4eafbad91ac99bbbed4f94467310c7cb9b556a428ce1253dda867bbcc',
  },
  {
    address: '0x9B7B1EF85E7C91436E7a08bAc50B851144770031',
    sk: '0x9f2fe8a511e3485a80dabe34cfa1ea674506aca256a07ba86088f4e10eebea31',
  },
  {
    address: '0x872CD19f6b57bC3b96e979008dF0aB3f432c095b',
    sk: '0x34c3b63cfd684df4a5a81727b69430951c18d7b5ee0f9c86ee8ff86f23bb3fa7',
  },
];

const tx1 = {
  hash: '0xCEB308A082A81F186FE3E5B845140EAB146E4EC6AB8CAE0AE3A7040C138EC9A3',
  to: '0x9A538FF57E7FA06af526B755e8796BcFEB2df909',
  amount: '1000000000000000000',
};
const tx2 = {
  hash: '0xF74C195B62993F045D9AE7FA2BD19DA37300CE0BC28FF6D307CD358C5D2770E1',
  to: '0x4Ec5c4E29c7DB9E8F44F29EbcAf340E6f3812E1C',
  amount: '15000000000000000000',
};
const tx3 = {
  hash: '0xA5791E9D7D82DFFF830F96A187F7E871A6BC8F84FB759C2F8DB91ADC686B4449',
  to: '0xa439649E717338A5133F5661709deb02BE5978b6',
  amount: '12000000000000000000',
};
const tx4 = {
  hash: '0x4E1C1AB46FDD7ABCFAD4311891F096C0FB61DDDB5BB13D247500C7034B160C9E',
  to: '0x9EA688A6bb97dA3623D25D58b9CdD259203f6932',
  amount: '11000000000000000000',
};
const tx5 = {
  hash: '0xD7976859073DAF32C2CA6678A437A156157EB5A3D38FE517FC24436708BF6565',
  to: '0xC4A3e2Af54fcc9E9f0F3Eb5Af9EF9e425eD44690',
  amount: '10000000000000000000',
};
const tx6 = {
  hash: '0x5525A188374FF50333990129AB3ED8C60BA371DD47B92292FC2C5732E88F63C3',
  to: '0xbf9F5a1f5F5b681Ce22e45B17A8333f21887Daa5',
  amount: '11000000000000000000',
};
const tx7 = {
  hash: '0x074FBEF6F0E8B923A92DD8F5741DE16902B9BADA3907429407598A26E359454E',
  to: '0x9B7B1EF85E7C91436E7a08bAc50B851144770031',
  amount: '111000000000000000000',
};
const tx8 = {
  hash: '0xD2726DC85A3B3014E185324D9A8FBEB1F57A07D1B299A2234BC705B249D87719',
  to: '0x872CD19f6b57bC3b96e979008dF0aB3f432c095b',
  amount: '112000000000000000000',
};
const tx9 = {
  hash: '0xD2726DC85A3B3014E185324D9A8FBEB1F57A07D1B299A2234BC705B249D87719',
  from: '0x9EA688A6bb97dA3623D25D58b9CdD259203f6932',
  amount: '1000000000000000000',
};
const tx10 = {
  hash: '0xD2726DC85A3B3014E185324D9A8FBEB1F57A07D1B299A2234BC705B249D87719',
  from: '0x9B7B1EF85E7C91436E7a08bAc50B851144770031',
  amount: '2000000000000000000',
};

const block1 = [tx1, tx2, tx3, tx4];
const block2 = [tx5, tx6, tx7, tx8];
const block3 = [tx9, tx10];

function genBlockMeta(blocks, index) {
  const height = index + 1;
  const txs = blocks[index];

  let previousHash;
  if (height > 1) {
    const block = blocks[index - 1];
    const type = block[0].to ? 'withdraw' : 'deposit';
    let previousBlock;
    if (type === 'withdraw') {
      previousBlock = genBlockMeta(blocks, index - 1);
    } else {
      previousBlock = genBlockMetaWithoutMerkleRoot(blocks, index - 1);
    }
    previousHash = previousBlock.blockHash;
  } else {
    previousHash = '';
  }

  const txsHash = MerkleTree.getListHash(txs.map((x) => x.hash));
  const merkleTree = MerkleTree.getBlockMerkleTree(txs);
  const merkleRoot = merkleTree.getHexRoot();
  const blockHash = MerkleTree.getBlockHash({ height, previousHash, merkleRoot, txsHash });

  return { height, blockHash, merkleRoot, txsHash };
}

function genBlockMetaWithoutMerkleRoot(blocks, index) {
  const height = index + 1;
  const previousHash = height === 1 ? '' : genBlockMeta(blocks, index - 1).blockHash;
  const merkleRoot = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
  const txsHash = MerkleTree.getListHash(blocks[index].map((x) => x.hash));
  const blockHash = MerkleTree.getBlockHash({ height, previousHash, merkleRoot, txsHash });

  return { height, blockHash, merkleRoot, txsHash };
}

function genWithdrawProof(tx, index, blocks) {
  const tree = MerkleTree.getBlockMerkleTree(blocks[index]);

  const element = MerkleTree.encodePacked(
    { type: 'bytes32', value: tx.hash },
    { type: 'address', value: tx.to },
    { type: 'uint256', value: tx.amount }
  );
  const proofs = tree.getHexProof(element);

  // Enable this for debug purpose
  // console.log(
  //   JSON.stringify(
  //     {
  //       elements: tree.elements.map((x) => x.toString('hex')),
  //       layers: tree.layers.map((x) => x.map((b) => b.toString('hex'))),
  //       block: blocks[index],
  //       element: MerkleTree.keccak256(element),
  //       proofs,
  //     },
  //     null,
  //     2
  //   )
  // );

  return proofs;
}

const blocksWithMeta = (blocks) => {
  return blocks.map((item, index) => {
    const type = item[0].to ? 'withdraw' : 'deposit';
    if (type === 'withdraw') {
      return genBlockMeta(blocks, index);
    }

    // for deposit block
    return genBlockMetaWithoutMerkleRoot(blocks, index);
  });
};

module.exports = {
  block1,
  block2,
  block3,
  blocksWithMeta,
  genWithdrawProof,
  tx1,
  tx8,
  txAccounts,
};
