import prisma from "../../../lib/prisma";
import { authMiddleware } from "../../../middleware/authMiddleware";

async function handler(req, res) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", "PUT,OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const userId = req.user.userId;
  const { gender, height, weight } = req.body;

  if (!gender || !height || !weight) {
    return res
      .status(400)
      .json({ error: "Gender, Height, and Weight are required" });
  }

  if (gender !== "MALE" && gender !== "FEMALE") {
    return res.status(400).json({ error: "Invalid gender value" });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        avatarGender: gender,
        heightCm: parseInt(height),
        weightKg: parseInt(weight),
      },
      select: {
        firstName: true,
        heightCm: true,
        weightKg: true,
        avatarGender: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Personalization saved.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Personalize Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default authMiddleware(handler);
