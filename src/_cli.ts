import inquirer from 'inquirer';
import { ActionSchema, AllowedInputTypes, MicroRollup } from "@stackr/sdk";
import { HDNodeWallet, Wallet } from "ethers";
import { stackrConfig } from "../stackr.config.ts";
import { InitPoolSchema, SwapTokenSchema, WithdrawLiquiditySchema } from "./stackr/action.ts";
import { machine } from "./stackr/machine.ts";

import dotenv from "dotenv";
import { Playground } from "@stackr/sdk/plugins";

dotenv.config();


const accounts = {
    'Account 1': new Wallet(process.env.PRIVATE_KEY!),
    'Account 2': new Wallet(process.env.SECOND_KEY!)
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



type Action = 'Check balance' | 'Init pool' | 'Supply' | 'Withdraw' | 'Swap ETH to USDC' | 'Swap USDC to ETH' | 'Switch account' | 'Exit';


interface PoolAmountResponse {
    ethAmount: number;
    usdcAmount: number;
}

interface ShareAmountResponse {
    shares: number;
}

interface EthAmountResponse {
    ethAmount: number;
}

interface UsdcAmountResponse {
    usdcAmount: number;
}



const askAccount = async (): Promise<void> => {
    await inquirer.prompt([
        {
            type: 'list',
            name: 'account',
            message: 'Choose an account:',
            choices: ['Account 1', 'Account 2'],
        },
    ]);


};

const askAction = async (): Promise<inquirer.Answers> => {
    return inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'Choose an action:',
            choices: ['Check balance', 'Init pool', 'Supply', 'Withdraw', 'Swap ETH to USDC', 'Swap USDC to ETH', 'Switch account', 'Exit'],
        },
    ]);
};

const askAmount = async (action: Action): Promise<PoolAmountResponse | ShareAmountResponse | EthAmountResponse | UsdcAmountResponse | {}> => {
    switch (action) {
        case 'Init pool':
        case 'Supply':
            return inquirer.prompt<PoolAmountResponse>([
                {
                    type: 'input',
                    name: 'ethAmount',
                    message: 'Enter the ETH amount:',
                    validate: (value: string): boolean | string => {
                        const valid = !isNaN(parseFloat(value)) && parseFloat(value) > 0;
                        return valid || 'Please enter a positive number';
                    },
                    filter: (value: string): number => parseFloat(value),
                },
                {
                    type: 'input',
                    name: 'usdcAmount',
                    message: 'Enter the USDC amount:',
                    validate: (value: string): boolean | string => {
                        const valid = !isNaN(parseFloat(value)) && parseFloat(value) > 0;
                        return valid || 'Please enter a positive number';
                    },
                    filter: (value: string): number => parseFloat(value),
                },
            ]);
        case 'Withdraw':
            return inquirer.prompt<ShareAmountResponse>([
                {
                    type: 'input',
                    name: 'shares',
                    message: 'Enter the amount of shares:',
                    validate: (value: string): boolean | string => {
                        const valid = !isNaN(parseFloat(value)) && parseFloat(value) > 0;
                        return valid || 'Please enter a positive number';
                    },
                    filter: (value: string): number => parseFloat(value),
                },
            ]);
        case 'Swap ETH to USDC':
            return inquirer.prompt<EthAmountResponse>([
                {
                    type: 'input',
                    name: 'ethAmount',
                    message: 'Enter the ETH amount to sell:',
                    validate: (value: string): boolean | string => {
                        const valid = !isNaN(parseFloat(value)) && parseFloat(value) > 0;
                        return valid || 'Please enter a positive number';
                    },
                    filter: (value: string): number => parseFloat(value),
                },
            ]);
        case 'Swap USDC to ETH':
            return inquirer.prompt<UsdcAmountResponse>([
                {
                    type: 'input',
                    name: 'usdcAmount',
                    message: 'Enter the USDC amount to sell:',
                    validate: (value: string): boolean | string => {
                        const valid = !isNaN(parseFloat(value)) && parseFloat(value) > 0;
                        return valid || 'Please enter a positive number';
                    },
                    filter: (value: string): number => parseFloat(value),
                },
            ]);
        default:
            return Promise.resolve({});
    }
};

const main = async (): Promise<void> => {

    const rollup = await MicroRollup({
        config: stackrConfig,
        actionSchemas: [InitPoolSchema, SwapTokenSchema, WithdrawLiquiditySchema],
        stateMachines: [machine],
        isSandbox: true
    });

    await rollup.init();
    Playground.init(rollup);
    await (new Promise(resolve => setTimeout(resolve, 175)));

    console.clear();



    const actions = {
        checkBalance: (): void => {

        },
        initPool: (ethAmount: number, usdcAmount: number): void => console.log(`Pool initialized with ETH: ${ethAmount}, USDC: ${usdcAmount}.`),
        supply: (ethAmount: number, usdcAmount: number): void => console.log(`Supplied ETH: ${ethAmount}, USDC: ${usdcAmount}.`),
        withdraw: (shares: number): void => console.log(`Withdrew shares: ${shares}.`),
        swapETHtoUSDC: (ethAmount: number): void => console.log(`Swapped ETH: ${ethAmount} to USDC.`),
        swapUSDCtoETH: (usdcAmount: number): void => console.log(`Swapped USDC: ${usdcAmount} to ETH.`),
    };


    let exit = false;
    let accountSelected = false;
    while (!exit) {
        if (!accountSelected) {
            await askAccount();
            accountSelected = true; // Account is selected
        }

        const actionResponse = await askAction();
        const action: Action = actionResponse.action as Action;

        if (action === 'Exit') {
            exit = true;
        } else if (action === 'Switch account') {
            accountSelected = false; // Reset account selection
        } else {
            const response = await askAmount(action);
            if (action === 'Check balance') {
                actions.checkBalance();
            } else if (['Init pool', 'Supply'].includes(action)) {
                const { ethAmount, usdcAmount } = response as PoolAmountResponse;
                action === 'Init pool' ? actions.initPool(ethAmount, usdcAmount) : actions.supply(ethAmount, usdcAmount);
            } else if (action === 'Withdraw') {
                const { shares } = response as ShareAmountResponse;
                actions.withdraw(shares);
            } else if (action === 'Swap ETH to USDC') {
                const { ethAmount } = response as EthAmountResponse;
                actions.swapETHtoUSDC(ethAmount);
            } else if (action === 'Swap USDC to ETH') {
                const { usdcAmount } = response as UsdcAmountResponse;
                actions.swapUSDCtoETH(usdcAmount);
            }
        }
    }
    console.log('Exiting app...');
};

main();
