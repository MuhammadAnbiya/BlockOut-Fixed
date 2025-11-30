import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";
import { authMiddleware } from "../../../middleware/authMiddleware";

async function handler(req, res) {
  const userId = req.user.userId;
  const method = req.method;

  if (method === "PUT") {
    const { fullName, email, birthDate, phoneNumber } = req.body;
    let dataToUpdate = {};

    if (fullName) {
      const nameParts = fullName.trim().split(" ");
      dataToUpdate.firstName = nameParts[0];
      dataToUpdate.lastName = nameParts.slice(1).join(" ") || "";
    }

    if (email) dataToUpdate.email = email;
    if (phoneNumber) dataToUpdate.phoneNumber = phoneNumber;
    if (birthDate) dataToUpdate.birthDate = new Date(birthDate);

    try {
      await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
      });
      return res
        .status(200)
        .json({ success: true, message: "Profile updated" });
    } catch (error) {
      return res.status(500).json({ error: "Update failed" });
    }
  }

  if (method === "PATCH") {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Missing password fields" });
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Old password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword },
      });

      return res
        .status(200)
        .json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      return res.status(500).json({ error: "Change password failed" });
    }
  }

  if (method === "DELETE") {
    try {
      await prisma.transactionQueue.deleteMany({ where: { userId } });
      await prisma.inventory.deleteMany({ where: { userId } });
      await prisma.blockedApp.deleteMany({ where: { userId } });
      await prisma.workoutPreference.deleteMany({ where: { userId } });
      await prisma.purchaseHistory.deleteMany({ where: { userId } });

      await prisma.user.delete({ where: { id: userId } });

      return res
        .status(200)
        .json({ success: true, message: "Account deleted" });
    } catch (error) {
      return res.status(500).json({ error: "Delete account failed" });
    }
  }

  res.setHeader("Allow", "PUT,PATCH,DELETE,OPTIONS");
  return res.status(405).json({ error: "Method Not Allowed" });
}

export default authMiddleware(handler);
