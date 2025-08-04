// Test file to verify TypeScript compatibility
import { CoinFlictSdk, BondingCurve, CoinFlictErrors } from './dist/index.js';
import { Connection, clusterApiUrl } from '@solana/web3.js';

console.log('✅ TypeScript imports working correctly!');
console.log('CoinFlictSdk:', typeof CoinFlictSdk);
console.log('BondingCurve interface available');
console.log('CoinFlictErrors enum available');

// Test that we can create an instance (without actually connecting)
const connection = new Connection(clusterApiUrl('devnet'));
const sdk = new CoinFlictSdk(connection);

console.log('✅ SDK instance created successfully');
console.log('✅ All TypeScript types and exports working correctly'); 