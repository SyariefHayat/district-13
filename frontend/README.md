# Frontend PWA Module — District 13

The client-side Progressive Web Application (PWA) for Cashier Point of Sale, Store Administrators, and Business Owners of District 13. Engineered with **React 19**, **Vite**, **Tailwind CSS v4**, and **shadcn/ui**.

---

## 📱 PWA Features & Architecture

- **Local-First Architecture**: High responsiveness with local storage state management and outbox synchronization for offline resilience.
- **Progressive Web App (PWA) Standard**:
  - Web App Manifest configured at `public/manifest.json`.
  - Display mode: `standalone` for a full-screen, native application feel on mobile and tablet devices.
  - Theme color: `#0f172a` with automated dark/light mode switching.
- **Ergonomic Cashier Touch Targets**: All POS action buttons (product selection, quantity stepper, void, checkout) adhere to a minimum touch target size of **≥ 44px** (`min-h-[44px] min-w-[44px]`) to prevent misclicks on touchscreens.

---

## 🛠️ Formatting Helpers (`src/lib/formatters.ts`)

Standardized presentation helpers across all customer-facing and internal views:

```typescript
import { formatRupiah, formatWibDate } from "@/lib/formatters";

// Format integer currency to Indonesian Rupiah without decimals:
formatRupiah(15000); // "Rp 15.000"
formatRupiah(0); // "Rp 0"

// Format date and time in Western Indonesia Time (WIB / Asia/Jakarta):
formatWibDate(new Date()); // "Nov 18, 2026, 13:00"
```

---

## 👥 View Modes & Role-Based Navigation

1. **Cashier Mode (`/dashboard/cashier`, `/pos`)**: Optimized for fast touchscreen interactions on tablets, managing active shifts, fast cart checkout, and thermal receipt printing.
2. **Admin Mode (`/dashboard/admin`, `/products`, `/stocks`)**: Warehouse inventory tracking, display stock replenishment, catalog & addon configuration, and staff schedules.
3. **Owner Mode (`/dashboard`, `/reports`, `/profit`, `/audits`)**: High-level financial reporting, profit/loss calculations, sales & cashier audit logs, and user account management.

---

## 📲 Testing on Tablets via Local Network (LAN / Wi-Fi)

To test the cashier POS interface directly on an Android or iOS tablet:

1. Launch the Vite dev server with host binding:
   ```bash
   npm run dev -- --host 0.0.0.0
   ```
2. Ensure both the tablet and development computer are connected to the same Wi-Fi.
3. Navigate on the tablet browser to:
   ```
   http://<HOST_IP_ADDRESS>:5173
   ```
4. Verify that touch targets are comfortable and responsive.

---

## 🧪 Development Scripts

```bash
# Start Vite development server
npm run dev

# Run Oxlint linter
npm run lint

# TypeScript strict type checking
npm run typecheck

# Compile production bundle
npm run build
```
