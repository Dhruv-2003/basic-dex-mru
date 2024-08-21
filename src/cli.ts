import inquirer from "inquirer";
import { ActionSchema, AllowedInputTypes, MicroRollup } from "@stackr/sdk";
import { Wallet } from "ethers";
import { stackrConfig } from "../stackr.config.ts";
import {
  InitPoolSchema,
  schemas,
  SupplyLiquiditySchema,
  SwapTokenSchema,
  WithdrawLiquiditySchema,
} from "./stackr/action.ts";
import { machine } from "./stackr/machine.ts";

import {
  Action,
  PoolAmountResponse,
  ShareAmountResponse,
  EthAmountResponse,
  UsdcAmountResponse,
} from "./cli-types.ts";

import dotenv from "dotenv";
import { Playground } from "@stackr/sdk/plugins";

dotenv.config();

const rollup = await MicroRollup({
  config: stackrConfig,
  actionSchemas: [
    InitPoolSchema,
    SwapTokenSchema,
    SupplyLiquiditySchema,
    WithdrawLiquiditySchema,
  ],
  stateMachines: [machine],
  stfSchemaMap: schemas,
});

await rollup.init();
Playground.init(rollup);
const sm = rollup.stateMachines.get<typeof machine>("dex");

const accounts = {
  "Account 1": new Wallet(process.env.PRIVATE_KEY!),
  "Account 2": new Wallet(process.env.SECOND_KEY!),
};
let selectedWallet: Wallet;

const signMessage = async (
  wallet: Wallet,
  schema: ActionSchema,
  payload: AllowedInputTypes
) => {
  const signature = await wallet.signTypedData(
    schema.domain,
    schema.EIP712TypedData.types,
    payload
  );
  return signature;
};

const actions = {
  checkBalance: async (): Promise<void> => {
    const account = sm?.state.balances.find(
      (account) => account.wallet === selectedWallet.address
    );
    console.log(account?.balances);
  },
  checkPool: async (): Promise<void> => {
    const pool = sm?.state.pool;
    console.log(pool);
  },
  initPool: async (ethAmount: number, usdcAmount: number): Promise<void> => {
    const inputs = {
      eth: ethAmount,
      usdc: usdcAmount,
    };
    const signature = await signMessage(selectedWallet, InitPoolSchema, inputs);
    const initAction = InitPoolSchema.actionFrom({
      inputs,
      signature,
      msgSender: selectedWallet.address,
    });
    const ack = await rollup.submitAction("init", initAction);
    console.log("Action has been submitted.");
    console.log(ack);
  },
  supply: async (ethAmount: number, usdcAmount: number): Promise<void> => {
    const inputs = {
      eth: ethAmount,
      usdc: usdcAmount,
    };
    const signature = await signMessage(selectedWallet, InitPoolSchema, inputs);
    const initAction = SupplyLiquiditySchema.actionFrom({
      inputs,
      signature,
      msgSender: selectedWallet.address,
    });
    const ack = await rollup.submitAction("supply", initAction);
    console.log("Action has been submitted.");
    console.log(ack);
    console.log(`Supplied ETH: ${ethAmount}, USDC: ${usdcAmount}.`);
  },
  withdraw: async (shares: number): Promise<void> => {
    const inputs = {
      shares,
    };
    const signature = await signMessage(
      selectedWallet,
      WithdrawLiquiditySchema,
      inputs
    );
    const withdrawAction = WithdrawLiquiditySchema.actionFrom({
      inputs,
      signature,
      msgSender: selectedWallet.address,
    });
    const ack = await rollup.submitAction("withdraw", withdrawAction);
    console.log("Action has been submitted.");
    console.log(ack);
    console.log(`You withdrew ${shares} shares.`);
  },
  swapETHtoUSDC: async (ethAmount: number): Promise<void> => {
    const inputs = { amount: ethAmount };
    const signature = await signMessage(
      selectedWallet,
      SwapTokenSchema,
      inputs
    );
    const swapAction = SwapTokenSchema.actionFrom({
      inputs,
      signature,
      msgSender: selectedWallet.address,
    });
    const ack = await rollup.submitAction("swapETHtoUSDC", swapAction);
    console.log(`You swapped ${ethAmount}ETH to USDC.`);
    console.log(ack);
  },
  swapUSDCtoETH: async (usdcAmount: number): Promise<void> => {
    const inputs = { amount: usdcAmount };
    const signature = await signMessage(
      selectedWallet,
      SwapTokenSchema,
      inputs
    );
    const swapAction = SwapTokenSchema.actionFrom({
      inputs,
      signature,
      msgSender: selectedWallet.address,
    });
    const ack = await rollup.submitAction("swapUSDCtoETH", swapAction);
    console.log(`You swapped ${usdcAmount}USDC to ETH.`);
    console.log(ack);
  },
};

