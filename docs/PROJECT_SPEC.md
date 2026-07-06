
# PROJECT SPECIFICATION

## Nama Project

Finora — Smart Personal Finance Management

---

# Deskripsi

Bangun sebuah aplikasi web Personal Finance Management yang modern, cepat, responsif, mudah digunakan, dan memiliki tampilan premium layaknya aplikasi keuangan profesional seperti Money Lover, Spendee, Wallet, dan YNAB.

Aplikasi harus berjalan dengan baik pada Desktop, Tablet, dan Mobile.

Deploy target:

* Vercel

Database:

* Supabase PostgreSQL

Authentication:

* Supabase Auth

ORM:

* Prisma ORM

Framework:

* Next.js 15 (App Router)

Bahasa:

* TypeScript

UI:

* TailwindCSS
* shadcn/ui
* Lucide React Icons

Charts:

* Recharts

Animation:

* Framer Motion

Validation:

* Zod
* React Hook Form

State Management:

* Zustand

Date Library:

* Day.js

Notification:

* Sonner Toast

Table:

* TanStack Table

Theme:

* next-themes

Form:

* React Hook Form

Deployment:

* Vercel

Storage:

* Supabase Storage

---

# Objective

Membuat aplikasi pencatatan keuangan profesional dengan performa tinggi, UI premium, dan UX yang sederhana.

Target pengguna:

* Mahasiswa
* Karyawan
* Pengguna pribadi
* Keluarga

---


# Folder Structure

src/

app/

components/

features/

hooks/

lib/

services/

store/

types/

utils/

prisma/

middleware/

styles/

public/

---

# Code Standard

Gunakan:

SOLID

Clean Architecture

Repository Pattern

Server Components bila memungkinkan

Client Components hanya jika dibutuhkan

Reusable Components

Strict TypeScript

ESLint

Prettier

Tidak boleh ada duplicated code.

---

# UX Rules

Selalu tampilkan loading skeleton.

Gunakan empty state.

Gunakan optimistic update.

Gunakan toast notification.

Konfirmasi sebelum delete.

Gunakan modal yang konsisten.

Semua form wajib tervalidasi.

Semua tombol memiliki loading state.

Semua halaman memiliki breadcrumb.

---

# Performance

Lazy Loading

Dynamic Import

Image Optimization

Server Actions

Suspense

Caching

Pagination

Debounce Search

Infinite Scroll bila diperlukan.

---

# Security

Row Level Security Supabase

Input Validation

XSS Protection

CSRF Protection

Sanitize Input

Role Based Access

JWT Authentication

Environment Variable

---

# Deliverables

Bangun aplikasi secara bertahap.

Jangan menghasilkan placeholder.

Selalu gunakan production-ready code.

Selalu jelaskan struktur file yang dibuat.

Setiap fitur harus memiliki:

* UI
* API
* Database
* Validation
* Error Handling
* Loading State
* Empty State
* Responsive Design

Pastikan seluruh kode mengikuti best practice Next.js 15, TypeScript, Prisma, dan Supabase.
