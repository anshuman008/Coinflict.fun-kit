import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { CoinFlictSdk } from "./sdk";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import dotenv from "dotenv";
import { BN } from "bn.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import fs from "fs";

dotenv.config();

const connection = new Connection("https://api.testnet.sonic.game", "finalized");
const sdk = new CoinFlictSdk(connection);
const signer = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));

const createToken = async () => {
  const mint = Keypair.generate();

  console.log("here is token mint---", mint.publicKey.toBase58());
  const itx = await sdk.getCreateTxs(
    mint.publicKey,
    "random",
    "ANS",
    "https://ipfs.io/ipfs/bafkreiaaqjofhbmgwb2qb2kiewhcne373v5cvrtrwloz5btrj7mtkly73i",
    signer.publicKey
  );

  if (itx.success) {
    const trans = new Transaction().add(itx.data);
    trans.feePayer = signer.publicKey;

    const { blockhash } = await connection.getLatestBlockhash();
    trans.recentBlockhash = blockhash;

    trans.sign(signer, mint);
    const tx = await connection.sendRawTransaction(trans.serialize());

    console.log("here is the txs", tx);
  }
};

const buyToken = async (mint: PublicKey) => { 


  // const signature = "2GE7w9QEtDtqAgKSQ5uGAHaoGDShmCnkvgGBNw7LRnMLHGCysFtJsqQHPfMy8BqCM9gZ17EGksmXYbMCieBE9RjS";
  // const txDetals = await connection.getParsedTransaction(signature);


  // console.log("her is detail---",txDetals);

  // fs.writeFileSync("message.json",JSON.stringify(txDetals,null,2));



  const intialBalance = await connection.getBalance(signer.publicKey);
  console.log("here is initial balance--", intialBalance / LAMPORTS_PER_SOL);

  const solAmount = 1;

  const bonding_curvedata = await sdk.fetchBondingCurve(mint);

  console.log("here is the bonding curve----",bonding_curvedata);

  const tokenamount = sdk.getTokenAmount(bonding_curvedata, solAmount);
  console.log("here is token amount i get--", Number(tokenamount) / 1000000);

  const tx = await sdk.getBuyTxs(
    mint,
    signer.publicKey,
    10,
    new BN(tokenamount.toString()),
    new BN(solAmount * LAMPORTS_PER_SOL)
  );

  if (tx.success) {
    if (!tx.data) return;

    const transection = new Transaction().add(...tx.data);

    transection.feePayer = signer.publicKey;

    const { blockhash } = await connection.getLatestBlockhash();
    transection.recentBlockhash = blockhash;
    transection.sign(signer);

    const simulation = await connection.simulateTransaction(transection);

    console.log("here is simulaion result---", simulation);

    const res = await connection.sendRawTransaction(transection.serialize());
    await connection.confirmTransaction(res);

    console.log("here is the signature---", res);

    console.log("this amount should be. buy!!", Number(tokenamount) / 1000000);

    const finalBalance = await connection.getBalance(signer.publicKey);

    console.log("here is initial balance--", finalBalance / LAMPORTS_PER_SOL);

    console.log(
      "sol invested ---",
      (intialBalance - finalBalance) / LAMPORTS_PER_SOL
    );
  }
}


const sellAllToken = async (mint: PublicKey) => {
  const userAta = getAssociatedTokenAddressSync(mint, signer.publicKey, true);

  console.log("User ATA:", userAta.toBase58());

  const tokenAccountInfo = await connection.getTokenAccountBalance(userAta);
  if (!tokenAccountInfo) {
    console.error("User ATA account not found");
    return;
  }

  console.log("User Token Hoding amount:", tokenAccountInfo.value.uiAmount);

  const bonding_curvedata = await sdk.fetchBondingCurve(mint);

  if(!tokenAccountInfo.value.uiAmount) return;


  const solAmount = sdk.getSolAmount(
    bonding_curvedata,
    tokenAccountInfo.value.uiAmount
  );
  console.log(
    "here is sol amount get in reverse--",
    Number(solAmount) / LAMPORTS_PER_SOL
  );

  const Itx = await sdk.getSellTxs(
    mint,
    signer.publicKey,
    10,
    new BN(tokenAccountInfo.value.amount),
    new BN(-1)
  );

  if (Itx.success) {
    const transaction = new Transaction().add(...Itx.data);

    transaction.feePayer = signer.publicKey;

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.sign(signer);

    // const simulation = await connection.simulateTransaction(transaction);

    const res = await connection.sendRawTransaction(transaction.serialize());

    console.log("here is signature--", res);
  }
};

// createToken();
buyToken(new PublicKey("BxBXred97wKEpy8cHcD2tHbVP9f2r2jJ9x9tz64mWhM2"));
// sellAllToken(new PublicKey("BxBXred97wKEpy8cHcD2tHbVP9f2r2jJ9x9tz64mWhM2"));

