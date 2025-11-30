import prisma from "../../../lib/prisma";
import { authMiddleware } from "../../../middleware/authMiddleware";

async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST,OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const userId = req.user.userId;
  const { appsToBlock } = req.body;

  if (!Array.isArray(appsToBlock)) {
    return res.status(400).json({ error: "appsToBlock must be an array" });
  }

  try {
    await prisma.blockedApp.deleteMany({
      where: {
        userId,
        appName: {
          notIn: appsToBlock,
        },
      },
    });

    const blockActions = appsToBlock.map((appName) =>
      prisma.blockedApp.upsert({
        where: {
          userId_appName: { userId, appName },
        },
        update: { isActive: true },
        create: {
          userId,
          appName,
          isActive: true,
        },
      })
    );

    await prisma.$transaction(blockActions);

    return res.status(200).json({
      success: true,
      message: "App block configuration updated.",
      blockedCount: appsToBlock.length,
    });
  } catch (error) {
    console.error("Block Config Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default authMiddleware(handler);
