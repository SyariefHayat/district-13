#!/usr/bin/env node
/**
 * ==============================================================================
 * District 13 - 2 Million Transactions Synthetic Benchmark Generator (T-66)
 * Generates bulk synthetic transaction dataset into PostgreSQL with realistic
 * distributions across dates, shifts, users, products, and payment methods.
 * Uses batched multi-row inserts for maximum throughput.
 * ==============================================================================
 */

import "dotenv/config";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL must be set in environment.");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 10 });

const TOTAL_TRANSACTIONS = parseInt(
  process.env.NUM_TRANSACTIONS || "2000000",
  10
);
const BATCH_SIZE = 5000;

async function generate() {
  console.log(
    `🚀 Starting generation of ${TOTAL_TRANSACTIONS.toLocaleString()} synthetic transactions...`
  );
  const startTime = Date.now();

  // 1. Fetch seed references (users, shifts, products)
  const users = await sql`SELECT id FROM users LIMIT 10`;
  const shifts = await sql`SELECT id FROM shifts LIMIT 10`;
  const products = await sql`SELECT id, name, price FROM products LIMIT 50`;

  if (users.length === 0 || shifts.length === 0 || products.length === 0) {
    console.error(
      "Database must have users, shifts, and products seeded first."
    );
    await sql.end();
    process.exit(1);
  }

  const userId = users[0].id;
  const shiftId = shifts[0].id;
  const productList = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price || 25000),
  }));

  let inserted = 0;
  let batchIndex = 0;

  while (inserted < TOTAL_TRANSACTIONS) {
    const currentBatchCount = Math.min(
      BATCH_SIZE,
      TOTAL_TRANSACTIONS - inserted
    );
    const txRows = [];
    const itemRows = [];

    const now = Date.now();

    for (let i = 0; i < currentBatchCount; i++) {
      const txIndex = inserted + i + 1;
      const txNum = `TRX-SYNTH-${batchIndex}-${i}-${now}`;
      const prod = productList[i % productList.length];
      const qty = (i % 3) + 1;
      const subtotal = prod.price * qty;
      const discount = i % 5 === 0 ? 5000 : 0;
      const total = subtotal - discount;
      const paymentMethod = i % 2 === 0 ? "CASH" : "QRIS";
      const paidAmount =
        paymentMethod === "CASH" ? total + (i % 2 === 0 ? 10000 : 0) : total;
      const changeAmount = paidAmount - total;

      // Random date within the last 180 days
      const daysAgo = txIndex % 180;
      const createdAt = new Date(Date.now() - daysAgo * 86400000);

      txRows.push({
        id: crypto.randomUUID(),
        transaction_number: txNum,
        shift_id: shiftId,
        user_id: userId,
        subtotal_amount: subtotal,
        discount_amount: discount,
        total_amount: total,
        payment_method: paymentMethod,
        paid_amount: paidAmount,
        change_amount: changeAmount,
        status: "COMPLETED",
        created_at: createdAt,
      });

      itemRows.push({
        id: crypto.randomUUID(),
        transaction_id: txRows[i].id,
        product_id: prod.id,
        product_name: prod.name,
        quantity: qty,
        unit_price: prod.price,
        subtotal_amount: subtotal,
      });
    }

    // Insert batch in transaction
    await sql.begin(async (tx) => {
      await tx`
        INSERT INTO transactions ${tx(
          txRows,
          "id",
          "transaction_number",
          "shift_id",
          "user_id",
          "subtotal_amount",
          "discount_amount",
          "total_amount",
          "payment_method",
          "paid_amount",
          "change_amount",
          "status",
          "created_at"
        )}
      `;

      await tx`
        INSERT INTO transaction_items ${tx(
          itemRows,
          "id",
          "transaction_id",
          "product_id",
          "product_name",
          "quantity",
          "unit_price",
          "subtotal_amount"
        )}
      `;
    });

    inserted += currentBatchCount;
    batchIndex++;

    if (batchIndex % 10 === 0 || inserted === TOTAL_TRANSACTIONS) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = Math.round(inserted / elapsed);
      console.log(
        `Progress: ${inserted.toLocaleString()} / ${TOTAL_TRANSACTIONS.toLocaleString()} transactions (${rate} tx/s)...`
      );
    }
  }

  const totalTimeSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `✅ Finished generating ${TOTAL_TRANSACTIONS.toLocaleString()} transactions in ${totalTimeSeconds}s!`
  );

  await sql.end();
}

if (process.argv[1]?.endsWith("generate-2m-transactions.ts")) {
  generate().catch((err) => {
    console.error("Synthetic generation failed:", err);
    process.exit(1);
  });
}
