import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { BondingCurve } from "./types";



export const getBuyPrice = (amount: bigint , virtual_sol_reserve: bigint ,virtual_token_reserve: bigint, real_token_reserve: bigint): bigint => {


  //@ts-ignore
  if (amount <= 0n) {
    //@ts-ignore
    return 0n;
  }

  // Calculate the product of virtual reserves
  
  let n = virtual_sol_reserve * virtual_token_reserve;

  // Calculate the new virtual sol reserves after the purchase
  let i = virtual_sol_reserve + amount;

  // Calculate the new virtual token reserves after the purchase

  //@ts-ignore
  let r = n / i + 100n;

  // Calculate the amount of tokens to be purchased
  let s = virtual_token_reserve - r;


  // console.log("here is the sol amount which user want to buy!!", amount );
  // console.log("here is the intial virtual sol ----->>>> ", virtual_sol_reserve );
  // console.log("here is the after adding buying amount sol into virtual sol ----->>>> ", virtual_sol_reserve);


  // console.log("here is the new virtual token reserves ----->>>> ", r);

  // console.log("here is the amount of tokens to be purchased ----->>>> ", s);

  // Return the minimum of the calculated tokens and real token reserves
  return s < real_token_reserve ? s : real_token_reserve;

  // return s;
}


export const getSellPrice = (amount: bigint , feeBasisPoints: bigint, virtual_sol_reserve: bigint ,virtual_token_reserve: bigint, complete:boolean): bigint => {
  if (complete) {
    throw new Error("Curve is complete");
  }

  //@ts-ignore
  if (amount <= 0n) {
    //@ts-ignore
    return 0n;
  }

  // Calculate the proportional amount of virtual sol reserves to be received
  let n = (amount * virtual_sol_reserve) / (virtual_token_reserve + amount);

  // Calculate the fee amount in the same units

  //@ts-ignore
  let a = (n * feeBasisPoints) / 10000n;

  // Return the net amount after deducting the fee
  return n - a;
}