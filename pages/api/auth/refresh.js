import prisma from "../../../lib/prisma";
import runCors from "../../../lib/cors";
import { generateTokens, verifyRefreshToken } from "../../../lib/jwt";

export default async function handler(req, res) {
  if (runCors(req, res)) return;

  if (req.method !== "POST" && req.method !== "GET") {
    res.setHeader("Allow", "GET,POST,OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const refreshToken =
    req.method === "POST" ? req.body?.refreshToken : req.query?.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token required" });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    const tokens = generateTokens(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return res.status(200).json(tokens);
  } catch (error) {
    console.error("refresh error", error);
    return res.status(403).json({ error: "Invalid or expired refresh token" });
  }
}
