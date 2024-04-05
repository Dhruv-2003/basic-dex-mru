import { Wallet } from "ethers";
import dotenv from "dotenv";

dotenv.config();

if (process.env.PRIVATE_KEY !== undefined) {
    const wallet = new Wallet(process.env.PRIVATE_KEY);
    console.log(wallet.address);
}

if (process.env.SECOND_KEY !== undefined) {
    const wallet = new Wallet(process.env.SECOND_KEY);
    console.log(wallet.address);
}