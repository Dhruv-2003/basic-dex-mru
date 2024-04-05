import { ActionSchema, SolidityType } from "@stackr/sdk";

export const InitPoolSchema = new ActionSchema("init", {
  eth: SolidityType.UINT,
  usdc: SolidityType.UINT,
});


export const SupplyLiquiditySchema = new ActionSchema("supply", {
  eth: SolidityType.UINT,
  usdc: SolidityType.UINT,
});

export const WithdrawLiquiditySchema = new ActionSchema("withdraw", {
  shares: SolidityType.UINT
});

export const SwapTokenSchema = new ActionSchema("swap", {
  amount: SolidityType.UINT
});


export const schemas = {
  "init": InitPoolSchema,
  "supply": SupplyLiquiditySchema,
  "withdraw": WithdrawLiquiditySchema,
  "swapETHtoUSDC": SwapTokenSchema,
  "swapUSDCtoETH": SwapTokenSchema
};