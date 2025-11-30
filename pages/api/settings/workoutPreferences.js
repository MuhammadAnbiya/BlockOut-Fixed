import prisma from "../../../lib/prisma";
import { authMiddleware } from "../../../middleware/authMiddleware";

async function handler(req, res) {
  const userId = req.user.userId;

  if (req.method === "GET") {
    try {
      const prefs = await prisma.workoutPreference.findMany({
        where: { userId },
      });

      const workoutToggles = {};
      prefs.forEach((pref) => {
        workoutToggles[pref.type] = pref.isEnabled;
      });

      return res.status(200).json({ preferences: workoutToggles });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Failed to fetch workout preferences" });
    }
  }

  if (req.method === "POST") {
    const { workouts } = req.body;

    if (!workouts || !Array.isArray(workouts)) {
      return res.status(400).json({ error: "Workouts array is required" });
    }

    try {
      const updatePromises = workouts.map(async (workout) => {
        const existing = await prisma.workoutPreference.findFirst({
          where: { userId, type: workout.type },
        });

        if (existing) {
          return prisma.workoutPreference.update({
            where: { id: existing.id },
            data: { isEnabled: workout.isEnabled },
          });
        } else {
          return prisma.workoutPreference.create({
            data: {
              userId,
              type: workout.type,
              target: 10,
              isEnabled: workout.isEnabled,
            },
          });
        }
      });

      await Promise.all(updatePromises);
      return res
        .status(200)
        .json({ success: true, message: "Workout preferences saved" });
    } catch (error) {
      return res.status(500).json({ error: "Failed to save preferences" });
    }
  }

  res.setHeader("Allow", "GET,POST,OPTIONS");
  return res.status(405).json({ error: "Method Not Allowed" });
}

export default authMiddleware(handler);
