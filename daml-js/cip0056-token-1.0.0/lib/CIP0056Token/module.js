"use strict";
/* eslint-disable-next-line no-unused-vars */
function __export(m) {
/* eslint-disable-next-line no-prototype-builtins */
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable-next-line no-unused-vars */
var jtv = require('@mojotech/json-type-validation');
/* eslint-disable-next-line no-unused-vars */
var damlTypes = require('@daml/types');
/* eslint-disable-next-line no-unused-vars */
var damlLedger = require('@daml/ledger');

var pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7 = require('@daml.js/40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7');
var pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662 = require('@daml.js/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662');


exports.PartyRegistration = damlTypes.assembleTemplate(
{
  templateId: 'f052740a181af047e442276563a56be16cd8d58f9aba61d0d182a3b2a060c329:CIP0056Token:PartyRegistration',
  keyDecoder: damlTypes.lazyMemo(function () { return damlTypes.lazyMemo(function () { return damlTypes.Party.decoder; }); }),
  keyEncode: function (__typed__) { return damlTypes.Party.encode(__typed__); },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({party: damlTypes.Party.decoder, email: damlTypes.Text.decoder, displayName: damlTypes.Text.decoder, registrationTime: damlTypes.Time.decoder, }); }),
  encode: function (__typed__) {
  return {
    party: damlTypes.Party.encode(__typed__.party),
    email: damlTypes.Text.encode(__typed__.email),
    displayName: damlTypes.Text.encode(__typed__.displayName),
    registrationTime: damlTypes.Time.encode(__typed__.registrationTime),
  };
}
,
  Archive: {
    template: function () { return exports.PartyRegistration; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.PartyRegistration);



exports.ExecuteMint = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.MintRequest = damlTypes.assembleTemplate(
{
  templateId: 'f052740a181af047e442276563a56be16cd8d58f9aba61d0d182a3b2a060c329:CIP0056Token:MintRequest',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({issuer: damlTypes.Party.decoder, recipient: damlTypes.Party.decoder, tokenName: damlTypes.Text.decoder, mintAmount: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    issuer: damlTypes.Party.encode(__typed__.issuer),
    recipient: damlTypes.Party.encode(__typed__.recipient),
    tokenName: damlTypes.Text.encode(__typed__.tokenName),
    mintAmount: damlTypes.Numeric(10).encode(__typed__.mintAmount),
  };
}
,
  ExecuteMint: {
    template: function () { return exports.MintRequest; },
    choiceName: 'ExecuteMint',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.ExecuteMint.decoder; }),
    argumentEncode: function (__typed__) { return exports.ExecuteMint.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.TokenHolding).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.TokenHolding).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.MintRequest; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.MintRequest);



exports.RejectTransfer = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.AcceptTransfer = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.TransferProposal = damlTypes.assembleTemplate(
{
  templateId: 'f052740a181af047e442276563a56be16cd8d58f9aba61d0d182a3b2a060c329:CIP0056Token:TransferProposal',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({issuer: damlTypes.Party.decoder, currentOwner: damlTypes.Party.decoder, newOwner: damlTypes.Party.decoder, tokenName: damlTypes.Text.decoder, transferAmount: damlTypes.Numeric(10).decoder, senderRemainingAmount: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    issuer: damlTypes.Party.encode(__typed__.issuer),
    currentOwner: damlTypes.Party.encode(__typed__.currentOwner),
    newOwner: damlTypes.Party.encode(__typed__.newOwner),
    tokenName: damlTypes.Text.encode(__typed__.tokenName),
    transferAmount: damlTypes.Numeric(10).encode(__typed__.transferAmount),
    senderRemainingAmount: damlTypes.Numeric(10).encode(__typed__.senderRemainingAmount),
  };
}
,
  AcceptTransfer: {
    template: function () { return exports.TransferProposal; },
    choiceName: 'AcceptTransfer',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.AcceptTransfer.decoder; }),
    argumentEncode: function (__typed__) { return exports.AcceptTransfer.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.ContractId(exports.TokenHolding), damlTypes.Optional(damlTypes.ContractId(exports.TokenHolding))).decoder; }),
    resultEncode: function (__typed__) { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.ContractId(exports.TokenHolding), damlTypes.Optional(damlTypes.ContractId(exports.TokenHolding))).encode(__typed__); },
  },
  RejectTransfer: {
    template: function () { return exports.TransferProposal; },
    choiceName: 'RejectTransfer',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.RejectTransfer.decoder; }),
    argumentEncode: function (__typed__) { return exports.RejectTransfer.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.TokenHolding).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.TokenHolding).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.TransferProposal; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.TransferProposal);



exports.IssuerTransfer = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({newOwner: damlTypes.Party.decoder, transferAmount: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    newOwner: damlTypes.Party.encode(__typed__.newOwner),
    transferAmount: damlTypes.Numeric(10).encode(__typed__.transferAmount),
  };
}
,
};



exports.IssuerBurn = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({burnAmount: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    burnAmount: damlTypes.Numeric(10).encode(__typed__.burnAmount),
  };
}
,
};



