import prisma from "../../../lib/prisma";
import { authMiddleware } from "../../../middleware/authMiddleware";

async function handler(req, res) {
  const userId = req.user.userId;

  if (req.method === "GET") {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { walletAddress: true },
      });

      return res.status(200).json({
        isConnected: !!user.walletAddress,
        walletAddress: user.walletAddress || null,
      });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch wallet status" });
    }
  }

  if (req.method === "POST") {
    const { walletAddress, action } = req.body;

    try {
      if (action === "DISCONNECT") {
        await prisma.user.update({
          where: { id: userId },
          data: { walletAddress: null },
        });
        return res
          .status(200)
          .json({ success: true, message: "Wallet disconnected" });
      }

      if (action === "CONNECT") {
        if (!walletAddress)
          return res.status(400).json({ error: "Wallet address required" });

        const existing = await prisma.user.findFirst({
          where: { walletAddress },
        });

        if (existing && existing.id !== userId) {
          return res
            .status(409)
            .json({ error: "Wallet already linked to another account" });
        }

        await prisma.user.update({
          where: { id: userId },
          data: { walletAddress },
        });
        return res
          .status(200)
          .json({ success: true, message: "Wallet connected" });
      }

      return res.status(400).json({ error: "Invalid action" });
    } catch (error) {
      return res.status(500).json({ error: "Wallet action failed" });
    }
  }

  res.setHeader("Allow", "GET,POST,OPTIONS");
  return res.status(405).json({ error: "Method Not Allowed" });
}

export default authMiddleware(handler);
