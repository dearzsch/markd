# Markd. Notifications, Loan Timers & Copywriting Guide

Panduan lengkap untuk membuat notifikasi *Markd.* muncul sebagai **banner pop-up (heads-up)**, mengatur pengingat jatuh tempo **Loan Book**, memahami batas teknis saat aplikasi ditutup penuh, serta bank *copywriting* pengingat yang cerdas dan jenaka tanpa terkesan *cringe*.

---

## 1. Kenapa Banner Pop-Up Belum Muncul & Cara Mengatasinya

Agar notifikasi PWA di Chrome Android turun dari atas layar sebagai **banner pop-up (*heads-up notification*)**—bukan cuma mengendap diam di panel notifikasi—ada 2 hal wajib: **1 di sisi kode** dan **1 di sisi pengaturan HP pengguna**.

### A. Di Sisi Kode (*Service Worker `showNotification`*)
Jangan gunakan `new Notification(...)` biasa. Wajib panggil melalui **Service Worker Registration** dengan kombinasi `renotify: true`, `tag` yang unik per kategori, dan pola getar (`vibrate`) agar Android mengklasifikasikannya sebagai notifikasi aktif berprioritas tinggi:

```javascript
async function sendMarkdNotification({ title, body, tag, iconUrl, actionLabel, actionId }) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification(title, {
    body: body,
    tag: tag || "markd-reminder",
    renotify: true,                // Wajib true agar Android memunculkan ulang banner pop-up
    requireInteraction: false,     // Biar banner turun sebentar lalu rapi masuk ke panel
    vibrate: [120, 60, 120],       // Memicu sinyal audio/haptic heads-up di Android
    icon: iconUrl || "./icon-192.png",
    badge: "./badge-mono.png",     // Ikon huruf 'M' putih transparan untuk status bar
    actions: actionLabel ? [{ action: actionId, title: actionLabel }] : []
  });
}
```

### B. Instruksi 10 Detik untuk Pengguna (Di Halaman *Settings → Notifications*)
Secara *default*, Chrome Android sering menetapkan izin notifikasi web baru di level **Silent / Medium** (tanpa pop-up). Tambahkan kotak tips kecil di pengaturan notifikasi *Markd.* dengan instruksi singkat ini:

> **Not seeing banner pop-ups?**  
> Tap **Send Test Pop-up** below → pull down your notification shade → **press & hold** the *Markd.* notification → tap **Settings** → set importance to **Urgent / Pop on screen**.

---

## 2. Bisa Jalan Nggak Kalau Aplikasi Ditutup Penuh (*Force Closed*)?

Jujur secara teknis untuk PWA tanpa server *Web Push* berbayar:
* **Saat layar HP mati / aplikasi di-minimize (masih di *Recent Apps*):** **BISA.** Timer jadwal harian tetap jalan di *background* dan memunculkan banner di *lockscreen*.
* **Saat Chrome di-*swipe close* (ditutup paksa) dari *Recent Apps* selama berjam-jam:** Android membekukan proses browser sampai pengguna membuka aplikasi kembali. Namun, begitu aplikasi dibuka sedikit saja, sistem otomatis mengecek pengingat yang terlewat (*missed check*) dan langsung memunculkan notifikasi buku pinjaman yang jatuh tempo hari itu!
* **Solusi Gratis "Anti-Lupa" untuk *Loan Book* (100% Tembus Walau HP Restart):**
  * Di modal **Loan Book**, sediakan tombol kecil **`Add Due Date to Calendar`** yang mengunduh file `.ics` 1-klik atau membuka tautan Google Calendar berisi judul buku, nama peminjam, dan tanggal kembali—dijamin berbunyi tepat waktu meski browser ditutup total!

---

## 3. Cara Kerja & UI Timer untuk *Loan Book* (Buku Pinjaman)

Untuk buku dengan status **Borrowed** (kamu pinjam dari orang/perpustakaan) atau **Lent Out** (bukumu dipinjam teman):

### A. Tambahan Field di Modal *Loan Book*:
1. **Loan Direction:** `Borrowed from...` (Pinjam) atau `Lent to...` (Dipinjamkan).
2. **Person / Library Name:** Nama peminjam / pemilik buku (misal: `Nadia` atau `Perpus Kota`).
3. **Due Date (Tanggal Kembali):** Pemilih tanggal + pil cepat **`+7 days`**, **`+14 days`**, **`+30 days`**.
4. **Reminder Trigger:** Pilihan kapan diingatkan (`3 days before`, `1 day before`, `On due date`).

