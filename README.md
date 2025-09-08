# coinflict-kit

A TypeScript SDK for [coinflict.fun](https://coinflict.fun) - A Solana token launchpad platform.

## Installation

```bash
npm install coinflict-kit
```

## Quick Start

```typescript
import { CoinFlictSdk } from 'coinflict-kit';
import { Connection, clusterApiUrl } from '@solana/web3.js';

const connection = new Connection(clusterApiUrl('devnet'));
const sdk = new CoinFlictSdk(connection);

// Create a new token
const mint = Keypair.generate();
const createTx = await sdk.getCreateTxs(
  mint.publicKey,
  "My Token",
  "MTK",
  "https://your-metadata-uri.com",
  user.publicKey
);

// Buy tokens
const buyTx = await sdk.getBuyTxs(
  mint.publicKey,
  user.publicKey,
  10, // slippage percentage
  new BN(tokenAmount),
  new BN(solAmount * LAMPORTS_PER_SOL)
);

// Sell tokens
const sellTx = await sdk.getSellTxs(
  mint.publicKey,
  user.publicKey,
  10, // slippage percentage
  new BN(tokenAmount),
  new BN(solAmount * LAMPORTS_PER_SOL)
);
```

## Features

- **Token Creation**: Create new tokens with metadata
- **Token Trading**: Buy and sell tokens using bonding curve mechanics
- **Price Calculations**: Get buy/sell prices based on bonding curve
- **PDA Management**: Handle Program Derived Addresses for vaults and bonding curves
- **TypeScript Support**: Full TypeScript support with type definitions

## API Reference

### CoinFlictSdk

The main SDK class for interacting with the coinflict.fun platform.

#### Constructor

```typescript
constructor(connection: Connection)
```

#### Methods

##### getCreateTxs
Creates transaction instructions for token creation.

```typescript
async getCreateTxs(
  mint: PublicKey,
  name: string,
  symbol: string,
  uri: string,
  user: PublicKey
): Promise<CoinFlictResult<TransactionInstruction>>
```

##### getBuyTxs
Creates transaction instructions for buying tokens.

```typescript
async getBuyTxs(
  mint: PublicKey,
  user: PublicKey,
  slippage: number,
  amount: BN,
  solAmount: BN
): Promise<CoinFlictResult<TransactionInstruction[]>>
```

##### getSellTxs
Creates transaction instructions for selling tokens.

```typescript
async getSellTxs(
  mint: PublicKey,
  user: PublicKey,
  slippage: number,
  amount: BN,
  solAmount: BN
): Promise<CoinFlictResult<TransactionInstruction[]>>
```

##### fetchBondingCurve
Fetches bonding curve data for a token.

```typescript
async fetchBondingCurve(mint: PublicKeyInitData): Promise<BondingCurve>
```

##### getTokenAmount
Calculates token amount for a given SOL amount.

```typescript
getTokenAmount(bondingCurve: BondingCurve, solAmount: number): number
```

##### getSolAmount
Calculates SOL amount for a given token amount.

```typescript
getSolAmount(bondingCurve: BondingCurve, tokenAmount: number): number
```

### Types

#### BondingCurve
```typescript
interface BondingCurve {
  mint: PublicKey;
  virtualTokenReserve: BN;
  virtualSolReserve: BN;
  realTokenReserve: BN;
  realSolReserve: BN;
  tokenTotalSupply: BN;
  complete: boolean;
  initializer: PublicKey;
  bump: number;
  vaultBump: number;
}
```

#### CoinFlictResult
```typescript
type CoinFlictResult<T> = 
  | { success: true; data: T }
  | { success: false; error: CoinFlictError };
```

#### CoinFlictError
```typescript
interface CoinFlictError {
  type: CoinFlictErrors;
  message: string;
  details?: any;
}
```

### Error Types

```typescript
enum CoinFlictErrors {
  BONDING_CURVE_NOT_FOUND = "BONDING_CURVE_NOT_FOUND",
  GLOBAL_DATA_NOT_FOUND = "GLOBAL_DATA_NOT_FOUND",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  NETWORK_ERROR = "NETWORK_ERROR",
  INVALID_PARAMETERS = "INVALID_PARAMETERS",
  UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
```

## Examples

### Complete Token Creation Example

```typescript
import { CoinFlictSdk } from 'coinflict-kit';
import { Connection, clusterApiUrl, Keypair, Transaction } from '@solana/web3.js';
import { BN } from 'bn.js';

const connection = new Connection(clusterApiUrl('devnet'));
const sdk = new CoinFlictSdk(connection);
const user = Keypair.generate(); // Your wallet keypair

async function createToken() {
  const mint = Keypair.generate();
  
  const createTx = await sdk.getCreateTxs(
    mint.publicKey,
    "My Awesome Token",
    "MAT",
    "https://arweave.net/your-metadata-uri",
    user.publicKey
  );

  if (createTx.success) {
    const transaction = new Transaction().add(createTx.data);
    transaction.feePayer = user.publicKey;
    
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    
    transaction.sign(user, mint);
    const signature = await connection.sendRawTransaction(transaction.serialize());
    
    console.log('Token created:', signature);
  } else {
    console.error('Failed to create token:', createTx.error);
  }
}
```

### Token Trading Example

```typescript
async function buyTokens(mint: PublicKey, solAmount: number) {
  const bondingCurve = await sdk.fetchBondingCurve(mint);
  const tokenAmount = sdk.getTokenAmount(bondingCurve, solAmount);
  
  const buyTx = await sdk.getBuyTxs(
    mint,
    user.publicKey,
    10, // 10% slippage
    new BN(tokenAmount.toString()),
    new BN(solAmount * LAMPORTS_PER_SOL)
  );

  if (buyTx.success) {
    const transaction = new Transaction().add(...buyTx.data);
    transaction.feePayer = user.publicKey;
    
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    
    transaction.sign(user);
    const signature = await connection.sendRawTransaction(transaction.serialize());
    
    console.log('Tokens bought:', signature);
  }
}
```

## Dependencies

- `@coral-xyz/anchor`: ^0.31.1
- `@solana/spl-token`: ^0.4.13
- `@solana/web3.js`: ^1.87.0 (peer dependency)
- `bn.js`: ^5.2.2

## License

MIT

## Links

- [coinflict.fun](https://coinflict.fun)
- [Documentation](https://docs.coinflict.fun)
- [GitHub Repository](https://github.com/your-username/coinflict-kit)

## Support

For support, please visit [coinflict.fun](https://coinflict.fun) or open an issue on GitHub. 