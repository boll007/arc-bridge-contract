module.exports = Object.freeze({
  // E000 --> error throw on check signatures
  E000: 'Forbidden: contract paused',
  E001: 'signatures is empty',
  E002: 'signature count invalid',
  E003: 'signature too few',
  E004: 'seed validator not signed',
  E005: 'singer not in whitelist',
  E006: 'singer duplicate',
  E007: 'signature invalid',
  E008: 'Insufficient balance',
  E009: 'Forbidden: owner only',
  E010: 'Forbidden: contract not paused',

  // E1XX --> error throw on updateValidator
  E101: 'ValidatorsHash is empty',
  E102: 'validatorsToUpdate is empty',
  E103: 'validatorsToUpdate can not sign',
  E104: 'validatorsToUpdate duplicate',
  E105: 'validatorsToUpdate contains seed validator',
  E106: 'validator exist on add',
  E107: 'validator not exist on remove',
  E108: 'validatorHash invalid',

  // E2xx --> error throw on appendBlock
  E201: 'blockHeight invalid',
  E202: 'blockHash is empty',
  E203: 'merkleRoot is empty',
  E204: 'txsHash is empty',
  E205: 'blockHash check failed',

  // E3xx --> error throw on withdraw
  E301: 'txHash is empty',
  E302: 'to is empty',
  E303: 'amount is empty',
  E304: 'blockHeight can not be 0',
  E305: 'blockHeight too large',
  E306: 'txHash already seen',
  E307: 'Can not withdraw others token',
  E308: 'Merkle proof check failed',

  // E4xx --> error throw on transferLockedFund
  E401: 'to is empty',
  E402: 'amount is empty',

  // E5xx --> error throw on constructor
  E501: 'erc20TokenAddr is empty',
  E502: 'ocapTokenAddr is empty',
  E503: 'minSignerCount is 0',
  E504: 'seedValidators is empty',
  E505: 'minSignerCount too small',
});