### B. Logika Otomatis Pengecekan Timer Loan:
Jalankan fungsi `checkLoanTimers()` setiap kali aplikasi dibuka **dan** setiap kali pengecekan jam harian berjalan:

```javascript
function checkLoanTimers(books) {
  const today = new Date().setHours(0, 0, 0, 0);
  const notifiedKey = "markd_loan_notified_" + new Date().toISOString().slice(0, 10);
  const alreadyNotified = JSON.parse(localStorage.getItem(notifiedKey) || "[]");

  books.forEach((book) => {
    if (!book.loan || !book.loan.dueDate || alreadyNotified.includes(book.id)) return;

    const due = new Date(book.loan.dueDate).setHours(0, 0, 0, 0);
    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 2 || diffDays === 0 || diffDays < 0) {
      const copy = getLoanNotificationCopy(book, diffDays);
      sendMarkdNotification({
        title: copy.title,
        body: copy.body,
        tag: "loan-" + book.id,
        iconUrl: book.cover || "./icon-192.png",
        actionLabel: "Mark Returned",
        actionId: "return_" + book.id
      });
      alreadyNotified.push(book.id);
    }
  });

  localStorage.setItem(notifiedKey, JSON.stringify(alreadyNotified));
}
```

---

## 4. Expanded Copywriting Bank (*Dry Wit, Literary & Never Cringe*)

Gaya bahasanya **tenang, deadpan, sedikit sarkastik halus, dan paham kebiasaan asli pembaca**—seperti catatan dari pustakawan pribadi yang mengamati rakmu diam-diam. Sistem bisa merotasi daftar ini secara acak agar notifikasi tidak pernah terasa monoton.

---

### A. Daily Reading & Streak Reminders (Pengingat Baca Harian)

**1. Saat Streak Sedang Berjalan (*Active Streak*):**
* **Varian 1:**
  * *Title:* `Your bookmark is waiting.`
  * *Body:* `Day 12 of your streak. Five pages before sleep is enough to keep it alive.`
* **Varian 2:**
  * *Title:* `Don't break the chain.`
  * *Body:* `12 days in a row. Surely you have ten minutes before scrolling into oblivion.`
* **Varian 3:**
  * *Title:* `A brief intermission from reality.`
  * *Body:* `Your 12-day streak is intact. One quiet chapter before the day ends.`
* **Varian 4:**
  * *Title:* `Routine suits you.`
  * *Body:* `12 consecutive days of reading. Same time tonight?`

**2. Saat Sedang Baca Buku Spesifik (*Currently Reading*):**
* **Varian 1 (Sisa halaman):**
  * *Title:* `112 pages left in The Housemaid.`
  * *Body:* `You stopped right where it was getting good. Time for a chapter?`
* **Varian 2 (Sisa persentase):**
  * *Title:* `You're 64% through The Housemaid.`
  * *Body:* `The plot isn't going to resolve itself while the cover stays closed.`
* **Varian 3 (Sudah 3 hari tidak disentuh):**
  * *Title:* `The Housemaid misses you.`
  * *Body:* `It's been three days since page 184. Pick up the thread tonight.`
* **Varian 4 (Baca lebih dari 1 buku sekaligus):**
  * *Title:* `7 books currently open.`
  * *Body:* `Pick a favorite tonight and give it at least ten pages.`

**3. Saat Streak Kemarin Putus (*Gentle Reset — Zero Guilt*):**
* **Varian 1:**
  * *Title:* `A quiet day yesterday.`
  * *Body:* `Streaks reset, reading taste doesn't. Pick up where you left off.`
* **Varian 2:**
  * *Title:* `Back to page one of the streak.`
  * *Body:* `No judgment. Even great readers take an unscheduled intermission.`
* **Varian 3:**
  * *Title:* `Whenever you're ready.`
  * *Body:* `Your shelf doesn't hold grudges. Five pages tonight starts a new run.`

---

### B. TBR & Shelf Humor (Sindiran Halus Penimbun Buku)

* **Varian 1 (TBR menumpuk):**
  * *Title:* `372 books on your shelf.`
  * *Body:* `One of them would love to actually be opened tonight.`
* **Varian 2 (Anti-doomscrolling):**
  * *Title:* `Put the feed down.`
  * *Body:* `You already know what's on your timeline. You don't know what happens on page 92.`
* **Varian 3 (Untuk yang suka beli/tambah TBR terus):**
  * *Title:* `Your Want-to-Read list is thriving.`
  * *Body:* `Now might be a lovely time to actually read one of them.`
* **Varian 4 (Akhir pekan / Weekend):**
  * *Title:* `No plans is a valid plan.`
  * *Body:* `A hot drink and forty uninterrupted pages sound like a solid evening.`

