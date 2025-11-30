import prisma from '../../../lib/prisma';
import { OAuth2Client } from 'google-auth-library';
import runCors from '../../../lib/cors';
import { generateTokens } from '../../../lib/jwt';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

/**
 * Memverifikasi ID Token yang dikirim dari Frontend langsung ke Server Google.
 */
async function verifyGoogleToken(idToken) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: CLIENT_ID, 
    });
    return ticket.getPayload();
  } catch (error) {
    console.error("Google Verify Error:", error.message);
    throw new Error("Token Google tidak valid atau kadaluwarsa.");
  }
}

/**
 * Mencari user berdasarkan email. Jika tidak ada, buat baru.
 * Otomatis mengambil foto profil dari Google jika tersedia.
 */
async function findOrCreateUser(payload) {
  const { email, given_name, family_name, picture } = payload;

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log(`Creating new user from Google: ${email}`);
    user = await prisma.user.create({
      data: {
        email,
        firstName: given_name || "User",
        lastName: family_name || "",
        avatarUrl: picture || "", 
        
        avatarGender: "MALE", 
        equippedTop: "starter_hair",
        equippedShirt: "starter_shirt",
        equippedPants: "starter_pants",
        equippedShoes: "starter_shoes"
      }
    });
  } else {
}

  return user;
}

export default async function handler(req, res) {
  if (runCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'ID Token (idToken) wajib dikirim.' });
  }

  try {
    const googlePayload = await verifyGoogleToken(idToken);
    
    const user = await findOrCreateUser(googlePayload);
    
    const { accessToken, refreshToken } = generateTokens(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    return res.status(200).json({
      message: 'Google Login berhasil',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isNewUser: Date.now() - new Date(user.createdAt).getTime() < 60000 
      }
    });

  } catch (error) {
    console.error("API Google Auth Error:", error.message);
    
    return res.status(401).json({ 
      error: error.message || 'Gagal memproses login dengan Google.' 
    });
  }
}