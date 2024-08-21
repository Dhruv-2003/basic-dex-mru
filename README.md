# Decentralised exchange MRU

A Decentralised exchange based on Uniswap v2 model using the `x.y=k` curve built on MRU.

This example is similar to a Liquidity pool containing shares of mock assets ETH and USDC. User can supply & withdraw assets to the pool , and swap ETH for USDC or USDC for ETH.

Initialized using [@stackr/sdk](https://www.stackrlabs.xyz/)

## Project Structure

```
│
├──  src
|   |
|   ├── stackr
|   │   ├── machine.ts
|   │   ├── action.ts
|   │   ├── transitions.ts
|   |
│   ├── index.ts
|   │── cli.ts
|   │── cli-types.ts
|
│── stackr.config.ts
│── deployment.json

```

## How to run ?

### Run using Node.js :rocket:

```bash
bun run src/cli.ts
```
