import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";



export interface BondingCurve {
  mint:PublicKey,
  virtualTokenReserve: BN;
  virtualSolReserve: BN;
  realTokenReserve: BN;
  realSolReserve: BN;
  tokenTotalSupply: BN;
  complete: boolean;
  initializer:PublicKey;
  bump: number;
  vaultBump:number;
}