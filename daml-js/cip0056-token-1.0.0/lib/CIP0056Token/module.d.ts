// Generated from CIP0056Token.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import * as damlLedger from '@daml/ledger';

import * as pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7 from '@daml.js/40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7';
import * as pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662 from '@daml.js/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662';

export declare type PartyRegistration = {
  party: damlTypes.Party;
  email: string;
  displayName: string;
  registrationTime: damlTypes.Time;
};

export declare interface PartyRegistrationInterface {
  Archive: damlTypes.Choice<PartyRegistration, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, PartyRegistration.Key> & damlTypes.ChoiceFrom<damlTypes.Template<PartyRegistration, PartyRegistration.Key>>;
}
export declare const PartyRegistration:
  damlTypes.Template<PartyRegistration, PartyRegistration.Key, 'f052740a181af047e442276563a56be16cd8d58f9aba61d0d182a3b2a060c329:CIP0056Token:PartyRegistration'> &
  damlTypes.ToInterface<PartyRegistration, never> &
  PartyRegistrationInterface;

export declare namespace PartyRegistration {
  export type Key = damlTypes.Party
  export type CreateEvent = damlLedger.CreateEvent<PartyRegistration, PartyRegistration.Key, typeof PartyRegistration.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<PartyRegistration, typeof PartyRegistration.templateId>
  export type Event = damlLedger.Event<PartyRegistration, PartyRegistration.Key, typeof PartyRegistration.templateId>
  export type QueryResult = damlLedger.QueryResult<PartyRegistration, PartyRegistration.Key, typeof PartyRegistration.templateId>
}



export declare type ExecuteMint = {
};

export declare const ExecuteMint:
  damlTypes.Serializable<ExecuteMint> & {
  }
;


export declare type MintRequest = {
  issuer: damlTypes.Party;
  recipient: damlTypes.Party;
  tokenName: string;
  mintAmount: damlTypes.Numeric;
};

export declare interface MintRequestInterface {
  ExecuteMint: damlTypes.Choice<MintRequest, ExecuteMint, damlTypes.ContractId<TokenHolding>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<MintRequest, undefined>>;
  Archive: damlTypes.Choice<MintRequest, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<MintRequest, undefined>>;
}
export declare const MintRequest:
  damlTypes.Template<MintRequest, undefined, 'f052740a181af047e442276563a56be16cd8d58f9aba61d0d182a3b2a060c329:CIP0056Token:MintRequest'> &
  damlTypes.ToInterface<MintRequest, never> &
  MintRequestInterface;

export declare namespace MintRequest {
  export type CreateEvent = damlLedger.CreateEvent<MintRequest, undefined, typeof MintRequest.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<MintRequest, typeof MintRequest.templateId>
  export type Event = damlLedger.Event<MintRequest, undefined, typeof MintRequest.templateId>
  export type QueryResult = damlLedger.QueryResult<MintRequest, undefined, typeof MintRequest.templateId>
}



export declare type RejectTransfer = {
};

export declare const RejectTransfer:
  damlTypes.Serializable<RejectTransfer> & {
  }
;


export declare type AcceptTransfer = {
};

export declare const AcceptTransfer:
  damlTypes.Serializable<AcceptTransfer> & {
  }
;


export declare type TransferProposal = {
  issuer: damlTypes.Party;
  currentOwner: damlTypes.Party;
  newOwner: damlTypes.Party;
  tokenName: string;
  transferAmount: damlTypes.Numeric;
  senderRemainingAmount: damlTypes.Numeric;
};

export declare interface TransferProposalInterface {
  AcceptTransfer: damlTypes.Choice<TransferProposal, AcceptTransfer, pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2<damlTypes.ContractId<TokenHolding>, damlTypes.Optional<damlTypes.ContractId<TokenHolding>>>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<TransferProposal, undefined>>;
  RejectTransfer: damlTypes.Choice<TransferProposal, RejectTransfer, damlTypes.ContractId<TokenHolding>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<TransferProposal, undefined>>;
  Archive: damlTypes.Choice<TransferProposal, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<TransferProposal, undefined>>;
}
export declare const TransferProposal:
  damlTypes.Template<TransferProposal, undefined, 'f052740a181af047e442276563a56be16cd8d58f9aba61d0d182a3b2a060c329:CIP0056Token:TransferProposal'> &
  damlTypes.ToInterface<TransferProposal, never> &
  TransferProposalInterface;

export declare namespace TransferProposal {
  export type CreateEvent = damlLedger.CreateEvent<TransferProposal, undefined, typeof TransferProposal.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<TransferProposal, typeof TransferProposal.templateId>
  export type Event = damlLedger.Event<TransferProposal, undefined, typeof TransferProposal.templateId>
  export type QueryResult = damlLedger.QueryResult<TransferProposal, undefined, typeof TransferProposal.templateId>
}



export declare type IssuerTransfer = {
  newOwner: damlTypes.Party;
  transferAmount: damlTypes.Numeric;
};

export declare const IssuerTransfer:
  damlTypes.Serializable<IssuerTransfer> & {
  }
;


