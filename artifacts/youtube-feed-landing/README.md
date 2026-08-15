# YouTube Feed Landing Builder

Landing page statis yang membaca data video hasil sinkronisasi RSS/XML YouTube.
Tidak membutuhkan database atau API key YouTube.

## Setup channel

Edit `config/feed.json`:

- `channel_id`: ID channel YouTube, bukan username.
- `channel_name`: nama yang ditampilkan.
- `site_title` dan `site_description`: teks landing page.
- `max_items`: jumlah video terbaru yang diindeks, maksimum 50.

Untuk feed custom, isi `feed_url` dan script akan menggunakannya sebagai prioritas.

## Jalankan pembaruan lokal

```bash
python scripts/update_feed.py --config config/feed.json
```

File yang dihasilkan:

- `public/data/feed.json` — data terstruktur yang dibaca landing page.
- `public/data/feed.xml` — salinan XML mentah untuk arsip/feed reader.
- `public/data/feed-meta.json` — metadata sinkronisasi.

## GitHub Actions

`/.github/workflows/update-feed.yml` menjalankan pembaruan otomatis setiap 6 jam
dan bisa dijalankan manual dari tab **Actions**. Workflow memakai `GITHUB_TOKEN`
bawaan GitHub, jadi token tidak perlu ditulis di source code.

`/.github/workflows/deploy-pages.yml` membangun website dan menerbitkannya ke
GitHub Pages setiap ada push ke branch `main`. Di repository GitHub, buka
**Settings → Pages → Source: GitHub Actions** sekali sebelum deployment pertama.
Workflow otomatis memakai nama repository sebagai base path, sehingga project
site seperti `username.github.io/nama-repo/` tetap memuat asset dengan benar.
Untuk repository user-site bernama `username.github.io`, ubah `BASE_PATH` pada
workflow menjadi `/`.

## Deploy mudah dari mesin lokal

Pastikan remote GitHub dan kredensial Git sudah tersedia, lalu jalankan:

```bash
python scripts/update_feed.py
python scripts/deploy_github.py
```

Untuk hanya membuat commit tanpa push:

```bash
python scripts/deploy_github.py --no-push
```