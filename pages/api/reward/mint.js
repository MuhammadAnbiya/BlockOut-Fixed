import prisma from "../../../lib/prisma";
import { authMiddleware } from "../../../middleware/authMiddleware";

const MIN_SEC_PER_REP = 0.8;
const MIN_COOLDOWN_SECONDS = 60;
const UNLOCK_SECONDS_PER_REP = 120;

async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST,OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { workoutType, count, duration, walletAddress } = req.body;
  const userId = req.user.userId;

  if (!count || count <= 0 || !duration || duration <= 0) {
    return res.status(400).json({ error: "Invalid input data" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const now = new Date();
    if (user.lastWorkout) {
      const lastActive = new Date(user.lastWorkout);
      const diffSeconds = (now - lastActive) / 1000;

      if (diffSeconds < MIN_COOLDOWN_SECONDS) {
        return res.status(429).json({
          error: `Please rest. Wait ${Math.ceil(
            MIN_COOLDOWN_SECONDS - diffSeconds
          )}s before next set.`,
        });
      }
    }

    const timePerRep = duration / count;
    if (timePerRep < MIN_SEC_PER_REP) {
      return res
        .status(400)
        .json({ error: "Workout rejected: Too fast, form might be bad." });
    }

    let newStreak = user.dayStreak;
    const lastWorkout = user.lastWorkout ? new Date(user.lastWorkout) : null;
    if (lastWorkout) {
      const diffTime = Math.abs(now - lastWorkout);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) newStreak += 1;
      else if (diffDays > 1) newStreak = 1;
    } else {
      newStreak = 1;
    }

    const streakMultiplier = 1 + Math.min(newStreak, 30) / 100;
    const baseReward = Math.floor(count * 1 * streakMultiplier);

    const earnedSeconds = count * UNLOCK_SECONDS_PER_REP;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          dayStreak: newStreak,
          lastWorkout: now,
          totalWorkouts: { increment: 1 },
          walletAddress: walletAddress || user.walletAddress,
        },
      }),
      ...(walletAddress || user.walletAddress
        ? [
            prisma.transactionQueue.create({
              data: {
                userId: userId,
                walletAddress: walletAddress || user.walletAddress,
                workoutType: workoutType,
                amount: baseReward.toString(),
                status: "PENDING",
              },
            }),
          ]
        : []),
    ]);

    res.status(200).json({
      success: true,
      message: "Workout verified!",
      data: {
        coinsEarned: baseReward,
        streakNow: newStreak,
        timeEarnedSeconds: earnedSeconds,
        formattedTime: new Date(earnedSeconds * 1000)
          .toISOString()
          .substr(11, 8),
      },
    });
  } catch (error) {
    console.error("Mint Error:", error);
    res.status(500).json({ error: "Failed to process workout" });
  }
}

export default authMiddleware(handler);
