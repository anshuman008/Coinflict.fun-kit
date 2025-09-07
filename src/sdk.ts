import coinflictIdl from "./IDL/pumpg.json";
import { Coinflict } from "./IDL/pumpg";
import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  bondingCurvePda,
  globalPda,
  vaultPda,
  metadata,
  bondingCurveAta,
} from "./pda";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BondingCurve } from "./types";
import { getBuyPrice, getSellPrice } from "./calculations";
import { BN } from "bn.js";


type PublicKeyData = {};
type PublicKeyInitData =
  | number
  | string
  | Uint8Array
  | Array<number>
  | PublicKeyData;

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );
export enum CoinFlictErrors {
  BONDING_CURVE_NOT_FOUND = "BONDING_CURVE_NOT_FOUND",
  GLOBAL_DATA_NOT_FOUND = "GLOBAL_DATA_NOT_FOUND",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  NETWORK_ERROR = "NETWORK_ERROR",
  INVALID_PARAMETERS = "INVALID_PARAMETERS",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface CoinFlictError {
  type: CoinFlictErrors;
  message: string;
  details?: any;
}

export type CoinFlictResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: CoinFlictError;
    };

export class CoinFlictSdk {
  private program: anchor.Program<Coinflict>;

  constructor(connection: Connection) {
    const keypair = Keypair.generate();
    const wallet = new anchor.Wallet(keypair);
    const provider = new anchor.AnchorProvider(connection, wallet,{commitment:"finalized"});
    const programId = new PublicKey("9dQKrnhnnbVyUZCnXxPRpjG9rJqW8SbXaasdE2PXpugB");

    const pumpProgram = new anchor.Program<Coinflict>(
      //@ts-ignore
      coinflictIdl as Coinflict,
      programId,
      provider
    );
    this.program = pumpProgram;
  }

  async getBuyTxs(
    mint: PublicKey,
    user: PublicKey,
    slippage: number,
    amount: anchor.BN,
    solAmount: anchor.BN
  ) {
    try {
      if (!mint || !user || !amount || !solAmount) {
        return {
          success: false,
          error: {
            type: CoinFlictErrors.INVALID_PARAMETERS,
            message: "Invalid parameters provided",
            details: { mint, user, amount, solAmount },
          },
        };
      }

      if (slippage < 0) {
        return {
          success: false,
          error: {
            type: CoinFlictErrors.INVALID_PARAMETERS,
            message: "Slippage canot be in negative",
            details: { slippage },
          },
        };
      }

      const bonding_curvePda = this.bondingCurvePda(mint);
      const vaultPda = this.vaultPda(mint);
      const bondingCurveATA = await this.findAssociatedTokenAddress(
        bonding_curvePda,
        mint
      );
      const global = this.globalPda();

      console.log("Bonding Curve PDA:", bonding_curvePda.toBase58());
      const bondingCurveAccountInfo =
        await this.program.provider.connection.getAccountInfo(bonding_curvePda);

      if (!bondingCurveAccountInfo) {
        return {
          success: false,
          error: {
            type: CoinFlictErrors.BONDING_CURVE_NOT_FOUND,
            message: "Bonding Curve account not found for this token",
            details: {
              mint: mint.toBase58(),
              bondingCurvePda: bonding_curvePda.toBase58(),
            },
          },
        };
      }

      const instructions: TransactionInstruction[] = [];
      const associatedUser = getAssociatedTokenAddressSync(mint, user, true);

      const userTokenAccount =
        await this.program.provider.connection.getAccountInfo(associatedUser);

      if (!userTokenAccount) {
        instructions.push(
          createAssociatedTokenAccountIdempotentInstruction(
            user,
            associatedUser,
            user,
            mint
          )
        );
      }

      console.log("pushing the transaction-------");
      instructions.push(
        await this.program.methods
          .buy(
            amount,
            solAmount.add(
              solAmount.mul(new BN(Math.floor(slippage * 10))).div(new BN(1000))
            )
          )
          .accountsStrict({
      user: user,
      global: global,
      feeRecipient: user,
      bondingCurve: bonding_curvePda,
      bondingCurveAta: bondingCurveATA,
      vault: vaultPda,
      userAta: bondingCurveATA,
      mint: mint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId
          })
          .instruction()
      );

      return {
        success: true,
        data: instructions,
      };
    } catch (error) {
      console.error("Error in getBuyTxs:", error);
      return {
        success: false,
        error: {
          type: CoinFlictErrors.UNKNOWN_ERROR,
          message:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
          details: error,
        },
      };
    }
  }

  // async getSellTxs(
  //   mint: PublicKey,
  //   user: PublicKey,
  //   slippage: number,
  //   amount: BN,
  //   solAmount: BN
  // ): Promise<CoinFlictResult<TransactionInstruction[]>> {
  //   try {
  //     if (!mint || !user || !amount || !solAmount) {
  //       return {
  //         success: false,
  //         error: {
  //           type: CoinFlictErrors.INVALID_PARAMETERS,
  //           message: "Invalid parameters provided",
  //           details: { mint, user, amount, solAmount },
  //         },
  //       };
  //     }

