import 'dotenv/config';
import postgres from 'postgres';
import argon2 from 'argon2';

export interface RbacPermissionDefinition {
  code: string;
  category: string;
  description: string;
  owner: boolean;
  admin: boolean;
  cashier: boolean;
}

/**
 * Authoritative 57 RBAC Permissions Catalog and Matrix.
 * Source: SRS v0.1 Section 2.2 & SDD Section 5.3 + Lampiran C (Decisions B-02, B-04).
 * Full Documentation: docs/database/rbac-matrix-data.md
 */
export const RBAC_PERMISSIONS_CATALOG: readonly RbacPermissionDefinition[] = [
  // 1. Pengguna
  {
    code: 'user.list',
    category: 'Pengguna',
    description: 'Melihat daftar pengguna',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'user.create',
    category: 'Pengguna',
    description: 'Membuat pengguna',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'user.password.change_self',
    category: 'Pengguna',
    description: 'Mengganti kata sandi sendiri',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'user.admin.update',
    category: 'Pengguna',
    description: 'Mengubah profil admin',
    owner: true,
    admin: false,
    cashier: false,
  },
  {
    code: 'user.cashier.update',
    category: 'Pengguna',
    description: 'Mengubah profil kasir',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'user.cashier.reset_credential',
    category: 'Pengguna',
    description: 'Mengatur ulang kredensial kasir',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'user.delete',
    category: 'Pengguna',
    description: 'Menghapus pengguna',
    owner: true,
    admin: false,
    cashier: false,
  },

  // 2. Produk
  {
    code: 'product.view',
    category: 'Produk',
    description: 'Melihat produk',
    owner: true,
    admin: true,
    cashier: true,
  },
  {
    code: 'product.create',
    category: 'Produk',
    description: 'Menambah produk',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'product.update',
    category: 'Produk',
    description: 'Mengubah detail produk',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'product.price.update',
    category: 'Produk',
    description: 'Mengubah harga produk',
    owner: true,
    admin: false,
    cashier: false,
  },
  {
    code: 'product.deactivate',
    category: 'Produk',
    description: 'Menonaktifkan produk',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'product.availability.update',
    category: 'Produk',
    description: 'Mengubah ketersediaan produk',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'brand.manage',
    category: 'Produk',
    description: 'Mengelola brand',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'category.view',
    category: 'Produk',
    description: 'Melihat kategori',
    owner: true,
    admin: true,
    cashier: true,
  },
  {
    code: 'category.manage',
    category: 'Produk',
    description: 'Mengelola kategori',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'addon.view',
    category: 'Produk',
    description: 'Melihat add-on',
    owner: true,
    admin: true,
    cashier: true,
  },
  {
    code: 'addon.manage',
    category: 'Produk',
    description: 'Mengelola add-on',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'addon.price.update',
    category: 'Produk',
    description: 'Mengubah harga add-on',
    owner: true,
    admin: false,
    cashier: false,
  },

  // 3. Diskon
  {
    code: 'discount.view',
    category: 'Diskon',
    description: 'Melihat diskon',
    owner: true,
    admin: true,
    cashier: true,
  },
  {
    code: 'discount.manage',
    category: 'Diskon',
    description: 'Mengelola diskon',
    owner: true,
    admin: true,
    cashier: false,
  },

  // 4. Inventaris
  {
    code: 'inventory.dashboard.view',
    category: 'Inventaris',
    description: 'Melihat dasbor inventaris',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'inventory.movement.view',
    category: 'Inventaris',
    description: 'Melihat pergerakan stok',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'inventory.transfer',
    category: 'Inventaris',
    description: 'Memindahkan stok ke display',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'inventory.restock',
    category: 'Inventaris',
    description: 'Mencatat stok masuk (restock)',
    owner: true,
    admin: false,
    cashier: false,
  },
  {
    code: 'inventory.adjust',
    category: 'Inventaris',
    description: 'Menyesuaikan stok (penyesuaian inventaris)',
    owner: true,
    admin: true,
    cashier: false,
  },

  // 5. Jadwal
  {
    code: 'schedule.manage',
    category: 'Jadwal',
    description: 'Mengelola jadwal',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'schedule.view_all',
    category: 'Jadwal',
    description: 'Melihat semua jadwal',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'schedule.view_own',
    category: 'Jadwal',
    description: 'Melihat jadwal sendiri',
    owner: false,
    admin: false,
    cashier: true,
  },

  // 6. Shift
  {
    code: 'shift.open',
    category: 'Shift',
    description: 'Membuka shift',
    owner: false,
    admin: false,
    cashier: true,
  },
  {
    code: 'shift.view_own',
    category: 'Shift',
    description: 'Melihat shift sendiri',
    owner: false,
    admin: false,
    cashier: true,
  },
  {
    code: 'shift.view_all',
    category: 'Shift',
    description: 'Melihat semua shift',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'shift.close_own',
    category: 'Shift',
    description: 'Menutup shift sendiri',
    owner: false,
    admin: false,
    cashier: true,
  },
  {
    code: 'shift.close_any',
    category: 'Shift',
    description: 'Menutup shift siapa pun',
    owner: true,
    admin: true,
    cashier: false,
  },

  // 7. Kas masuk/keluar
  {
    code: 'cash.record_own',
    category: 'Kas',
    description: 'Mencatat kas masuk/keluar sendiri',
    owner: false,
    admin: false,
    cashier: true,
  },
  {
    code: 'cash.record_any',
    category: 'Kas',
    description: 'Mencatat kas masuk/keluar untuk siapa pun',
    owner: true,
    admin: false,
    cashier: false,
  },
  {
    code: 'cash.update',
    category: 'Kas',
    description: 'Mengubah catatan kas',
    owner: true,
    admin: false,
    cashier: false,
  },
  {
    code: 'cash.delete',
    category: 'Kas',
    description: 'Menghapus catatan kas',
    owner: true,
    admin: false,
    cashier: false,
  },

  // 8. Penjualan
  {
    code: 'sale.create',
    category: 'Penjualan',
    description: 'Membuat penjualan',
    owner: false,
    admin: false,
    cashier: true,
  },
  {
    code: 'sale.view_all',
    category: 'Penjualan',
    description: 'Melihat semua transaksi',
    owner: true,
    admin: false,
    cashier: false,
  },
  {
    code: 'sale.view_own',
    category: 'Penjualan',
    description: 'Melihat transaksi sendiri',
    owner: false,
    admin: false,
    cashier: true,
  },
  {
    code: 'sale.void',
    category: 'Penjualan',
    description: 'Membatalkan transaksi (void)',
    owner: false,
    admin: false,
    cashier: true,
  },

  // 9. Laporan
  {
    code: 'report.dashboard',
    category: 'Laporan',
    description: 'Ringkasan dasbor',
    owner: true,
    admin: true,
    cashier: true,
  },
  {
    code: 'report.sales',
    category: 'Laporan',
    description: 'Laporan penjualan',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'report.discount',
    category: 'Laporan',
    description: 'Laporan diskon',
    owner: true,
    admin: false,
    cashier: false,
  },
  {
    code: 'report.payment',
    category: 'Laporan',
    description: 'Laporan metode pembayaran',
    owner: true,
    admin: false,
    cashier: false,
  },
  {
    code: 'report.profit',
    category: 'Laporan',
    description: 'Laporan laba',
    owner: true,
    admin: false,
    cashier: false,
  },
  {
    code: 'report.inventory',
    category: 'Laporan',
    description: 'Laporan inventaris',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'report.cash',
    category: 'Laporan',
    description: 'Laporan kas',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'report.shift',
    category: 'Laporan',
    description: 'Laporan shift',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'report.cash_entry',
    category: 'Laporan',
    description: 'Laporan kas masuk/keluar',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'report.cashier_performance',
    category: 'Laporan',
    description: 'Laporan kinerja kasir',
    owner: true,
    admin: true,
    cashier: false,
  },

  // 10. Audit & Pengaturan
  {
    code: 'audit.read_full',
    category: 'Audit & Pengaturan',
    description: 'Membaca log audit lengkap',
    owner: true,
    admin: false,
    cashier: false,
  },
  {
    code: 'audit.read_operational',
    category: 'Audit & Pengaturan',
    description: 'Membaca log audit operasional',
    owner: true,
    admin: true,
    cashier: false,
  },
  {
    code: 'settings.view',
    category: 'Audit & Pengaturan',
    description: 'Melihat pengaturan toko',
    owner: true,
    admin: true,
    cashier: true,
  },
  {
    code: 'settings.update',
    category: 'Audit & Pengaturan',
    description: 'Mengubah pengaturan toko',
    owner: true,
    admin: false,
    cashier: false,
  },
  {
    code: 'queue.reset',
    category: 'Audit & Pengaturan',
    description: 'Mengatur ulang penghitung pesanan',
    owner: true,
    admin: false,
    cashier: false,
  },
] as const;

