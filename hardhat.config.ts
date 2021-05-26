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

task("accounts", "Prints the list of accounts", async (_args, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});

task("getTokenBalance", "Gets the balance of the token ")
  .addParam("token", "address of token", "", types.string)
  .addParam("wallet", "address of wallet/contract", "", types.string)
  .setAction(async (args, hre) => {
    const signers = await hre.ethers.getSigners();
    const WETHContract = await hre.ethers.getContractAt(
      IWETHInterface.abi,
      args.token,
      signers[0]
    );
    const balance = await WETHContract.balanceOf(args.wallet);
    console.log(
      `Token Balance (${args.wallet}): `,
      hre.ethers.utils.formatUnits(balance.toString())
    );
  });

// Gets WETH and transfers it to the deployed flash loan contract
task("getWETH")
  .addParam(
    "amount",
    "the amount of ETH you'd like to exchange for WETH",
    1,
    types.string
  )
  .setAction(async (args, hre) => {
    const amount = hre.ethers.utils.parseEther(args.amount);
    const signers = await hre.ethers.getSigners();
    const WETHContract = await hre.ethers.getContractAt(
      IWETHInterface.abi,
      WETH_KOVAN_ADDRESS,
      signers[0]
    );
    const wethDepositTxn = await WETHContract.deposit({ value: amount });
    await wethDepositTxn.wait();

    const wethTransferTxn = await WETHContract.transfer(
      CONTRACT_ADDRESS,
      amount
    );
    await wethTransferTxn.wait();
  });

// Gets WETH and transfers it to the deployed flash loan contract
task("withdrawAsset")
  .addParam(
    "token",
    "the address of the token you want to withdraw (address(0) for eth)",
    1,
    types.string
  )
  .setAction(async (args, hre) => {
    const amount = hre.ethers.utils.parseEther(args.amount);
    const signers = await hre.ethers.getSigners();
    const WETHContract = await hre.ethers.getContractAt(
      IWETHInterface.abi,
      WETH_KOVAN_ADDRESS,
      signers[0]
    );

    const wethDepositTxn = await WETHContract.deposit({ value: amount });
    await wethDepositTxn.wait();

    const wethTransferTxn = await WETHContract.transfer(
      CONTRACT_ADDRESS,
      amount
    );
    await wethTransferTxn.wait();
    console.log("Success");
  });

task("transferAsset")
  .addParam(
    "address",
    "the address of the asset you want to withdraw",
    1,
    types.string
  )
  .addParam(
    "amount",
    "the amount of the asset you want to withdraw",
    1,
    types.string
  )
  .setAction(async (args, hre) => {
    const amount = hre.ethers.utils.parseEther(args.amount);
    const signers = await hre.ethers.getSigners();
    const tokenContract = await hre.ethers.getContractAt(
      IWETHInterface.abi,
      args.address,
      signers[0]
    );
    const wethTransferTxn = await tokenContract.transfer(
      CONTRACT_ADDRESS,
      amount
    );
    await wethTransferTxn.wait();
    console.log("Success");
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
    const flashLoan = await hre.ethers.getContractAt(
      "FlashLoanV2",
      CONTRACT_ADDRESS,
      signers[0]
    );
    await flashLoan.connect(signers[0]).flashLoan(args.asset);
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
    apiKey: ETHERSCAN_API_KEY,
  },
};

export default config;