---

### C. Loan Book — *Borrowed* (Kamu Pinjam Buku Orang / Perpustakaan)

**1. H-3 / H-2 Sebelum Jatuh Tempo:**
* **Varian 1:**
  * *Title:* `48 hours left on your loan.`
  * *Body:* `Bridgertons belongs back with Nadia on Thursday. How fast can you read?`
* **Varian 2:**
  * *Title:* `Borrowed time, literally.`
  * *Body:* `Two days left to finish The Secret History before City Library wants it back.`
* **Varian 3:**
  * *Title:* `Tick-tock on that loan.`
  * *Body:* `Your copy of Dune from Nadia is due in 48 hours. Time to lock in.`

**2. Hari H Jatuh Tempo (*Due Today*):**
* **Varian 1:**
  * *Title:* `Due back today.`
  * *Body:* `Time to return The Secret History to City Library — or beg for an extension.`
* **Varian 2:**
  * *Title:* `Return day has arrived.`
  * *Body:* `Nadia is expecting Bridgertons back today. Don't be that friend.`
* **Varian 3:**
  * *Title:* `Check your tote bag.`
  * *Body:* `Today's the deadline to return Project Hail Mary to Perpus Kota.`

**3. Terlambat (*Overdue*):**
* **Varian 1:**
  * *Title:* `Officially overdue.`
  * *Body:* `You've had Project Hail Mary 3 days past due. Return it before you lose borrowing privileges.`
* **Varian 2:**
  * *Title:* `We need to talk about that loan.`
  * *Body:* `Bridgertons was due 3 days ago. Nadia remembers, even if you pretend not to.`
* **Varian 3:**
  * *Title:* `Living dangerously with library fines.`
  * *Body:* `The Secret History is 3 days overdue. Wrap it up and hand it back.`

---

### D. Loan Book — *Lent Out* (Bukumu Dipinjam Teman)

**1. H-2 Sebelum Jatuh Tempo:**
* **Varian 1:**
  * *Title:* `Friendly custody check.`
  * *Body:* `Raka has had your copy of Normal People for 12 days. Due back this Friday.`
* **Varian 2:**
  * *Title:* `Shared custody update.`
  * *Body:* `Your copy of Dune is scheduled to return from Sarah in two days.`

**2. Hari H / Lewat Jatuh Tempo:**
* **Varian 1:**
  * *Title:* `Time to reclaim your shelf.`
  * *Body:* `Your copy of Dune is due back from Sarah today. Send a gentle nudge.`
* **Varian 2:**
  * *Title:* `Missing from your bookshelf.`
  * *Body:* `Raka was supposed to return Normal People 3 days ago. Might be time to text.`
* **Varian 3:**
  * *Title:* `Book retrieval mission.`
  * *Body:* `Sarah still has your copy of Fourth Wing past the due date. Proceed politely.`

---

### E. Near-Finish, Stalled Books & Milestones (Momen Spesial)

**1. Saat Buku Hampir Tamat ($\ge 85\%$):**
* **Varian 1:**
  * *Title:* `The final stretch.`
  * *Body:* `You're 88% through Fourth Wing. Clear your evening for the ending.`
* **Varian 2:**
  * *Title:* `You can practically see the acknowledgments.`
  * *Body:* `Only 38 pages left in Fourth Wing. Finish what you started tonight.`
* **Varian 3:**
  * *Title:* `So close to another finished book.`
  * *Body:* `91% done with Fourth Wing. Don't leave the ending hanging until tomorrow.`

**2. Buku Macet (*On Hold / Stalled > 14 Hari*):**
* **Varian 1:**
  * *Title:* `Still thinking about this one?`
  * *Body:* `You paused The Goldfinch two weeks ago. Resume it, or life's too short — DNF it.`
* **Varian 2:**
  * *Title:* `Permission to move on.`
  * *Body:* `If you haven't touched The Goldfinch in 14 days, it might be a sign to mark it DNF.`

**3. Akhir Bulan / Recap & Tarot Terbuka:**
* **Varian 1:**
  * *Title:* `November, archived.`
  * *Body:* `Your monthly reading cards and story slides are ready to inspect.`
* **Varian 2:**
  * *Title:* `The month in ink.`
  * *Body:* `See how many pages you actually survived in November. Your recap is unlocked.`
* **Varian 3 (Yearly Tarot Unlock — Dec 1):**
  * *Title:* `The cards have been shuffled.`
  * *Body:* `Your 2026 Yearly Tarot Wrapped is officially unlocked. Come read your fortune.`