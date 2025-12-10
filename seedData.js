import { connectDB, client } from './db/connectDB.js';

const sampleProducts = [
  {
    name: "Premium Cotton Shirt",
    description: "High-quality cotton shirt with modern fit. Perfect for both casual and formal occasions. Made from 100% pure cotton fabric.",
    category: "Shirt",
    price: 1200,
    availableQuantity: 150,
    minimumOrderQuantity: 10,
    images: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500",
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500"
    ],
    demoVideoLink: "https://www.youtube.com/watch?v=example1",
    paymentOptions: ["Cash on Delivery", "PayFast"],
    showOnHome: true,
    createdBy: {
      name: "Manager One",
      email: "manager@example.com"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Slim Fit Denim Jeans",
    description: "Stylish slim fit jeans with premium denim fabric. Comfortable and durable for everyday wear.",
    category: "Pant",
    price: 1800,
    availableQuantity: 200,
    minimumOrderQuantity: 5,
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500",
      "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=500"
    ],
    demoVideoLink: "",
    paymentOptions: ["Cash on Delivery", "PayFast"],
    showOnHome: true,
    createdBy: {
      name: "Manager One",
      email: "manager@example.com"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Winter Jacket Premium",
    description: "Stay warm and stylish with this premium winter jacket. Water-resistant and wind-proof material.",
    category: "Jacket",
    price: 3500,
    availableQuantity: 80,
    minimumOrderQuantity: 3,
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
      "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=500"
    ],
    demoVideoLink: "https://www.youtube.com/watch?v=example2",
    paymentOptions: ["Cash on Delivery", "PayFast"],
    showOnHome: true,
    createdBy: {
      name: "Manager Two",
      email: "manager2@example.com"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Casual T-Shirt Pack",
    description: "Comfortable cotton t-shirts available in multiple colors. Perfect for daily wear.",
    category: "Shirt",
    price: 600,
    availableQuantity: 300,
    minimumOrderQuantity: 20,
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500"
    ],
    demoVideoLink: "",
    paymentOptions: ["Cash on Delivery"],
    showOnHome: true,
    createdBy: {
      name: "Manager One",
      email: "manager@example.com"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Formal Trousers",
    description: "Classic formal trousers for office and business meetings. Wrinkle-free fabric.",
    category: "Pant",
    price: 1500,
    availableQuantity: 120,
    minimumOrderQuantity: 8,
    images: [
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500",
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500"
    ],
    demoVideoLink: "",
    paymentOptions: ["PayFast"],
    showOnHome: true,
    createdBy: {
      name: "Manager Two",
      email: "manager2@example.com"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Designer Hoodie",
    description: "Premium black hoodie with modern design. Perfect for casual wear and everyday comfort.",
    category: "Hoodie",
    price: 800,
    availableQuantity: 250,
    minimumOrderQuantity: 15,
    images: [
      "https://i.ibb.co.com/yFf9yD74/ai-generated-a-black-hooded-sweatshirt-hangs-on-a-gray-wall-free-photo.jpg"
    ],
    demoVideoLink: "",
    paymentOptions: ["Cash on Delivery", "PayFast"],
    showOnHome: true,
    createdBy: {
      name: "Manager One",
      email: "manager@example.com"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Sports Hoodie",
    description: "Comfortable sports hoodie for gym and outdoor activities. Breathable fabric.",
    category: "Jacket",
    price: 2200,
    availableQuantity: 100,
    minimumOrderQuantity: 5,
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500",
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500"
    ],
    demoVideoLink: "https://www.youtube.com/watch?v=example3",
    paymentOptions: ["Cash on Delivery"],
    showOnHome: false,
    createdBy: {
      name: "Manager Two",
      email: "manager2@example.com"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Cargo Pants",
    description: "Utility cargo pants with multiple pockets. Durable and stylish for casual wear.",
    category: "Pant",
    price: 1600,
    availableQuantity: 90,
    minimumOrderQuantity: 6,
    images: [
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500"
    ],
    demoVideoLink: "",
    paymentOptions: ["Cash on Delivery", "PayFast"],
    showOnHome: false,
    createdBy: {
      name: "Manager One",
      email: "manager@example.com"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedDatabase() {
  try {
    const db = await connectDB();
    const productsCollection = db.collection('products');
    
    // Clear existing products (optional)
    await productsCollection.deleteMany({});
    
    // Insert sample products
    const result = await productsCollection.insertMany(sampleProducts);
    
    console.log(`✅ Successfully inserted ${result.insertedCount} products!`);
    console.log('Products with showOnHome=true:', sampleProducts.filter(p => p.showOnHome).length);
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();