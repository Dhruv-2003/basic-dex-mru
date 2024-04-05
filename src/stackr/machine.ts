import { State, StateMachine } from "@stackr/sdk/machine";
import { solidityPackedKeccak256 } from "ethers";

import * as genesisState from "../../genesis-state.json";
import { transitions } from "./transitions";
import { SolidityType } from "@stackr/sdk";


// type DEXStateType = {
//   pool: {
//     init: SolidityType.BOOL
//     ethReserve: SolidityType.UINT,
//     usdcReserve: SolidityType.UINT,
//     kLast: SolidityType.UINT,
//   }
//   balances: {
//     user: SolidityType.ADDRESS,
//     balances: {
//       eth: SolidityType.UINT,
//       usdc: SolidityType.UINT,
//       shares: SolidityType.UINT
//     }
//   }[];
// };

type DEXStateType = {
  pool: {
    init: boolean,
    minLiquidity: number,
    totalShares: number,
    ethReserve: number,
    usdcReserve: number,
    kLast: number,
  }
  balances: {
    user: string,
    balances: {
      eth: number,
      usdc: number,
      shares: number
    }
  }[];
};




export class DEXState extends State<DEXStateType> {
  constructor(state: DEXStateType) {
    super(state);
  }

  getRootHash() {
    return solidityPackedKeccak256(["string"], [JSON.stringify(this.state)]);
  }
}

const machine = new StateMachine({
  id: "dex",
  stateClass: DEXState,
  initialState: genesisState.state as DEXStateType,
  on: transitions,
});

export { machine };