const askAccount = async (): Promise<"Account 1" | "Account 2"> => {
  const response = await inquirer.prompt([
    {
      type: "list",
      name: "account",
      message: "Choose an account:",
      choices: ["Account 1", "Account 2"],
    },
  ]);
  return response.account;
};

const askAction = async (): Promise<any> => {
  return inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "Choose an action:",
      choices: [
        "Check balance",
        "Check Pool",
        "Init pool",
        "Supply",
        "Withdraw",
        "Swap ETH to USDC",
        "Swap USDC to ETH",
        "Switch account",
        "Exit",
      ],
    },
  ]);
};

const askAmount = async (
  action: Action
): Promise<
  | PoolAmountResponse
  | ShareAmountResponse
  | EthAmountResponse
  | UsdcAmountResponse
  | {}
> => {
  switch (action) {
    case "Init pool":
    case "Supply":
      return inquirer.prompt<PoolAmountResponse>([
        {
          type: "input",
          name: "ethAmount",
          message: "Enter the ETH amount:",
          validate: (value: string): boolean | string => {
            const valid = !isNaN(parseFloat(value)) && parseFloat(value) > 0;
            return valid || "Please enter a positive number";
          },
          filter: (value: string): number => parseFloat(value),
        },
        {
          type: "input",
          name: "usdcAmount",
          message: "Enter the USDC amount:",
          validate: (value: string): boolean | string => {
            const valid = !isNaN(parseFloat(value)) && parseFloat(value) > 0;
            return valid || "Please enter a positive number";
          },
          filter: (value: string): number => parseFloat(value),
        },
      ]);
    case "Withdraw":
      return inquirer.prompt<ShareAmountResponse>([
        {
          type: "input",
          name: "shares",
          message: "Enter the amount of shares:",
          validate: (value: string): boolean | string => {
            const valid = !isNaN(parseFloat(value)) && parseFloat(value) > 0;
            return valid || "Please enter a positive number";
          },
          filter: (value: string): number => parseFloat(value),
        },
      ]);
    case "Swap ETH to USDC":
      return inquirer.prompt<EthAmountResponse>([
        {
          type: "input",
          name: "ethAmount",
          message: "Enter the ETH amount to sell:",
          validate: (value: string): boolean | string => {
            const valid = !isNaN(parseFloat(value)) && parseFloat(value) > 0;
            return valid || "Please enter a positive number";
          },
          filter: (value: string): number => parseFloat(value),
        },
      ]);
    case "Swap USDC to ETH":
      return inquirer.prompt<UsdcAmountResponse>([
        {
          type: "input",
          name: "usdcAmount",
          message: "Enter the USDC amount to sell:",
          validate: (value: string): boolean | string => {
            const valid = !isNaN(parseFloat(value)) && parseFloat(value) > 0;
            return valid || "Please enter a positive number";
          },
          filter: (value: string): number => parseFloat(value),
        },
      ]);
    default:
      return Promise.resolve({});
  }
};

const main = async (): Promise<void> => {
  let exit = false;
  let selectedAccount: string = ""; // To store the selected account

  while (!exit) {
    if (!selectedAccount) {
      selectedAccount = await askAccount();
      if (selectedAccount === "Account 1" || selectedAccount === "Account 2") {
        selectedWallet = accounts[selectedAccount];
        console.log(
          `You have selected: ${selectedWallet.address.slice(0, 12)}...`
        );
      }
    }

    const actionResponse = await askAction();
    const action: Action = actionResponse.action as Action;

    if (action === "Exit") {
      exit = true;
    } else if (action === "Switch account") {
      selectedAccount = ""; // Reset selected account so the user can choose again
    } else {
      const response = await askAmount(action);
      if (action === "Check balance") {
        await actions.checkBalance();
      } else if (action === "Check Pool") {
        await actions.checkPool();
      } else if (["Init pool", "Supply"].includes(action)) {
        const { ethAmount, usdcAmount } = response as PoolAmountResponse;
        action === "Init pool"
          ? await actions.initPool(ethAmount, usdcAmount)
          : actions.supply(ethAmount, usdcAmount);
      } else if (action === "Withdraw") {
        const { shares } = response as ShareAmountResponse;
        await actions.withdraw(shares);
      } else if (action === "Swap ETH to USDC") {
        const { ethAmount } = response as EthAmountResponse;
        await actions.swapETHtoUSDC(ethAmount);
      } else if (action === "Swap USDC to ETH") {
        const { usdcAmount } = response as UsdcAmountResponse;
        actions.swapUSDCtoETH(usdcAmount);
      }
    }
  }
  console.log("Exiting app...");
};

main();
