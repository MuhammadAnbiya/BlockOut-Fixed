export const SHOP_CATALOG = {
  // --- TOP (Glasses, Hats, Hair) ---
  "glasses_pixel": { 
    id: "glasses_pixel", 
    name: "Pixel Glasses", 
    type: "TOP", 
    price: 1000, 
    imageUrl: "https://drive.google.com/uc?export=view&id=1eWVuD-jsz7tBg9Jm2YLR6i2P16jbx1jK" 
  },
  "hair_spiky": { 
    id: "hair_spiky", 
    name: "Spiky Hair", 
    type: "TOP", 
    price: 1000, 
    imageUrl: "https://drive.google.com/uc?export=view&id=1tNO6svWALotBmsOafhHTkYrHjfRTgG-A" 
  },
  "hat_cap": { 
    id: "hat_cap", 
    name: "Cap Hat", 
    type: "TOP", 
    price: 1000, 
    imageUrl: "https://drive.google.com/uc?export=view&id=1rZzV2D-Txww0MzCMelgveXk9TPtNwYjo" 
  },
  "hat_crown": { 
    id: "hat_crown", 
    name: "Gold Crown", 
    type: "TOP", 
    price: 5000, 
    imageUrl: "https://drive.google.com/uc?export=view&id=1TkPJW60bhiLFOJ5F0bxXWyz8ELhFA13H" 
  },
  "hat_helmet": { 
    id: "hat_helmet", 
    name: "Yellow Helmet", 
    type: "TOP", 
    price: 1000, 
    imageUrl: "https://drive.google.com/uc?export=view&id=1ssmXrAiJU6WAJNsJy2fRVhiQiep7Q8rc" 
  },
  "acc_headphones": { 
    id: "acc_headphones", 
    name: "Headphones", 
    type: "TOP", 
    price: 1000, 
    imageUrl: "https://drive.google.com/uc?export=view&id=1S2USMAig-2ljfJZKMV4maKiXv_Bi-kLy" 
  },

  // --- SHIRT (Baju) ---
  "shirt_black": { 
    id: "shirt_black", 
    name: "Black Hoodie", 
    type: "SHIRT", 
    price: 800, 
    imageUrl: "https://drive.google.com/uc?export=view&id=1wwZiehr5_muCLUS-eJ9UVeq0JQPIg7cK" 
  },
  "shirt_blue": { 
    id: "shirt_blue", 
    name: "Blue T-Shirt", 
    type: "SHIRT", 
    price: 500, 
    imageUrl: "" // Belum ada link
  },

  // --- PANTS (Celana) ---
  "pants_blue": { 
    id: "pants_blue", 
    name: "Blue Jeans", 
    type: "PANTS", 
    price: 600, 
    imageUrl: "https://drive.google.com/uc?export=view&id=1hWjheZHJmDAZKDBLKCUNAthmDrQrLd3a" 
  },
  "pants_black": { 
    id: "pants_black", 
    name: "Black Jogger", 
    type: "PANTS", 
    price: 700, 
    imageUrl: "" // Belum ada link
  },

  // --- SHOES (Sepatu/Bottom) ---
  "shoes_black": { 
    id: "shoes_black", 
    name: "Black Boots", 
    type: "SHOES", 
    price: 500, 
    imageUrl: "https://drive.google.com/uc?export=view&id=11aZxK21vTLcya359OCDN7T1Gu_2v9NW6" 
  },
};

export const getItemPrice = (itemId) => SHOP_CATALOG[itemId]?.price || 0;
export const getItemType = (itemId) => SHOP_CATALOG[itemId]?.type || null;