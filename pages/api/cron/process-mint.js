import prisma from "../../../lib/prisma";
import { ethers } from "ethers";

const rpcUrl = process.env.RPC_URL;
const minterKey = process.env.MINTER_PRIVATE_KEY;
const contractAddr = process.env.CONTRACT_ADDRESS;

export default async function handler(req, res) {
  // 1. Cek Environment Variables
  if (!rpcUrl || !minterKey || !contractAddr) {
    return res.status(500).json({ error: "Server Config Error: Missing Env Vars" });
  }

  try {
    // 2. Setup Koneksi Blockchain
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(minterKey, provider);
    const contractABI = ["function mint(address to, uint256 amount) public"];
    const tokenContract = new ethers.Contract(contractAddr, contractABI, wallet);

    // 3. Ambil 1 Antrean PENDING
    const job = await prisma.transactionQueue.findFirst({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' }
    });

    if (!job) {
      return res.status(200).json({ message: "No pending jobs." });
    }

    // 4. Lock Job (Set Processing)
    await prisma.transactionQueue.update({
      where: { id: job.id },
      data: { status: 'PROCESSING' }
    });

    console.log(`Processing Job ${job.id} for ${job.walletAddress}`);

    // 5. Kirim Transaksi
    const amountInWei = ethers.parseUnits(job.amount, 18);
    // Tambah Gas Limit Manual untuk Sepolia
    const tx = await tokenContract.mint(job.walletAddress, amountInWei, { gasLimit: 500000 });

    // 6. Sukses - Simpan Hash
    await prisma.transactionQueue.update({
      where: { id: job.id },
      data: { 
        status: 'COMPLETED',
        txHash: tx.hash
      }
    });

    return res.status(200).json({ 
      success: true, 
      jobId: job.id, 
      txHash: tx.hash 
    });

  } catch (error) {
    console.error("Worker Error:", error);
    // Jika ada job yang gagal, tandai failed supaya tidak macet
    // (Logic tambahan opsional, tapi aman untuk MVP)
    return res.status(500).json({ error: error.message });
  }
}