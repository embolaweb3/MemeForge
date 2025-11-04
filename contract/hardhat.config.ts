import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@nomicfoundation/hardhat-verify'
import 'hardhat-deploy'
import * as dotenv from 'dotenv'
import '@typechain/hardhat'
dotenv.config()

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200
      },
       metadata: {
        bytecodeHash: "none",
      },
    }
  },

  networks: {
    og_testnet: {
      url: "https://evmrpc-testnet.0g.ai",
      chainId: 16602,
      accounts: [process.env.PRIVATE_KEY!],
      saveDeployments :true
    },
    og_mainnet: {
      url: "https://evmrpc.0g.ai",
      chainId: 16661,
      accounts: [process.env.PRIVATE_KEY!],
      saveDeployments :true
    }
  },
  etherscan: {
    apiKey: {
      testnet: process.env.ETHERSCAN_API_KEY!,
      mainnet: process.env.ETHERSCAN_API_KEY! 
    },
    customChains: [
      {
        // Testnet
        network: "testnet",
        chainId: 16602,
        urls: {
          apiURL: "https://chainscan-galileo.0g.ai/open/api",
          browserURL: "https://chainscan-galileo.0g.ai",
        },
      },
      {
        // Mainnet
        network: "mainnet",
        chainId: 16661,
        urls: {
          apiURL: "https://chainscan.0g.ai/open/api",
          browserURL: "https://chainscan.0g.ai",
        },
      },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0,
      1: 0,
    },

  }
};

export default config;
