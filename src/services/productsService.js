import { supabase } from '../lib/supabase'

export const DJ_CATALOG_PRODUCTS = [
  // 1. PERSONALIZED THALI & DINNER SETS
  {
    id: 'prod-thali-1',
    name: 'Personalized 5 Section Apple Plate Set',
    regular_price: 999,
    price: 780,
    category: 'Thali & Dinner Sets',
    description: "Apple-shaped 5-compartment stainless steel plate customized with custom name and character/design print. Ideal for kids' meals.",
  },
  {
    id: 'prod-thali-2',
    name: 'Personalized 5 Section Tray Set with Napkin',
    regular_price: 999,
    price: 799,
    category: 'Thali & Dinner Sets',
    description: 'Multi-compartment steel tray paired with a personalized cloth napkin. Suitable for complete portioned meals.',
  },
  {
    id: 'prod-thali-3',
    name: 'Personalized 5 Section Plate Set with Napkin',
    regular_price: 999,
    price: 799,
    category: 'Thali & Dinner Sets',
    description: '5-section partitioned plate customized with name and accompanied by a matching customized cloth napkin.',
  },
  {
    id: 'prod-thali-4',
    name: 'Personalized 3 Section Square Plate Set with Napkin',
    regular_price: 950,
    price: 699,
    category: 'Thali & Dinner Sets',
    description: 'Compact 3-section square stainless steel dinner plate with personalized napkin.',
  },
  {
    id: 'prod-thali-5',
    name: 'Personalized 3 Section Oval Plate Set with Napkin',
    regular_price: 999,
    price: 699,
    category: 'Thali & Dinner Sets',
    description: 'Oval partitioned steel plate customized with engraved name and matching napkin.',
  },
  {
    id: 'prod-thali-6',
    name: 'Personalized Round Plate Set with Napkin (2 Bowls)',
    regular_price: 1099,
    price: 799,
    category: 'Thali & Dinner Sets',
    description: 'Traditional round stainless steel thali set complete with 2 engraved bowls and a custom napkin.',
  },
  {
    id: 'prod-thali-7',
    name: 'Personalized Round Plate Set with Photo',
    regular_price: 999,
    price: 750,
    category: 'Thali & Dinner Sets',
    description: 'Custom steel dining plate printed with a personal photograph and text.',
  },
  {
    id: 'prod-thali-8',
    name: 'Personalized 8 Pieces Round Plate Set',
    regular_price: 1599,
    price: 1199,
    category: 'Thali & Dinner Sets',
    description: 'Comprehensive dining set including round plate, bowls, glass, spoon, and dining accessories, all personalized.',
  },
  {
    id: 'prod-thali-9',
    name: 'Personalized Stainless Steel 7 Pieces Dinner Set',
    regular_price: 1199,
    price: 999,
    category: 'Thali & Dinner Sets',
    description: '7-piece complete engraved dinner set designed for children or family gift occasions.',
  },
  {
    id: 'prod-thali-10',
    name: 'Personalized Hexagon 4 Section Plate Set',
    regular_price: 999,
    price: 780,
    category: 'Thali & Dinner Sets',
    description: 'Geometric hexagonal steel platter divided into 4 food sections with personalized engraving.',
  },
  {
    id: 'prod-thali-11',
    name: 'Maggi Bowl and Fork/Spoon',
    regular_price: 599,
    price: 450,
    category: 'Thali & Dinner Sets',
    description: "Stainless steel noodle/soup bowl customized with child's name and accompanied by a matching fork and spoon.",
  },

  // 2. KIDS' LUNCH BOX & SCHOOL SETS
  {
    id: 'prod-lunch-1',
    name: 'Personalized Veigo Full Lunch Box Set',
    regular_price: 1999,
    price: 1490,
    category: 'Kids Lunch Box & School Sets',
    description: 'High-grade stainless steel Veigo leak-proof lunch container with accessories and personalized exterior.',
  },
  {
    id: 'prod-lunch-2',
    name: 'Personalized Veigo Lunch Box Set with Water Bottle',
    regular_price: 1599,
    price: 1350,
    category: 'Kids Lunch Box & School Sets',
    description: 'Matching school combo featuring a personalized Veigo lunch container and reusable steel water bottle.',
  },
  {
    id: 'prod-lunch-3',
    name: 'Personalized Veigo Lunch Box with Cutlery',
    regular_price: 1399,
    price: 990,
    category: 'Kids Lunch Box & School Sets',
    description: 'Compartment lunch container accompanied by dedicated cutlery set (spoon and fork).',
  },
  {
    id: 'prod-lunch-4',
    name: "Steel Lunch Box with Kid's Photo",
    regular_price: 1599,
    price: 1350,
    category: 'Kids Lunch Box & School Sets',
    description: 'Stainless steel lunch box customized with a high-resolution, durable color photo print on the lid.',
  },
  {
    id: 'prod-lunch-5',
    name: "Steel Lunch Box with Kid's Photo (with Spoon & Fork)",
    regular_price: 1299,
    price: 790,
    category: 'Kids Lunch Box & School Sets',
    description: 'Photo-printed stainless steel lunch box including integrated cutlery slot with spoon and fork.',
  },
  {
    id: 'prod-lunch-6',
    name: "Personalized Kids Lunch Box -2 (Large)",
    regular_price: 1299,
    price: 890,
    category: 'Kids Lunch Box & School Sets',
    description: "Larger capacity custom kids' lunch container with personalized name engraving, spoon, and fork.",
  },

  // 3. WALLETS, LAMPS & GIFT COMBOS
  {
    id: 'prod-gift-1',
    name: "Personalized Men's Wallet Series #4",
    regular_price: 880,
    price: 580,
    category: 'Wallets & Gift Combos',
    description: "Faux/genuine leather wallet custom-embossed with recipient's name and a decorative metallic charm.",
  },
  {
    id: 'prod-gift-2',
    name: 'Birthday Combo for Him - 1',
    regular_price: 1299,
    price: 999,
    category: 'Wallets & Gift Combos',
    description: 'Curated gift hamper including a personalized wallet, keychain, pen, and matching accessories.',
  },
  {
    id: 'prod-gift-3',
    name: 'Personalized Combo #1',
    regular_price: 1250,
    price: 850,
    category: 'Wallets & Gift Combos',
    description: 'Personalized everyday essentials combo including customized accessories in gift packaging.',
  },
  {
    id: 'prod-gift-4',
    name: 'Personalized Heart Acrylic Lamp',
    regular_price: 1150,
    price: 750,
    category: 'Wallets & Gift Combos',
    description: 'Warm-white LED night lamp featuring laser-engraved transparent acrylic heart with custom photo/names on a solid wooden base.',
  },

  // 4. RAKHI COLLECTION
  {
    id: 'prod-rakhi-1',
    name: 'Personalized Rome Bracelet Rakhi',
    regular_price: 299,
    price: 180,
    category: 'Rakhi Collection',
    description: 'Modern bracelet-style Rakhi featuring custom engraved metal lettering and adjustable cord.',
  },
  {
    id: 'prod-rakhi-2',
    name: 'Personalized Caricature Rakhi',
    regular_price: 399,
    price: 230,
    category: 'Rakhi Collection',
    description: 'Playful cartoon caricature Rakhi custom-printed from an uploaded photo.',
  },
  {
    id: 'prod-rakhi-3',
    name: 'Personalized Monogram MDF Rakhi',
    regular_price: 299,
    price: 180,
    category: 'Rakhi Collection',
    description: 'Precision laser-cut MDF wooden Rakhi personalized with initial or monogram.',
  },
  {
    id: 'prod-rakhi-4',
    name: 'Personalized Character Rakhi',
    regular_price: 299,
    price: 150,
    category: 'Rakhi Collection',
    description: "Kids' special Rakhi featuring popular superhero or cartoon characters paired with the child's name.",
  },
  {
    id: 'prod-rakhi-5',
    name: 'Personalized Agate Stone Rakhi',
    regular_price: 399,
    price: 230,
    category: 'Rakhi Collection',
    description: 'Natural polished agate slice Rakhi personalized with metallic gold or silver calligraphic names.',
  },
  {
    id: 'prod-rakhi-6',
    name: 'Personalized Bhaiya Bhabhi Rakhi (Set of 2)',
    regular_price: 399,
    price: 299,
    category: 'Rakhi Collection',
    description: 'Matching Rakhi set for brother and sister-in-law (traditional Lumba rakhi set) with personalized tags.',
  },
]

