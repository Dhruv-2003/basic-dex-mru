export type Action = 'Check balance' | 'Check Pool' | 'Init pool' | 'Supply' | 'Withdraw' | 'Swap ETH to USDC' | 'Swap USDC to ETH' | 'Switch account' | 'Exit';

export interface PoolAmountResponse {
    ethAmount: number;
    usdcAmount: number;
}

export interface ShareAmountResponse {
    shares: number;
}

export interface EthAmountResponse {
    ethAmount: number;
}

export interface UsdcAmountResponse {
    usdcAmount: number;
}