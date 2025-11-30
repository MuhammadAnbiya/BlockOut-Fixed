import prisma from "../../../lib/prisma";
import { authMiddleware } from "../../../middleware/authMiddleware";
import { SHOP_CATALOG } from "../../../lib/shopCatalog";

async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET,OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const userId = req.user.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { inventory: true },
    });

    const ownedItemIds = new Set(user.inventory.map((i) => i.itemId));

    const categorizedShop = {
      TOP: [],
      SHIRT: [],
      PANTS: [],
      BOTTOM: [],
    };

    Object.values(SHOP_CATALOG).forEach((item) => {
      const status = ownedItemIds.has(item.id) ? "OWNED" : "AVAILABLE";

      const itemData = {
        id: item.id,
        name: item.name,
        price: item.price,
        type: item.type,
        imageUrl: item.imageUrl,
        status: status,
      };

      if (item.type === "TOP") categorizedShop.TOP.push(itemData);
      else if (item.type === "SHIRT") categorizedShop.SHIRT.push(itemData);
      else if (item.type === "PANTS") categorizedShop.PANTS.push(itemData);
      else if (item.type === "SHOES") categorizedShop.BOTTOM.push(itemData);
    });

    return res.status(200).json({
      userProfile: {
        name: `${user.firstName} ${user.lastName}`,
      },
      stats: {
        coins: user.coinsBalance,
        streak: user.dayStreak,
      },
      shopItems: categorizedShop,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch shop items" });
  }
}

export default authMiddleware(handler);
