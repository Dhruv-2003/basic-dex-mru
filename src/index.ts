import { ActionSchema, AllowedInputTypes, MicroRollup } from "@stackr/sdk";
import { HDNodeWallet, Wallet } from "ethers";
import { stackrConfig } from "../stackr.config.ts";
import { InitPoolSchema, SwapTokenSchema, WithdrawLiquiditySchema } from "./stackr/action.ts";
import { machine } from "./stackr/machine.ts";

import dotenv from "dotenv";
import { Playground } from "@stackr/sdk/plugins";
dotenv.config();

let wallet: Wallet;
if (process.env.PRIVATE_KEY) {
  wallet = new Wallet(process.env.PRIVATE_KEY);
}

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

const main = async () => {
  const rollup = await MicroRollup({
    config: stackrConfig,
    actionSchemas: [InitPoolSchema, SwapTokenSchema, WithdrawLiquiditySchema],
    stateMachines: [machine],
    isSandbox: true
  });



  await rollup.init();
  Playground.init(rollup)

  const inputs = {
    eth: 100,
    usdc: 1000
  };

  const signature = await signMessage(wallet, InitPoolSchema, inputs);
  const initAction = InitPoolSchema.actionFrom({
    inputs,
    signature,
    msgSender: wallet.address,
  });

  const ack = await rollup.submitAction("init", initAction);
  console.log(ack);
};

main();
