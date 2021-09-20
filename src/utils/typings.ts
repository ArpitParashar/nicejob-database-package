export type Key = string | number

export type KeyValObj = { [key: string]: any };

export type CollectionId = { collection: string; id: string };

export type Collection = { collection: string };

interface Params {
  type: string;
  projectId: string;
  privateKeyId: string;
  privateKey: string;
  clientEmail: string;
  clientId: string;
  authUri: string;
  tokenUri: string;
  authProviderX509CertUrl: string;
  clientC509CertUrl: string;
}

export interface DBParams {
  cacheMaxAge: number;
  cacheAllocatedMemory: number;
  serviceParams: Params;
}
