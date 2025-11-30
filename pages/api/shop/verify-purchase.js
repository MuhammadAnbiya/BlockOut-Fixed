import prisma from "../../../lib/prisma";
import { ethers } from "ethers";
import { authMiddleware } from "../../../middleware/authMiddleware";
import { provider } from "../../../lib/web3";
import { SHOP_CATALOG } from "../../../lib/shopCatalog";

const ADMIN_WALLET = process.env.ADMIN_WALLET_ADDRESS
  ? process.env.ADMIN_WALLET_ADDRESS.toLowerCase()
  : "";
const TOKEN_CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS
  ? process.env.CONTRACT_ADDRESS.toLowerCase()
  : "";

async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST,OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { txHash, itemId } = req.body;
  const userId = req.user.userId;

  if (!txHash || !itemId)
    return res.status(400).json({ error: "Missing data" });

  const itemData = SHOP_CATALOG[itemId];
  if (!itemData)
    return res.status(400).json({ error: "Item not found in catalog" });

  try {
    const existingPurchase = await prisma.purchaseHistory.findUnique({
      where: { txHash: txHash },
    });
    if (existingPurchase)
      return res.status(409).json({ error: "Transaction hash already used" });

    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt || receipt.status !== 1) {
      return res.status(400).json({ error: "Transaction failed or pending" });
    }

    const iface = new ethers.Interface([
      "event Transfer(address indexed from, address indexed to, uint256 value)",
    ]);

    const log = receipt.logs.find(
      (l) => l.address.toLowerCase() === TOKEN_CONTRACT_ADDRESS
    );

    if (!log) {
      return res
        .status(400)
        .json({ error: "No BLOC Token transfer found in this transaction" });
    }

    const parsedLog = iface.parseLog(log);
    const from = parsedLog.args[0];
    const to = parsedLog.args[1];
    const value = parsedLog.args[2];

    if (to.toLowerCase() !== ADMIN_WALLET) {
      return res
        .status(400)
        .json({ error: `Invalid recipient. Sent to ${to}, expected Admin` });
    }

    const priceInWei = ethers.parseUnits(itemData.price.toString(), 18);

    if (value < priceInWei) {
      const sentReadable = ethers.formatUnits(value, 18);
      return res.status(400).json({
        error: `Insufficient payment. Sent ${sentReadable} BLOC, needed ${itemData.price} BLOC`,
      });
    }

    await prisma.$transaction([
      prisma.purchaseHistory.create({
        data: {
          userId,
          itemId,
          txHash,
          amount: ethers.formatUnits(value, 18),
        },
      }),

      prisma.inventory.upsert({
        where: { userId_itemId: { userId, itemId } },
        create: {
          userId,
          itemId,
          itemType: itemData.type,
          isOwned: true,
        },
        update: {},
      }),
    ]);

    res
      .status(200)
      .json({
        success: true,
        message: `Payment verified! ${itemData.name} Unlocked.`,
      });
  } catch (error) {
    console.error("Verify Error:", error);
    res
      .status(500)
      .json({ error: "Verification failed. Make sure txHash is correct." });
  }
}

export default authMiddleware(handler);