  //     if (slippage < 0) {
  //       return {
  //         success: false,
  //         error: {
  //           type: CoinFlictErrors.INVALID_PARAMETERS,
  //           message: "Slippage cant be in negative",
  //           details: { slippage },
  //         },
  //       };
  //     }

  //     const instructions: TransactionInstruction[] = [];
  //     const associatedUser = getAssociatedTokenAddressSync(mint, user, true);

  //     const bonding_curvePda = this.bondingCurvePda(mint);
  //     const vaultPda = this.vaultPda(mint);
  //     const bondingCurveATA = await this.findAssociatedTokenAddress(
  //       bonding_curvePda,
  //       mint
  //     );

  //     instructions.push(
  //       await this.program.methods
  //         .sell(
  //           amount,
  //           solAmount.sub(
  //             solAmount.mul(new BN(Math.floor(slippage * 10))).div(new BN(1000))
  //           )
  //         )
  //         .accountsPartial({
  //           user: user,
  //           feeRecipient: new PublicKey(
  //             "DKbqMnDju2ftYBKM65DhPMLi7foVt5QPmbCmeeTk5eSN"
  //           ),
  //           vault: vaultPda,
  //           bondingCurve: bonding_curvePda,
  //           bondingCurveAta: bondingCurveATA,
  //           userAta: associatedUser,
  //           mint: mint,
  //         })
  //         .instruction()
  //     );

  //     return {
  //       success: true,
  //       data: instructions,
  //     };
  //   } catch (error) {
  //     console.error("Error in getSellTxs:", error);
  //     return {
  //       success: false,
  //       error: {
  //         type: CoinFlictErrors.UNKNOWN_ERROR,
  //         message:
  //           error instanceof Error
  //             ? error.message
  //             : "An unknown error occurred",
  //         details: error,
  //       },
  //     };
  //   }
  // }

  async getCreateTxs(
    mint: PublicKey,
    name: string,
    symbol: string,
    uri: string,
    user: PublicKey
  ): Promise<CoinFlictResult<TransactionInstruction>> {
    try {
      if (!mint || !name || !symbol || !uri || !user) {
        return {
          success: false,
          error: {
            type: CoinFlictErrors.INVALID_PARAMETERS,
            message: "Invalid parameters provided for token creation",
            details: { mint, name, symbol, uri, user },
          },
        };
      }

      const bonding_curvePda = this.bondingCurvePda(mint);
      const vaultPda = this.vaultPda(mint);
      const global = this.globalPda();
      const metadata = this.getMetadata(mint);

      const bondingCurveATA = await this.findAssociatedTokenAddress(
        bonding_curvePda,
        mint
      );

    

      const creatTx = await this.program.methods
        .create(name, symbol, uri).accountsStrict({
      payer:user,
      mint: mint,
      bondingCurve: bonding_curvePda,
      vault: vaultPda,
      bondingCurveAta: bondingCurveATA,
      global: global,
      metadata: metadata,
      mplMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId          
      })
      .instruction();

      return {
        success: true,
        data: creatTx,
      };
    } catch (error) {
      console.error("Error in getCreateTxs:", error);
      return {
        success: false,
        error: {
          type: CoinFlictErrors.UNKNOWN_ERROR,
          message:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
          details: error,
        },
      };
    }
  }

  findAssociatedTokenAddress = async (
    walletAddress: any,
    tokenMintAddress: any
  ) => {
    return bondingCurveAta(walletAddress, tokenMintAddress);
  };

  globalPda() {
    return globalPda(this.program.programId);
  }

  bondingCurvePda(mint: PublicKey | string): PublicKey {
    return bondingCurvePda(this.program.programId, mint);
  }

  getTokenAmount(bondingCurve: BondingCurve, Solamount: number): Number {
    const amount = Solamount * LAMPORTS_PER_SOL;

    const tokenamount = getBuyPrice(
      BigInt(amount),
      BigInt(bondingCurve.virtualSolReserve.toNumber()),
      BigInt(bondingCurve.virtualTokenReserve.toNumber()),
      BigInt(bondingCurve.realTokenReserve.toNumber())
    );

    return Number(tokenamount);
  }



  getSolAmount(bondingCurve: BondingCurve, TokenAmount: number):Number {
    
    const amount = TokenAmount*1000000;

    const solAmount = getSellPrice(
      BigInt(amount),
      BigInt(10),
      BigInt(bondingCurve.virtualSolReserve.toNumber()),
      BigInt( bondingCurve.virtualTokenReserve.toNumber()),
      bondingCurve.complete
    )
    
    return Number(solAmount);
  
  }

  async fetchGlobal(): Promise<any> {
    return await this.program.account.global.fetch(this.globalPda());
  }

  async fetchBondingCurve(mint: PublicKeyInitData): Promise<BondingCurve> {
    return await this.program.account.bondingCurve.fetch(
      this.bondingCurvePda(mint as PublicKey)
    );
  }

  vaultPda(mint: PublicKey | string): PublicKey {
    return vaultPda(this.program.programId, mint);
  }

  getMetadata(mint: PublicKey | string): PublicKey {
    return metadata(mint);
  }
}
