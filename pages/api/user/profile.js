import prisma from "../../../lib/prisma";
import { authMiddleware } from "../../../middleware/authMiddleware";

async function handler(req, res) {
  const userId = req.user.userId;

  if (req.method === "GET") {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const recentWorkouts = await prisma.transactionQueue.findMany({
        where: {
          userId: userId,
          createdAt: {
            gte: sevenDaysAgo,
          },
          status: {
            not: "FAILED",
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const chartData = [];
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dayName = days[d.getDay()];
        const dateString = d.toISOString().split("T")[0];

        const dayWorkouts = recentWorkouts.filter((w) =>
          w.createdAt.toISOString().startsWith(dateString)
        );

        const sitUpCount = dayWorkouts.filter(
          (w) => w.workoutType === "SIT_UP"
        ).length;
        const squatCount = dayWorkouts.filter(
          (w) => w.workoutType === "SQUAT"
        ).length;
        const pushUpFreq = dayWorkouts.filter(
          (w) => w.workoutType === "PUSH_UP"
        ).length;

        chartData.push({
          day: dayName,
          PushUp: pushUpFreq * 10,
          SitUp: sitUpCount * 10,
          Squat: squatCount * 10,
        });
      }

      return res.status(200).json({
        user: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          streak: user.dayStreak,
        },
        statistics: chartData,
      });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch profile" });
    }
  }
  
  if (req.method === 'PUT') {
    const { avatarUrl } = req.body;

    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return res.status(400).json({ error: 'avatarUrl is required and must be a string' });
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl }
      });

      return res.status(200).json({ success: true, message: 'Profile picture updated' });
    } catch (error) {
      console.error('Profile PUT Error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  res.setHeader("Allow", "GET,OPTIONS");
  return res.status(405).json({ error: "Method Not Allowed" });
}

export default authMiddleware(handler);
