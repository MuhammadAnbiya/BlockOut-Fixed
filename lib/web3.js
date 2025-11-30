import { ethers } from 'ethers';

const rpcUrl = process.env.RPC_URL || "";
const minterKey = process.env.MINTER_PRIVATE_KEY || "";
const contractAddress = process.env.CONTRACT_ADDRESS || "";

const provider = new ethers.JsonRpcProvider(rpcUrl);

let minterWallet;
let tokenContract;

if (minterKey && contractAddress) {
    minterWallet = new ethers.Wallet(minterKey, provider);
    
    const contractABI = [
      "function mint(address to, uint256 amount) public",
      "function balanceOf(address owner) view returns (uint256)"
    ];
    
    tokenContract = new ethers.Contract(contractAddress, contractABI, minterWallet);
}

export { provider, minterWallet, tokenContract };