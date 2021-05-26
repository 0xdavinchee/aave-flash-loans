import hre from "hardhat";

async function main() {
  const flashLoanV2Factory = await hre.ethers.getContractFactory("FlashLoanV2");
  const flashLoanV2Contract = await flashLoanV2Factory.deploy(process.env.AAVE_LENDING_POOL_ADDRESS_PROVIDER);

  await flashLoanV2Contract.deployed();

  console.log("FlashLoanV2 deployed to:", flashLoanV2Contract.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
