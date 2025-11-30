import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import runCors from '../../../lib/cors';
import { generateTokens } from '../../../lib/jwt';

export default async function handler(req, res) {
  if (runCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { 
    firstName, lastName, email, birthDate, phoneNumber, password 
  } = req.body;

  if (!firstName || !lastName || !email || !password || !phoneNumber || !birthDate) {
    return res.status(400).json({ error: 'Semua kolom wajib diisi.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Format email tidak valid.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter.' });
  }

  try {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ error: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' });
    }

    const existingPhone = await prisma.user.findUnique({ where: { phoneNumber } });
    if (existingPhone) {
      return res.status(409).json({ error: 'Nomor HP sudah terdaftar.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        firstName, 
        lastName, 
        email, 
        phoneNumber,
        birthDate: new Date(birthDate),
        passwordHash: hashedPassword,
        // Set Default Avatar & Stats
        avatarGender: "MALE",
        equippedTop: "starter_hair",
        equippedShirt: "starter_shirt",
        equippedPants: "starter_pants",
        equippedShoes: "starter_shoes"
      }
    });

    const { accessToken, refreshToken } = generateTokens(newUser.id);

    await prisma.user.update({
      where: { id: newUser.id },
      data: { refreshToken }
    });

    return res.status(201).json({ 
      message: 'Registrasi berhasil! Selamat datang.', 
      accessToken, 
      refreshToken,
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error("Register Error:", error);

    if (error.code === 'P2002') {
      const target = error.meta?.target;
      if (Array.isArray(target)) {
        if (target.includes('email')) return res.status(409).json({ error: 'Email ini baru saja digunakan orang lain.' });
        if (target.includes('phoneNumber')) return res.status(409).json({ error: 'Nomor HP ini baru saja digunakan orang lain.' });
      }
    }

    return res.status(500).json({ error: 'Terjadi kesalahan sistem. Silakan coba lagi nanti.' });
  }
}