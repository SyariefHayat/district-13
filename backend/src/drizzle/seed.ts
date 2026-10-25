import 'dotenv/config';
import postgres from 'postgres';

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL in environment');
  }

  const sql = postgres(databaseUrl);
  console.log('🌱 Starting database seed for District 13 catalog...');

  try {
    // 1. Get or create Owner user for transactions
    let [owner] = await sql`SELECT id FROM users WHERE role = 'OWNER' LIMIT 1`;
    if (!owner) {
      [owner] = await sql`SELECT id FROM users LIMIT 1`;
    }
    const userId = owner?.id;
    if (!userId) {
      throw new Error(
        'No user found in database to attach shift & transactions',
      );
    }

    // 2. Insert or update Categories
    const categoriesData = [
      'Coffee',
      'Non-Coffee',
      'Pastry & Bakery',
      'Main Course',
      'Snacks',
      'Apparel',
      'Accessories',
    ];

    const categoryMap = new Map<string, string>();
    for (const name of categoriesData) {
      let [cat] = await sql`
        SELECT id, name FROM categories WHERE lower(btrim(name)) = lower(btrim(${name})) LIMIT 1;
      `;
      if (cat) {
        await sql`UPDATE categories SET is_active = true WHERE id = ${cat.id};`;
      } else {
        [cat] = await sql`
          INSERT INTO categories (name, is_active)
          VALUES (${name}, true)
          RETURNING id, name;
        `;
      }
      categoryMap.set(cat.name, cat.id);
    }
    console.log(`✅ Seeded ${categoryMap.size} categories`);

    // 3. Deactivate legacy test products (e.g. API-TEST or PM ...)
    await sql`
      UPDATE products
      SET is_active = false, is_available = false
      WHERE name LIKE 'API-TEST%' OR name LIKE 'PM %';
    `;

    // 4. Products definition
    const productsData = [
      {
        name: 'Caffe Latte',
        category: 'Coffee',
        price: '28000.00',
        displayStock: 35,
        warehouseStock: 50,
        soldCount: 520,
      },
      {
        name: 'Cappuccino',
        category: 'Coffee',
        price: '28000.00',
        displayStock: 24,
        warehouseStock: 40,
        soldCount: 412,
      },
      {
        name: 'Espresso Single Shot',
        category: 'Coffee',
        price: '18000.00',
        displayStock: 50,
        warehouseStock: 70,
        soldCount: 340,
      },
      {
        name: 'Matcha Fusion Latte',
        category: 'Non-Coffee',
        price: '32000.00',
        displayStock: 18,
        warehouseStock: 20,
        soldCount: 310,
      },
      {
        name: 'Six-Panel Baseball Cap',
        category: 'Accessories',
        price: '125000.00',
        displayStock: 18,
        warehouseStock: 30,
        soldCount: 310,
      },
      {
        name: 'Caramel Macchiato',
        category: 'Coffee',
        price: '34000.00',
        displayStock: 15,
        warehouseStock: 30,
        soldCount: 290,
      },
      {
        name: 'Classic Crew Neck T-Shirt',
        category: 'Apparel',
        price: '150000.00',
        displayStock: 14,
        warehouseStock: 20,
        soldCount: 280,
      },
      {
        name: 'Heavyweight Pullover Hoodie',
        category: 'Apparel',
        price: '450000.00',
        displayStock: 5,
        warehouseStock: 7,
        soldCount: 154,
      },
      {
        name: 'Earl Grey Artisan Tea',
        category: 'Non-Coffee',
        price: '24000.00',
        displayStock: 20,
        warehouseStock: 30,
        soldCount: 145,
      },
      {
        name: 'District Signature Burger',
        category: 'Main Course',
        price: '48000.00',
        displayStock: 15,
        warehouseStock: 15,
        soldCount: 95,
      },
      {
        name: 'Truffle French Fries',
        category: 'Snacks',
        price: '25000.00',
        displayStock: 20,
        warehouseStock: 20,
        soldCount: 80,
      },
      {
        name: 'Butter Croissant',
        category: 'Pastry & Bakery',
        price: '22000.00',
        displayStock: 15,
        warehouseStock: 10,
        soldCount: 60,
      },
      {
        name: 'Chocolate Danish',
        category: 'Pastry & Bakery',
        price: '26000.00',
        displayStock: 10,
        warehouseStock: 8,
        soldCount: 45,
      },
    ];

    // 5. Ensure a shift exists for sales transactions
    let [activeShift] = await sql`
      SELECT id FROM shifts WHERE user_id = ${userId} AND closed_at IS NULL LIMIT 1
    `;
    if (!activeShift) {
      [activeShift] = await sql`
        INSERT INTO shifts (user_id, opening_cash)
        VALUES (${userId}, '100000.00')
        RETURNING id;
      `;
    }
    const shiftId = activeShift.id;

    // 6. Insert products and inventories
    for (const item of productsData) {
      const categoryId = categoryMap.get(item.category);
      if (!categoryId) continue;

      let [product] = await sql`
        SELECT id FROM products WHERE name = ${item.name} LIMIT 1;
      `;

      if (product) {
        await sql`
          UPDATE products
          SET price = ${item.price}, category_id = ${categoryId}, is_active = true, is_available = true
          WHERE id = ${product.id};
        `;
      } else {
        [product] = await sql`
          INSERT INTO products (name, price, category_id, is_active, is_available)
          VALUES (${item.name}, ${item.price}, ${categoryId}, true, true)
          RETURNING id;
        `;
      }

      const productId = product.id;

      // Upsert DISPLAY inventory
      const [dispInv] = await sql`
        SELECT id FROM inventories WHERE product_id = ${productId} AND location = 'DISPLAY' LIMIT 1;
      `;
      if (dispInv) {
        await sql`UPDATE inventories SET stock = ${item.displayStock} WHERE id = ${dispInv.id};`;
      } else {
        await sql`
          INSERT INTO inventories (product_id, location, stock)
          VALUES (${productId}, 'DISPLAY', ${item.displayStock});
        `;
      }

      // Upsert WAREHOUSE inventory
      const [whInv] = await sql`
        SELECT id FROM inventories WHERE product_id = ${productId} AND location = 'WAREHOUSE' LIMIT 1;
      `;
      if (whInv) {
        await sql`UPDATE inventories SET stock = ${item.warehouseStock} WHERE id = ${whInv.id};`;
      } else {
        await sql`
          INSERT INTO inventories (product_id, location, stock)
          VALUES (${productId}, 'WAREHOUSE', ${item.warehouseStock});
        `;
      }

      // Seed sales transactions if needed
      const [existingSales] = await sql`
        SELECT coalesce(sum(ti.quantity), 0)::int as count
        FROM transaction_items ti
        INNER JOIN transactions t ON t.id = ti.transaction_id
        WHERE ti.product_id = ${productId} AND t.status = 'COMPLETED';
      `;

      const currentSold = Number(existingSales?.count ?? 0);
      const neededSold = item.soldCount - currentSold;

      if (neededSold > 0) {
        const txNum = `TRX-SEED-${item.name
          .replace(/[^A-Z0-9]/gi, '')
          .slice(0, 8)
          .toUpperCase()}-${Date.now().toString().slice(-4)}`;
        const total = (Number(item.price) * neededSold).toFixed(2);

        const [tx] = await sql`
          INSERT INTO transactions (
            transaction_number,
            shift_id,
            user_id,
            subtotal_amount,
            discount_amount,
            total_amount,
            payment_method,
            paid_amount,
            change_amount,
            status
          )
          VALUES (
            ${txNum},
            ${shiftId},
            ${userId},
            ${total},
            '0.00',
            ${total},
            'CASH',
            ${total},
            '0.00',
            'COMPLETED'
          )
          RETURNING id;
        `;

        await sql`
          INSERT INTO transaction_items (
            transaction_id,
            product_id,
            product_name,
            quantity,
            unit_price,
            subtotal_amount
          )
          VALUES (
            ${tx.id},
            ${productId},
            ${item.name},
            ${neededSold},
            ${item.price},
            ${total}
          );
        `;
      }
    }

    console.log(
      `✅ Seeded ${productsData.length} products with stock and sales performance data!`,
    );
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    throw err;
  } finally {
    await sql.end();
  }
}

seed().catch(() => process.exit(1));