function getMockProducts() {
  const stored = localStorage.getItem('h4b_mock_products_v2')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      // If cached with only 1 or 2 old test items, replace with the complete catalog
      if (Array.isArray(parsed) && parsed.length >= DJ_CATALOG_PRODUCTS.length) {
        return parsed
      }
    } catch (e) {}
  }
  localStorage.setItem('h4b_mock_products_v2', JSON.stringify(DJ_CATALOG_PRODUCTS))
  return DJ_CATALOG_PRODUCTS
}

function saveMockProducts(products) {
  localStorage.setItem('h4b_mock_products_v2', JSON.stringify(products))
}

export const productsService = {
  async getAll(userId) {
    if (userId?.startsWith('admin-') || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      return getMockProducts()
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('name')
    if (error) throw error
    return data
  },

  async create(userId, productData) {
    if (userId?.startsWith('admin-') || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      const prods = getMockProducts()
      const newProd = {
        id: `prod-demo-${Date.now()}`,
        name: productData.name,
        price: Number(productData.price),
        category: productData.category || '',
        created_at: new Date().toISOString(),
      }
      const updatedList = [newProd, ...prods]
      saveMockProducts(updatedList)
      return newProd
    }

    const { data, error } = await supabase
      .from('products')
      .insert({ user_id: userId, ...productData })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    if (id?.startsWith('prod-demo-') || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      const prods = getMockProducts()
      let updatedProd = null
      const updatedList = prods.map(p => {
        if (p.id === id) {
          updatedProd = { ...p, ...updates }
          return updatedProd
        }
        return p
      })
      saveMockProducts(updatedList)
      return updatedProd || updates
    }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    if (id?.startsWith('prod-demo-') || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      const prods = getMockProducts()
      const updatedList = prods.filter(p => p.id !== id)
      saveMockProducts(updatedList)
      return
    }

    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
  },
}
