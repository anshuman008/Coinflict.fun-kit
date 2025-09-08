import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";


  const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );


export const globalPda = (programId: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("global")],
        programId,
    )[0];
}


export const bondingCurvePda = (
    programId: PublicKey,
    mint: PublicKey | string,
) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("bonding_curve"), new PublicKey(mint).toBuffer()],
        programId,
    )[0];
};

export const bondingCurveAta = (
       walletAddress:PublicKey, 
       mintAddress:PublicKey
) => {
   return PublicKey.findProgramAddressSync(
    [
      walletAddress.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      mintAddress.toBuffer()
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
   )[0]
}



  export const vaultPda = (
    programId: PublicKey,
    mint: PublicKey | string,
) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("curve_vault"), new PublicKey(mint).toBuffer()],
        programId,
    )[0];
};



  export const metadata = (
    mint: PublicKey | string,
  ) => {
    return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
       new PublicKey(mint).toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  )[0];
  }



