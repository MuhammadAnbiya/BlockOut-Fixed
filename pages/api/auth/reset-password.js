import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST,OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { phoneNumber, resetToken, newPassword } = req.body;

  if (!phoneNumber || !resetToken || !newPassword) {
    return res.status(400).json({ 
      error: "Nomor HP, Token, dan Password baru wajib diisi." 
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ 
      error: "Password baru minimal 6 karakter." 
    });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { phoneNumber },
    });

    if (!user) {
      return res.status(404).json({ 
        error: "Nomor HP tidak terdaftar dalam sistem." 
      });
    }

    if (!user.resetToken || !user.resetTokenExpiry) {
      return res.status(400).json({ 
        error: "Permintaan reset password tidak ditemukan. Silakan lakukan 'Lupa Password' ulang." 
      });
    }

    if (user.resetToken !== resetToken) {
      return res.status(400).json({ 
        error: "Token tidak valid. Pastikan Anda memasukkan token dengan benar." 
      });
    }

    if (new Date() > new Date(user.resetTokenExpiry)) {
      return res.status(400).json({ 
        error: "Token sudah kadaluwarsa. Silakan minta kode baru." 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,      
        resetTokenExpiry: null, 
      },
    });

    res.status(200).json({ 
      success: true, 
      message: "Password berhasil diubah. Silakan login dengan password baru." 
    });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "Terjadi kesalahan sistem server." });
  }
}