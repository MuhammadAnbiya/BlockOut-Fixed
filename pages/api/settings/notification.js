import prisma from "../../../lib/prisma";
import { authMiddleware } from "../../../middleware/authMiddleware";

async function handler(req, res) {
  const userId = req.user.userId;

  if (req.method === "GET") {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { notificationEnabled: true },
      });
      return res.status(200).json({ enabled: user.notificationEnabled });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Failed to fetch notification settings" });
    }
  }

  if (req.method === "POST") {
    const { enabled } = req.body;

    if (typeof enabled === "undefined") {
      return res.status(400).json({ error: "Field enabled is required" });
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { notificationEnabled: enabled },
      });
      return res
        .status(200)
        .json({ success: true, message: "Notification settings updated" });
    } catch (error) {
      return res.status(500).json({ error: "Failed to update settings" });
    }
  }

  res.setHeader("Allow", "GET,POST,OPTIONS");
  return res.status(405).json({ error: "Method Not Allowed" });
}

export default authMiddleware(handler);
