# 🤖 Permacast Auto-Boost Bot

link projek : https://admin.permacast.app

[![Network](https://img.shields.io/badge/Network-BSC-yellow)](https://bscscan.com)
[![Language](https://img.shields.io/badge/Language-JavaScript-F7DF1E)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

Permacast Auto-Boost Bot adalah skrip otomatisasi untuk platform **Permacast** di BNB Smart Chain. Bot ini mengotomatiskan interaksi on-chain `boostContent` untuk membantu Anda mendapatkan poin secara efisien di banyak wallet.

---

## ✨ Fitur

- **Multi-Wallet Support**: Mendukung banyak akun dari `private_keys.txt`.
- **Auto-Curator Activation**: Otomatis mendeteksi dan mengaktifkan status curator jika belum aktif.
- **Smart Boosting**: Mengambil content ID unik dari history publik.
- **WIB Timestamps**: Log terminal menggunakan zona waktu Asia/Jakarta.
- **Anti-Ban Architecture**: Jeda acak dan penanganan error per-akun.
- **Premium UI**: Tampilan terminal yang bersih dengan kredit Noya-xen.

---

## 🚀 Setup

1. `git clone https://github.com/Noya-xen/Permacast.git`
2. `cd Permacast`
3. `npm install`
4. Copy `private_keys_template.txt` ke `private_keys.txt` dan isi private key Anda.
5. `npm start`

---

## ⚙️ Konfigurasi

Pastikan Anda memiliki saldo BNB yang cukup di setiap wallet untuk biaya gas transaksi on-chain.

---

## 📡 Deploy VPS

Gunakan PM2 untuk menjaga bot tetap berjalan 24/7:
```bash
npm install -g pm2
pm2 start boost.js --name "permacast-bot"
pm2 save && pm2 startup
```

---

## ⚠️ Disclaimer

Script ini untuk keperluan edukasi. Gunakan dengan tanggung jawab sendiri. Pengembang tidak bertanggung jawab atas kerugian atau sanksi dari platform.

> **Built by:** Noya-xen | [@xinomixo](https://x.com/xinomixo)