exports.Burn = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({burnAmount: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    burnAmount: damlTypes.Numeric(10).encode(__typed__.burnAmount),
  };
}
,
};



exports.ProposeTransfer = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({newOwner: damlTypes.Party.decoder, transferAmount: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    newOwner: damlTypes.Party.encode(__typed__.newOwner),
    transferAmount: damlTypes.Numeric(10).encode(__typed__.transferAmount),
  };
}
,
};



exports.TokenHolding = damlTypes.assembleTemplate(
{
  templateId: 'f052740a181af047e442276563a56be16cd8d58f9aba61d0d182a3b2a060c329:CIP0056Token:TokenHolding',
  keyDecoder: damlTypes.lazyMemo(function () { return damlTypes.lazyMemo(function () { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple3(damlTypes.Party, damlTypes.Party, damlTypes.Text).decoder; }); }),
  keyEncode: function (__typed__) { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple3(damlTypes.Party, damlTypes.Party, damlTypes.Text).encode(__typed__); },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({issuer: damlTypes.Party.decoder, owner: damlTypes.Party.decoder, tokenName: damlTypes.Text.decoder, amount: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    issuer: damlTypes.Party.encode(__typed__.issuer),
    owner: damlTypes.Party.encode(__typed__.owner),
    tokenName: damlTypes.Text.encode(__typed__.tokenName),
    amount: damlTypes.Numeric(10).encode(__typed__.amount),
  };
}
,
  ProposeTransfer: {
    template: function () { return exports.TokenHolding; },
    choiceName: 'ProposeTransfer',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.ProposeTransfer.decoder; }),
    argumentEncode: function (__typed__) { return exports.ProposeTransfer.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.TransferProposal).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.TransferProposal).encode(__typed__); },
  },
  Burn: {
    template: function () { return exports.TokenHolding; },
    choiceName: 'Burn',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Burn.decoder; }),
    argumentEncode: function (__typed__) { return exports.Burn.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Optional(damlTypes.ContractId(exports.TokenHolding)).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Optional(damlTypes.ContractId(exports.TokenHolding)).encode(__typed__); },
  },
  IssuerBurn: {
    template: function () { return exports.TokenHolding; },
    choiceName: 'IssuerBurn',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.IssuerBurn.decoder; }),
    argumentEncode: function (__typed__) { return exports.IssuerBurn.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Optional(damlTypes.ContractId(exports.TokenHolding)).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Optional(damlTypes.ContractId(exports.TokenHolding)).encode(__typed__); },
  },
  IssuerTransfer: {
    template: function () { return exports.TokenHolding; },
    choiceName: 'IssuerTransfer',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.IssuerTransfer.decoder; }),
    argumentEncode: function (__typed__) { return exports.IssuerTransfer.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.ContractId(exports.TokenHolding), damlTypes.Optional(damlTypes.ContractId(exports.TokenHolding))).decoder; }),
    resultEncode: function (__typed__) { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.ContractId(exports.TokenHolding), damlTypes.Optional(damlTypes.ContractId(exports.TokenHolding))).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.TokenHolding; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.TokenHolding);



exports.UpdateTotalSupply = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({newSupply: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    newSupply: damlTypes.Numeric(10).encode(__typed__.newSupply),
  };
}
,
};



exports.TokenMetadata = damlTypes.assembleTemplate(
{
  templateId: 'f052740a181af047e442276563a56be16cd8d58f9aba61d0d182a3b2a060c329:CIP0056Token:TokenMetadata',
  keyDecoder: damlTypes.lazyMemo(function () { return damlTypes.lazyMemo(function () { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.Party, damlTypes.Text).decoder; }); }),
  keyEncode: function (__typed__) { return pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2(damlTypes.Party, damlTypes.Text).encode(__typed__); },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({issuer: damlTypes.Party.decoder, tokenName: damlTypes.Text.decoder, currency: damlTypes.Text.decoder, quantityPrecision: damlTypes.Int.decoder, pricePrecision: damlTypes.Int.decoder, totalSupply: damlTypes.Numeric(10).decoder, description: damlTypes.Text.decoder, }); }),
  encode: function (__typed__) {
  return {
    issuer: damlTypes.Party.encode(__typed__.issuer),
    tokenName: damlTypes.Text.encode(__typed__.tokenName),
    currency: damlTypes.Text.encode(__typed__.currency),
    quantityPrecision: damlTypes.Int.encode(__typed__.quantityPrecision),
    pricePrecision: damlTypes.Int.encode(__typed__.pricePrecision),
    totalSupply: damlTypes.Numeric(10).encode(__typed__.totalSupply),
    description: damlTypes.Text.encode(__typed__.description),
  };
}
,
  UpdateTotalSupply: {
    template: function () { return exports.TokenMetadata; },
    choiceName: 'UpdateTotalSupply',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.UpdateTotalSupply.decoder; }),
    argumentEncode: function (__typed__) { return exports.UpdateTotalSupply.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.TokenMetadata).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.TokenMetadata).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.TokenMetadata; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.TokenMetadata);

