export enum DataSource {
  Unknown = 0,
  Defillama = 1,
}

export enum Chain {
  Unknown = 0,
  Aptos = 1,
}

export const normalizeChain = (chain: string): Chain => {
  switch (chain.toLowerCase()) {
    case "aptos":
      return Chain.Aptos;
  }

  return Chain.Unknown;
};
