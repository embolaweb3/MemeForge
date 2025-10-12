import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Deploy memeRegistry contract
  const memeRegistry = await deploy("MemeRegistry", {
    from: deployer,
    args: [], 
    log: true,
    waitConfirmations: 1,
  });

  // Deploy paymentHandler contract
  const paymentHandler = await deploy("PaymentHandler", {
    from: deployer,
    args: [], 
    log: true,
    waitConfirmations: 1,
  });


  console.log("----------------------------------");
  console.log(`memeRegistry deployed at: ${memeRegistry.address}`);
  console.log(`paymentHandler deployed at: ${paymentHandler.address}`);
};

func.tags = ["memeRegistry", "paymentHandler"];
export default func;