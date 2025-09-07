// import coinflictIdl from "./IDL/pumpg.json";
// import { Pumpg } from "./IDL/pumpg";
// import { clusterApiUrl, Connection, Keypair } from "@solana/web3.js";
// import * as anchor from "@coral-xyz/anchor";



//   const keypair = Keypair.generate();
//   const wallet = new anchor.Wallet(keypair);
//   const connection = new Connection(clusterApiUrl("devnet"),"confirmed");


//   const provider = new anchor.AnchorProvider(connection, wallet);
//  const pumpProgram = new anchor.Program<Pumpg>(
//       coinflictIdl as Pumpg,
//       provider
//     );

//   (async() => {
//          const data = await pumpProgram.account.bondingCurve.fetch("F41kD7VoJEgfzfNEtwTCn9544uJo9S6c6otYHM9qHboy");
  

//          Object.entries(data).map((data) => {
//             console.log(`${data[0]} : ${data[1]}`)
//          })

//   })();