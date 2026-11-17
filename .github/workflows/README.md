# Modul CI & Otomasi Alur Kerja (.github/workflows)

Direktori ini berisi konfigurasi otomasi GitHub Actions untuk menjaga integritas, keamanan, dan kualitas kode pada monorepo District 13.

---

## 🛠️ Alur Kerja CI (`ci.yml`)

Workflow `ci.yml` dieksekusi secara otomatis setiap kali ada:

- **Push** ke branch `master` atau `main`
- **Pull Request** yang menargetkan branch `master` atau `main`

### 4 Quality Gates Wajib:

1. **Code Quality (Oxlint)**:
   - Menjalankan linter berkecepatan tinggi Oxlint di root, frontend, dan backend.
   - **Kriteria Penerimaan (AC)**: 0 galat / lint errors.

2. **TypeScript Strict Typecheck**:
   - Memvalidasi konsistensi tipe TypeScript di frontend (`tsc -b --noEmit`) dan backend (`tsc --noEmit`).
   - Mencegah _runtime type errors_ sebelum masuk ke lingkungan produksi.

3. **Automated Unit Tests (Vitest)**:
   - Menjalankan rangkaian unit test Vitest di backend.
   - Menggunakan konfigurasi mock environment testing (`NODE_ENV=test`, token secrets, dan isolated database mock).

4. **Dependency Security Audit (`npm audit`)**:
   - Menguji seluruh paket dependensi di root, frontend, dan backend.
   - **Threshold**: Otomatis menggagalkan pipeline jika ditemukan kerentanan berstatus `high` atau `critical`.

---

## 🔒 Kebijakan Branch Protection (Status Check Wajib)

Sesuai spesifikasi proyek M0-INF (T-03):

- Status checks dari workflow `CI Pipeline` (`lint`, `typecheck`, `test`, `security`) **wajib dikonfigurasi sebagai required status checks** pada branch `main` dan `master` di repositori GitHub.
- Pull Request dengan kegagalan tipe atau linting tidak dapat di-_merge_ ke branch utama.
