import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import runCors from '../../../lib/cors';
import { generateTokens } from '../../../lib/jwt';

export default async function handler(req, res) {
  if (runCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: 'Email tidak terdaftar.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Password salah.' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    res.status(200).json({ 
      message: 'Login berhasil!', 
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName, 
        email: user.email,
        walletAddress: user.walletAddress,
        dayStreak: user.dayStreak
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: 'Terjadi kesalahan sistem saat login.' });
  }
}