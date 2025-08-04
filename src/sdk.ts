import coinflictIdl from "./IDL/pumpg.json";
import { Pumpg } from "./IDL/pumpg";
import * as anchor from "@coral-xyz/anchor";
import BN, { min } from "bn.js";
import { AccountInfo, clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { bondingCurvePda, globalPda, vaultPda , metadata, bondingCurveAta} from "./pda";
// import { BondingCurve, Global } from "./types";
import {  ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import dotenv from "dotenv";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { BondingCurve } from "./types";
import { getBuyPrice } from "./calculations";
// import { getBuyPrice } from "./calculations";
export const PUMP_PROGRAM_ID = new PublicKey(
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
);
export const PUMP_AMM_PROGRAM_ID = new PublicKey(
  "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
);


dotenv.config();

type PublicKeyData = {};
type PublicKeyInitData = number | string | Uint8Array | Array<number> | PublicKeyData;
type Error = {};


export enum CoinFlictErrors {
  BONDING_CURVE_NOT_FOUND = "BONDING_CURVE_NOT_FOUND",
  GLOBAL_DATA_NOT_FOUND = "GLOBAL_DATA_NOT_FOUND",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  NETWORK_ERROR = "NETWORK_ERROR",
  INVALID_PARAMETERS = "INVALID_PARAMETERS",
  UNKNOWN_ERROR = "UNKNOWN_ERROR"
}

export interface PumpFunError {
  type: CoinFlictErrors;
  message: string;
  details?: any;
}

export type PumpFunResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: PumpFunError;
};


export class CoinFlictSdk {
  private program: anchor.Program<Pumpg>;

  constructor(connection: Connection) {
    const keypair = Keypair.generate();
    const wallet = new anchor.Wallet(keypair);
    const provider = new anchor.AnchorProvider(connection, wallet);

    
    const pumpProgram = new anchor.Program<Pumpg>(coinflictIdl as Pumpg, provider);
    this.program = pumpProgram;
  }

  async getBuyTxs(
        mint:PublicKey,
        user:PublicKey,
        slippage: number,
        amount: BN,
        solAmount: BN,
  ) {

   try{


      if (!mint || !user || !amount || !solAmount) {
        return {
          success: false,
          error: {
            type: CoinFlictErrors.INVALID_PARAMETERS,
            message: "Invalid parameters provided",
            details: { mint, user, amount, solAmount }
          }
        };
      }


       if (slippage < 0 ) {
        return {
          success: false,
          error: {
            type: CoinFlictErrors.INVALID_PARAMETERS,
            message: "Slippage canot be in negative",
            details: { slippage }
          }
        };
      }


    const bonding_curvePda =  this.bondingCurvePda(mint);
    const vaultPda = this.vaultPda(mint);
 const bondingCurveATA = await this.findAssociatedTokenAddress(
    bonding_curvePda,
    mint
  );
    console.log("Bonding Curve PDA:", bonding_curvePda.toBase58());
    const bondingCurveAccountInfo = await this.program.provider.connection.getAccountInfo(bonding_curvePda);


   if (!bondingCurveAccountInfo) {
        return {
          success: false,
          error: {
            type: CoinFlictErrors.BONDING_CURVE_NOT_FOUND,
            message: "Bonding Curve account not found for this token",
            details: { mint: mint.toBase58(), bondingCurvePda: bonding_curvePda.toBase58() }
          }
        };
      }


   const instructions:TransactionInstruction[] = [];
   const associatedUser = getAssociatedTokenAddressSync(mint,user,true);


   const userTokenAccount = await this.program.provider.connection.getAccountInfo(associatedUser);


   if(!userTokenAccount){
    instructions.push(
        createAssociatedTokenAccountIdempotentInstruction(
            user,
            associatedUser,
            user,
            mint
        )
    )
   };


    console.log("pushing the transaction-------")
         instructions.push(
          await this.program.methods
            .buy(
              amount,
              solAmount.add(
                solAmount
                  .mul(new BN(Math.floor(slippage * 10)))
                  .div(new BN(1000)),
              ),
            )
            .accountsPartial({
             user:user,
             feeRecipient: new PublicKey("DKbqMnDju2ftYBKM65DhPMLi7foVt5QPmbCmeeTk5eSN"),
             vault:vaultPda,
             bondingCurve:bonding_curvePda,
             bondingCurveAta:bondingCurveATA,
             userAta: associatedUser,
             mint: mint,
            })
            .instruction(),
        );

      return {
        success: true,
        data: instructions
      };

   }
   catch(error){
    console.error("Error in getBuyTxs:", error);
      return {
        success: false,
        error: {
          type: CoinFlictErrors.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : "An unknown error occurred",
          details: error
        }
      };
   }

  }




  // async getSellTxs(mint:PublicKey,user:PublicKey,
  //       slippage: number,
  //       amount: BN,
  //       solAmount: BN,
  // ):  Promise<PumpFunResult<TransactionInstruction[]>> {

  //   try{
  //      if (!mint || !user || !amount || !solAmount) {
  //       return {
  //         success: false,
  //         error: {
  //           type: CoinFlictErrors.INVALID_PARAMETERS,
  //           message: "Invalid parameters provided",
  //           details: { mint, user, amount, solAmount }
  //         }
  //       };
  //     }


  //      if (slippage < 0 ) {
  //       return {
  //         success: false,
  //         error: {
  //           type: PumpFunErrorType.INVALID_PARAMETERS,
  //           message: "Slippage cant be in negative",
  //           details: { slippage }
  //         }
  //       };
  //     }

  //  const instructions:TransactionInstruction[] = [];
  //  const associatedUser = getAssociatedTokenAddressSync(mint,user,true);

  //   const globalPda = this.globalPda();
  //   const globalData = await this.program.account.global.fetch(globalPda);
  //   const feeWallet = getFeeRecipient(globalData);

  //        instructions.push(
  //         await this.program.methods
  //           .sell(
  //             amount,
  //             solAmount.sub(
  //               solAmount
  //                 .mul(new BN(Math.floor(slippage * 10)))
  //                 .div(new BN(1000)),
  //             ),
  //           )
  //           .accountsPartial({
  //             feeRecipient: feeWallet,
  //             mint,
  //             associatedUser,
  //             user,
  //           })
  //           .instruction(),
  //       );

  //       return {
  //       success: true,
  //       data: instructions
  //     };
  //   }
  //   catch(error){
  //    console.error("Error in getSellTxs:", error);
  //     return {
  //       success: false,
  //       error: {
  //         type: PumpFunErrorType.UNKNOWN_ERROR,
  //         message: error instanceof Error ? error.message : "An unknown error occurred",
  //         details: error
  //       }
  //     };

  //   }
  // }


  async getCreateTxs(
    mint: PublicKey,
    name: string,
    symbol: string,
    uri: string,
    user: PublicKey,
  ): Promise<PumpFunResult<TransactionInstruction>> {
    
    try{

      if (!mint || !name || !symbol || !uri  || !user) {
        return {
          success: false,
          error: {
            type: CoinFlictErrors.INVALID_PARAMETERS,
            message: "Invalid parameters provided for token creation",
            details: { mint, name, symbol, uri, user }
          }
        };
      }

  



    const bonding_curvePda =  this.bondingCurvePda(mint);
    const vaultPda = this.vaultPda(mint);
    const global = this.globalPda();
    const metadata = this.getMetadata(mint);

 const bondingCurveATA = await this.findAssociatedTokenAddress(
    bonding_curvePda,
    mint
  );

     const creatTx = await this.program.methods
     .create(name,symbol,uri)
     .accounts({
        payer: user,
        mint:mint,
        //@ts-ignore
        bondingCurve: bonding_curvePda,
        vault: vaultPda,
        bondingCurveAta:bondingCurveATA,
        global: global,
        metadata: metadata,
        mplMetadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
        associatedTokenProgram: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
        tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        rent: new PublicKey("SysvarRent111111111111111111111111111111111"),
        systemProgram: new PublicKey("11111111111111111111111111111111")
     })
      .instruction();

      return {
        success: true,
        data: creatTx
      };
    }
    catch(error){
    console.error("Error in getCreateTxs:", error);
      return {
        success: false,
        error: {
          type: CoinFlictErrors.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : "An unknown error occurred",
          details: error
        }
      };
    }
  }

  


  findAssociatedTokenAddress = async (walletAddress:any, tokenMintAddress:any) => {
   return  (
      bondingCurveAta(walletAddress,tokenMintAddress)
  ) 
};

  globalPda() {
     return globalPda(this.program.programId);
   }


  bondingCurvePda(mint: PublicKey | string): PublicKey {
    return bondingCurvePda(this.program.programId, mint);
  }

  

  getTokenAmount(bondingCurve:BondingCurve,Solamount:number):Number{
  
    const amount = Solamount * LAMPORTS_PER_SOL;

    const tokenamount = getBuyPrice(BigInt(amount), BigInt(bondingCurve.virtualSolReserve.toNumber()), BigInt(bondingCurve.virtualTokenReserve.toNumber()), BigInt(bondingCurve.realTokenReserve.toNumber()));

    return Number(tokenamount);
   };

  async fetchGlobal(): Promise<any> {
    return await this.program.account.global.fetch(
      this.globalPda(),
    );
  }

  async fetchBondingCurve(mint: PublicKeyInitData): Promise<BondingCurve> {
    return await this.program.account.bondingCurve.fetch(
      this.bondingCurvePda(mint as PublicKey),
    );
  }

  
 vaultPda(mint: PublicKey | string): PublicKey {
    return vaultPda(this.program.programId, mint);
  }

getMetadata(mint: PublicKey | string): PublicKey {
    return metadata(mint);
  }


}




(async() => {


    const connection = new Connection(clusterApiUrl("devnet"),"confirmed");
    const sdk = new CoinFlictSdk(connection);
   const signer = Keypair.fromSecretKey(
    bs58.decode(process.env.PRIVATE_KEY!)
  );


  console.log("here is signer---", signer.publicKey);
  // const balance = await connection.getBalance(signer.publicKey);

  // console.log("here is balance!", balance/LAMPORTS_PER_SOL);
    const mint = new PublicKey("D4PSWgkSfTdnZ9eEJ4iNMzW61SXDQCPFXPa5mFZ6HXvK");
    const solAmount = 0.1;

    const bonding_curvedata = await sdk.fetchBondingCurve(mint);
    
    const tokenamount = sdk.getTokenAmount(bonding_curvedata,solAmount);

    console.log("here is token amount i get--", Number(tokenamount)/1000000);


  //   const itx = await sdk.getCreateTxs(mint.publicKey,"random","ANS","https://ipfs.io/ipfs/bafkreiaaqjofhbmgwb2qb2kiewhcne373v5cvrtrwloz5btrj7mtkly73i",signer.publicKey);


  //   if(itx.success){
  //       const trans = new Transaction().add(itx.data);
  //       trans.feePayer = signer.publicKey;

  //       const {blockhash} = await connection.getLatestBlockhash();
  //       trans.recentBlockhash = blockhash;

  //       trans.sign(signer,mint)
  //       const tx = await connection.sendRawTransaction(trans.serialize());

  //      console.log("here is the txs", tx)
  //   }


  const tx = await sdk.getBuyTxs(mint,signer.publicKey,10,new BN(tokenamount.toString()),new BN(0.1*LAMPORTS_PER_SOL));


    if(tx.success){
      if(!tx.data) return;

      console.log("loadinggg")
    const transection = new Transaction().add(...tx.data);
     
    transection.feePayer = signer.publicKey;

        const {blockhash} = await connection.getLatestBlockhash();
        transection.recentBlockhash = blockhash;
         transection.sign(signer);

          
       const simulation = await connection.simulateTransaction(transection);

       console.log("here is simulaion result---", simulation);

       const res = await connection.sendRawTransaction(transection.serialize());


       console.log("this amount should be. buy!!", Number(tokenamount)/1000000);
       console.log("here is the signature---", res);

    }
})()