export declare type IssuerBurn = {
  burnAmount: damlTypes.Numeric;
};

export declare const IssuerBurn:
  damlTypes.Serializable<IssuerBurn> & {
  }
;


export declare type Burn = {
  burnAmount: damlTypes.Numeric;
};

export declare const Burn:
  damlTypes.Serializable<Burn> & {
  }
;


export declare type ProposeTransfer = {
  newOwner: damlTypes.Party;
  transferAmount: damlTypes.Numeric;
};

export declare const ProposeTransfer:
  damlTypes.Serializable<ProposeTransfer> & {
  }
;


export declare type TokenHolding = {
  issuer: damlTypes.Party;
  owner: damlTypes.Party;
  tokenName: string;
  amount: damlTypes.Numeric;
};

export declare interface TokenHoldingInterface {
  ProposeTransfer: damlTypes.Choice<TokenHolding, ProposeTransfer, damlTypes.ContractId<TransferProposal>, TokenHolding.Key> & damlTypes.ChoiceFrom<damlTypes.Template<TokenHolding, TokenHolding.Key>>;
  Burn: damlTypes.Choice<TokenHolding, Burn, damlTypes.Optional<damlTypes.ContractId<TokenHolding>>, TokenHolding.Key> & damlTypes.ChoiceFrom<damlTypes.Template<TokenHolding, TokenHolding.Key>>;
  IssuerBurn: damlTypes.Choice<TokenHolding, IssuerBurn, damlTypes.Optional<damlTypes.ContractId<TokenHolding>>, TokenHolding.Key> & damlTypes.ChoiceFrom<damlTypes.Template<TokenHolding, TokenHolding.Key>>;
  IssuerTransfer: damlTypes.Choice<TokenHolding, IssuerTransfer, pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2<damlTypes.ContractId<TokenHolding>, damlTypes.Optional<damlTypes.ContractId<TokenHolding>>>, TokenHolding.Key> & damlTypes.ChoiceFrom<damlTypes.Template<TokenHolding, TokenHolding.Key>>;
  Archive: damlTypes.Choice<TokenHolding, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, TokenHolding.Key> & damlTypes.ChoiceFrom<damlTypes.Template<TokenHolding, TokenHolding.Key>>;
}
export declare const TokenHolding:
  damlTypes.Template<TokenHolding, TokenHolding.Key, 'f052740a181af047e442276563a56be16cd8d58f9aba61d0d182a3b2a060c329:CIP0056Token:TokenHolding'> &
  damlTypes.ToInterface<TokenHolding, never> &
  TokenHoldingInterface;

export declare namespace TokenHolding {
  export type Key = pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple3<damlTypes.Party, damlTypes.Party, string>
  export type CreateEvent = damlLedger.CreateEvent<TokenHolding, TokenHolding.Key, typeof TokenHolding.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<TokenHolding, typeof TokenHolding.templateId>
  export type Event = damlLedger.Event<TokenHolding, TokenHolding.Key, typeof TokenHolding.templateId>
  export type QueryResult = damlLedger.QueryResult<TokenHolding, TokenHolding.Key, typeof TokenHolding.templateId>
}



export declare type UpdateTotalSupply = {
  newSupply: damlTypes.Numeric;
};

export declare const UpdateTotalSupply:
  damlTypes.Serializable<UpdateTotalSupply> & {
  }
;


export declare type TokenMetadata = {
  issuer: damlTypes.Party;
  tokenName: string;
  currency: string;
  quantityPrecision: damlTypes.Int;
  pricePrecision: damlTypes.Int;
  totalSupply: damlTypes.Numeric;
  description: string;
};

export declare interface TokenMetadataInterface {
  UpdateTotalSupply: damlTypes.Choice<TokenMetadata, UpdateTotalSupply, damlTypes.ContractId<TokenMetadata>, TokenMetadata.Key> & damlTypes.ChoiceFrom<damlTypes.Template<TokenMetadata, TokenMetadata.Key>>;
  Archive: damlTypes.Choice<TokenMetadata, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, TokenMetadata.Key> & damlTypes.ChoiceFrom<damlTypes.Template<TokenMetadata, TokenMetadata.Key>>;
}
export declare const TokenMetadata:
  damlTypes.Template<TokenMetadata, TokenMetadata.Key, 'f052740a181af047e442276563a56be16cd8d58f9aba61d0d182a3b2a060c329:CIP0056Token:TokenMetadata'> &
  damlTypes.ToInterface<TokenMetadata, never> &
  TokenMetadataInterface;

export declare namespace TokenMetadata {
  export type Key = pkg40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7.DA.Types.Tuple2<damlTypes.Party, string>
  export type CreateEvent = damlLedger.CreateEvent<TokenMetadata, TokenMetadata.Key, typeof TokenMetadata.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<TokenMetadata, typeof TokenMetadata.templateId>
  export type Event = damlLedger.Event<TokenMetadata, TokenMetadata.Key, typeof TokenMetadata.templateId>
  export type QueryResult = damlLedger.QueryResult<TokenMetadata, TokenMetadata.Key, typeof TokenMetadata.templateId>
}


