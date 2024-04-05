import { REQUIRE, STF, Transitions } from "@stackr/sdk/machine";
import { DEXState } from "./machine";
import { ZeroAddress } from "ethers";


const init: STF<DEXState> = {
  handler: ({ state, msgSender, inputs }) => {
    const { eth, usdc } = inputs;

    /* 
      1. Calculate the amount of liquidity to mint for the user. 
        - Math.sqrt(amount0.mul(amount1)).sub(MINIMUM_LIQUIDITY);
      2. Lock a minimum liquidity amount to ZeroAddress
      3. Mint liquidity to user.
      4. Update the reserves data.
      5. Calculate kLast.
    */

    REQUIRE(!state.pool.init, "INIT :: POOL ALREADY INIT");

    const accountIdx = state.balances.findIndex(account => account.wallet === msgSender);
    REQUIRE(accountIdx > - 1, "INIT :: USER NOT FOUND");

    const account = state.balances[accountIdx]
    REQUIRE(account.balances.eth >= eth && account.balances.usdc >= usdc, "INIT: INSUFFICIENT BALANCE");

    const shares = Math.sqrt(eth * usdc) - state.pool.minLiquidity;

    // Lock minimum liquidity to address(0);
    state.balances.push({
      wallet: ZeroAddress,
      balances: {
        eth: 0,
        usdc: 0,
        shares: state.pool.minLiquidity
      }
    })

    // Update balances for the user. 
    state.balances[accountIdx].balances.shares = shares;
    state.balances[accountIdx].balances.eth -= eth;
    state.balances[accountIdx].balances.usdc -= usdc;

    // Update pool status.
    state.pool.init = true;
    state.pool.ethReserve = eth;
    state.pool.usdcReserve = usdc;
    state.pool.totalShares = shares;


    return state;
  }
}

const supply: STF<DEXState> = {
  handler: ({ state, msgSender, inputs }) => {
    REQUIRE(state.pool.init, "SUPPLY: POOL NOT INIT");

    const accountIdx = state.balances.findIndex(account => account.wallet === msgSender);
    REQUIRE(accountIdx > -1, "SUPPLY: ACCOUNT NOT FOUND")

    const { eth, usdc } = inputs;

    const account = state.balances[accountIdx]
    REQUIRE(account.balances.eth >= eth && account.balances.usdc >= usdc, "SUPPLY: INSUFFICIENT BALANCE");


    const shares0 = (eth * state.pool.totalShares) / state.pool.ethReserve;
    const shares1 = (usdc * state.pool.totalShares) / state.pool.usdcReserve;
    const shares = Math.min(shares0, shares1);

    account.balances.shares += shares;
    account.balances.eth -= eth;
    account.balances.usdc -= usdc;
    state.balances[accountIdx] = account;

    state.pool.ethReserve += eth;
    state.pool.usdcReserve += usdc;
    state.pool.totalShares += shares;

    return state;
  }
}

const withdraw: STF<DEXState> = {
  handler: ({ state, msgSender, inputs }) => {
    REQUIRE(state.pool.init, "SUPPLY: POOL NOT INIT");

    const accountIdx = state.balances.findIndex(account => account.wallet === msgSender);
    REQUIRE(accountIdx > -1, "SUPPLY: ACCOUNT NOT FOUND");

    const { shares } = inputs;

    const account = state.balances[accountIdx];
    REQUIRE(account.balances.shares >= shares, "WITHDRAW: INSUFFICIENT AMOUNT");

    const ethAmount = (shares * state.pool.ethReserve) / state.pool.totalShares;
    const usdcAmount = (shares * state.pool.usdcReserve) / state.pool.totalShares;

    REQUIRE(ethAmount > 0 && usdcAmount > 0, "WITHDRAW: INSUFFICIENT AMOUNT BURNED");

    account.balances.shares -= shares;
    account.balances.eth += ethAmount;
    account.balances.usdc += usdcAmount;
    state.balances[accountIdx] = account;

    state.pool.ethReserve -= ethAmount;
    state.pool.usdcReserve -= usdcAmount;
    state.pool.totalShares -= shares;

    return state;
  }
}

const swapETHtoUSDC: STF<DEXState> = {
  handler: ({ state, msgSender, inputs }) => {
    REQUIRE(state.pool.init, "SUPPLY: POOL NOT INIT");

    const accountIdx = state.balances.findIndex(account => account.wallet === msgSender);
    REQUIRE(accountIdx > -1, "SUPPLY: ACCOUNT NOT FOUND");

    const { amount } = inputs;
    const account = state.balances[accountIdx];
    REQUIRE(amount <= account.balances.eth, "SWAP: INSUFFICIENT ETH");

    /* 
        const numerator: number = amountIn * reserveOut;
        const denominator: number = reserveIn + amountIn;
        const amountOut: number = numerator / denominator;
    */

    const numerator = amount * state.pool.usdcReserve;
    const denominator = state.pool.ethReserve + amount;

    const usdcOut = numerator / denominator;
    REQUIRE(usdcOut < state.pool.usdcReserve, "SWAP: INSUFFICIENT USDC");

    account.balances.eth -= amount;
    account.balances.usdc += usdcOut;
    state.balances[accountIdx] = account;

    state.pool.ethReserve += amount;
    state.pool.usdcReserve -= usdcOut;


    return state;
  }
}

const swapUSDCtoETH: STF<DEXState> = {
  handler: ({ state, msgSender, inputs }) => {
    REQUIRE(state.pool.init, "SUPPLY: POOL NOT INIT");

    const accountIdx = state.balances.findIndex(account => account.wallet === msgSender);
    REQUIRE(accountIdx > -1, "SUPPLY: ACCOUNT NOT FOUND");

    const { amount } = inputs;
    const account = state.balances[accountIdx];
    REQUIRE(amount <= account.balances.usdc, "SWAP: INSUFFICIENT USDC");

    const numerator = amount * state.pool.ethReserve;
    const denominator = state.pool.ethReserve + amount;

    const ethOut = numerator / denominator;
    REQUIRE(ethOut < state.pool.ethReserve, "SWAP: INSUFFICIENT ETH");

    account.balances.eth += ethOut;
    account.balances.usdc -= amount;
    state.balances[accountIdx] = account;

    state.pool.ethReserve -= ethOut;
    state.pool.usdcReserve += amount;

    return state;
  }
}


export const transitions: Transitions<DEXState> = {
  init,
  supply,
  withdraw,
  swapETHtoUSDC,
  swapUSDCtoETH
};
