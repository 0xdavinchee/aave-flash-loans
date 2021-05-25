import { HardhatUserConfig, task, types } from "hardhat/config";
import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-typechain";
import "solidity-coverage";
import "hardhat-prettier";

import { FlashLoanV2Factory, FlashLoanV2 } from "./typechain";
import { Iweth10 as IWETH10 } from "./typechain/Iweth10";
import IWETHInterface from "./artifacts/contracts/IWETH10.sol/IWETH10.json";

const INFURA_API_KEY = process.env.INFURA_PROJECT_ID || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
const WETH_KOVAN_ADDRESS = process.env.WETH_KOVAN_ADDRESS || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

let flashLoanV2Contract: FlashLoanV2;
// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (_args, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});

task("getWETHAndTransferToContract")
  .addParam(
    "amount",
    "the amount of ETH you'd like to exchange for WETH",
    1,
    types.int
  )
  .setAction(async (args, hre) => {
    const amount = hre.ethers.utils.parseEther(args.amount);
    const signers = await hre.ethers.getSigners();
    const WETHContract = new hre.ethers.Contract(
      WETH_KOVAN_ADDRESS,
      IWETHInterface.abi,
      signers[0]
    ) as IWETH10;
    const wethDepositTxn = await WETHContract.deposit({ value: amount });
    const wethDepositReceipt = await wethDepositTxn.wait();
    console.log("wethDepositReceipt", wethDepositReceipt);

    const wethTransferTxn = await WETHContract.transfer(CONTRACT_ADDRESS, amount);
    const wethTransferReceipt = await wethTransferTxn.wait();
    console.log("wethTransferReceipt", wethTransferReceipt);
  });

task("flashLoanSimple", "Executes a basic one asset flash loan worth 1 ETH.")
  .addParam(
    "asset",
    "The address of the asset you'd like to borrow.",
    "",
    types.string
  )
  .setAction(async (args, hre) => {
    const signers = await hre.ethers.getSigners();
    const flashLoanV2Factory = await hre.ethers.getContractFactory(
      "FlashLoanV2"
    );
    flashLoanV2Contract = new hre.ethers.Contract(
      CONTRACT_ADDRESS,
      flashLoanV2Factory.interface,
      signers[0]
    ) as FlashLoanV2;
    await flashLoanV2Contract.flashLoan(args.asset);
  });

const config: HardhatUserConfig = {
  networks: {
    hardhat: {},
    kovan: {
      url: "https://kovan.infura.io/v3/" + INFURA_API_KEY,
      accounts: [PRIVATE_KEY],
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.6.12",
      },
      {
        version: "0.8.0",
      },
    ],
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  }
};

export default config;