export async function runDatabaseSeed(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL in environment');
  }

  const sql = postgres(databaseUrl);
  console.log('🌱 Starting District 13 authoritative database seed (T-16)...');

  try {
    // =========================================================================
    // 1. Seed 57 RBAC Permissions (SRS 2.2 + SDD Lampiran C)
    // =========================================================================
    console.log(`🔐 Seeding ${RBAC_PERMISSIONS_CATALOG.length} permissions...`);
    for (const perm of RBAC_PERMISSIONS_CATALOG) {
      await sql`
        INSERT INTO permissions (code, description)
        VALUES (${perm.code}, ${perm.description})
        ON CONFLICT (code) DO UPDATE
        SET description = EXCLUDED.description;
      `;
    }
    console.log(`✅ Seeded ${RBAC_PERMISSIONS_CATALOG.length} permissions.`);

    // =========================================================================
    // 2. Seed Role Permissions Matrix (Owner, Admin, Cashier)
    // =========================================================================
    console.log('👥 Seeding role permissions matrix...');
    for (const perm of RBAC_PERMISSIONS_CATALOG) {
      if (perm.owner) {
        await sql`
          INSERT INTO role_permissions (role, permission_code)
          VALUES ('owner', ${perm.code})
          ON CONFLICT (role, permission_code) DO NOTHING;
        `;
      }
      if (perm.admin) {
        await sql`
          INSERT INTO role_permissions (role, permission_code)
          VALUES ('admin', ${perm.code})
          ON CONFLICT (role, permission_code) DO NOTHING;
        `;
      }
      if (perm.cashier) {
        await sql`
          INSERT INTO role_permissions (role, permission_code)
          VALUES ('cashier', ${perm.code})
          ON CONFLICT (role, permission_code) DO NOTHING;
        `;
      }
    }
    console.log('✅ Role permissions matrix seeded successfully.');

    // =========================================================================
    // 3. Seed Shift Types (S1, S2, S3)
    // =========================================================================
    console.log('⏰ Seeding shift types (S1, S2, S3)...');
    const shiftTypesData = [
      {
        code: 'S1',
        name: 'Shift 1 Pagi',
        startTime: '07:00:00',
        durationMinutes: 540,
      },
      {
        code: 'S2',
        name: 'Shift 2 Sore',
        startTime: '15:00:00',
        durationMinutes: 540,
      },
      {
        code: 'S3',
        name: 'Shift 3 Malam',
        startTime: '23:00:00',
        durationMinutes: 540,
      },
    ];
    for (const st of shiftTypesData) {
      await sql`
        INSERT INTO shift_types (code, name, start_time, duration_minutes)
        VALUES (${st.code}, ${st.name}, ${st.startTime}, ${st.durationMinutes})
        ON CONFLICT (code) DO UPDATE
        SET name = EXCLUDED.name,
            start_time = EXCLUDED.start_time,
            duration_minutes = EXCLUDED.duration_minutes;
      `;
    }
    console.log('✅ Shift types seeded.');

    // =========================================================================
    // 4. Seed Initial Store Settings
    // =========================================================================
    console.log('⚙️ Seeding default store settings...');
    const defaultSettings = [
      { key: 'store_name', value: '"District 13"' },
      { key: 'store_address', value: '""' },
      { key: 'receipt_footer', value: '""' },
      { key: 'tax_mode', value: '"none"' },
      { key: 'tax_rate', value: '0' },
      { key: 'default_min_stock', value: '0' },
    ];
    for (const setting of defaultSettings) {
      await sql`
        INSERT INTO store_settings (key, value)
        VALUES (${setting.key}, ${setting.value}::jsonb)
        ON CONFLICT (key) DO NOTHING;
      `;
    }
    console.log('✅ Store settings seeded.');

    // =========================================================================
    // 5. Seed Default Owner Account & Key Roles
    // =========================================================================
    console.log('👤 Seeding default users (owner, admin, cashier)...');
    const ownerInitialPassword =
      process.env.OWNER_INITIAL_PASSWORD || 'password123';
    const ownerHash = await argon2.hash(ownerInitialPassword);
    const standardHash = await argon2.hash('password123');

    // Default Owner
    await sql`
      INSERT INTO users (username, full_name, password_hash, role, is_active)
      VALUES ('owner', 'Pemilik Toko', ${ownerHash}, 'owner', true)
      ON CONFLICT (username) DO UPDATE
      SET full_name = EXCLUDED.full_name,
          is_active = true;
    `;

    // Default Admin
    await sql`
      INSERT INTO users (username, full_name, password_hash, role, is_active)
      VALUES ('admin', 'Admin Toko', ${standardHash}, 'admin', true)
      ON CONFLICT (username) DO UPDATE
      SET full_name = EXCLUDED.full_name,
          is_active = true;
    `;

    // Default Cashiers 1, 2, and 3
    const cashiers = [
      { username: 'kasir1', fullName: 'Budi Kasir Satu' },
      { username: 'kasir2', fullName: 'Siti Kasir Dua' },
      { username: 'kasir3', fullName: 'Andi Kasir Tiga' },
    ];

    for (const cashier of cashiers) {
      await sql`
        INSERT INTO users (username, full_name, password_hash, role, is_active)
        VALUES (${cashier.username}, ${cashier.fullName}, ${standardHash}, 'cashier', true)
        ON CONFLICT (username) DO UPDATE
        SET full_name = EXCLUDED.full_name,
            is_active = true;
      `;
    }
    console.log(
      '✅ Default users seeded (owner, admin, kasir1, kasir2, kasir3).',
    );

    // =========================================================================
    // 6. Seed Default Devices (T1, T2, T3) for Multi-Tablet POS
    // =========================================================================
    const devices = [
      { code: 'T1', name: 'Tablet Kasir Utama' },
      { code: 'T2', name: 'Tablet Kasir Dua' },
      { code: 'T3', name: 'Tablet Kasir Tiga' },
    ];

    for (const device of devices) {
      await sql`
        INSERT INTO devices (code, name, is_active)
        VALUES (${device.code}, ${device.name}, true)
        ON CONFLICT (code) DO NOTHING;
      `;
    }
    console.log('✅ Default devices seeded (T1, T2, T3).');

    // =========================================================================
    // 7. Seed Baseline Product Catalog & Categories
    // =========================================================================
    console.log('📦 Seeding baseline product categories...');
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
    console.log(`✅ Seeded ${categoryMap.size} categories.`);

    return { success: true };
  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Auto-run when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDatabaseSeed()
    .then(() => {
      console.log('🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal seed failure:', err);
      process.exit(1);
    });
}
