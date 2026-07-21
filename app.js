// ==================================================================
// DAFTARKAN SERVICE WORKER SEBAGAI SYARAT WAJIB PWA & INSTALL POP-UP
// ==================================================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((registration) => {
                console.log('Service Worker berhasil didaftarkan dengan scope: ', registration.scope);
            })
            .catch((err) => {
                console.error('Pendaftaran Service Worker gagal: ', err);
            });
    });
}

// ==================================================================
// FITUR SPLASH SCREEN OTOMATIS HILANG DALAM 2.5 DETIK
// ==================================================================
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.classList.add('fade-out');
            // Menghapus elemen dari memori setelah animasinya selesai
            setTimeout(() => {
                splash.style.display = 'none';
            }, 600);
        }
    }, 2500); // Angka 2500 artinya muncul selama 2.5 detik (bisa diganti misal 3000 untuk 3 detik)
});

// ==================================================================
// 1. ROUTING & STATE MANAGEMENT (ALUR 3 LANGKAH)
// ==================================================================
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbzk5acMfkzVe2WHoCyJzBtc8yOdBK9kccQo4f8e0q3FXZhilG36-iMYARzglB3EujEn/exec";

window.draftBalita = null;
window.draftBumil = null;
window.dataSiapSimpan = null;

function bukaHalaman(idHalaman) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const tujuan = document.getElementById(idHalaman);
    if (tujuan) {
        tujuan.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (idHalaman === 'page-admin') {
            renderTabelAdmin();
        }
    }
}

// ---> A. VALIDASI & LANJUT DARI REGISTRASI BALITA
function lanjutKeUkurBalita() {

    // 1. Ambil data yang diketik bidan di halaman registrasi sebelumnya
    const anakInput = document.getElementById('reg-balita-anak');
    const ibuInput = document.getElementById('reg-balita-ibu');
    
    // Validasi data penting
    if (!anakInput || !anakInput.value) {
        alert("⚠️ Mohon lengkapi Nama Anak!");
        bukaHalaman('page-reg-balita');
        return;
    }
    if (!ibuInput || !ibuInput.value) {
        alert("⚠️ Mohon lengkapi Nama Ibu Kandung!");
        bukaHalaman('page-reg-balita');
        return;
    }

    const namaAnak = anakInput.value;
    const namaIbu = ibuInput.value;

    // 2. Tampilkan otomatis ke Kartu Identitas di halaman Pengukuran Fisik
    // Ganti teks Nama Anak Besar
    document.getElementById('display-nama-anak').innerHTML = namaAnak.replace(" ", "<br>");
    
    // Ganti teks Nama Ibu di dalam pill abu-abu
    const motherNameElement = document.getElementById('display-mother-name');
    if (motherNameElement) motherNameElement.innerText = namaIbu;

    const thn = document.getElementById('reg-balita-thn').value || "0";
    const bln = document.getElementById('reg-balita-bln').value || "0";
    const ke = document.getElementById('reg-balita-ke').value || "1";
    const bpjs = document.getElementById('reg-balita-bpjs').value;
    const rt = document.getElementById('reg-balita-rt').value || "-";
    const kader = document.getElementById('reg-balita-kader').value;

    if (!kader) {
        alert("⚠️ Mohon pilih Kader!");
        return;
    }

    // Simpan ke memori draft
    window.draftBalita = {
        namaAnak: namaAnak, namaIbu: namaIbu,
        umurTeks: `${thn} Thn ${bln} Bln`,
        anakKe: ke, bpjs: bpjs, rt: rt, kader: kader
    };

    // 3. Buka halaman pengukuran fisik
    bukaHalaman('page-ukur-balita');
}

// ---> B. VALIDASI & LANJUT DARI REGISTRASI BUMIL
function lanjutKeUkurBumil() {
    const nama = document.getElementById('reg-bumil-nama').value;
    const umur = document.getElementById('reg-bumil-umur').value;
    const hamilBln = document.getElementById('reg-bumil-hamil-bln').value || "0";
    const hamilMgg = document.getElementById('reg-bumil-hamil-mgg').value || "0";
    const rt = document.getElementById('reg-bumil-rt').value || "-";
    const senam = document.getElementById('reg-bumil-senam').value;
    const kader = document.getElementById('reg-bumil-kader').value;

    if (!nama || !umur || !kader) {
        alert("⚠️ Mohon lengkapi Nama Ibu Hamil, Umur, dan pilih Kader!");
        return;
    }

    window.draftBumil = {
        nama: nama, umurTeks: `${umur} Tahun`,
        hamilTeks: `${hamilBln} Bln ${hamilMgg} Mgg`,
        rt: rt, senam: senam, kader: kader
    };

    document.getElementById('banner-bumil-nama').textContent = `${nama} (${umur} Thn)`;
    document.getElementById('banner-bumil-detail').textContent = `Usia Hamil: ${hamilBln} Bulan ${hamilMgg} Minggu | Senam: ${senam} | ${rt}`;

    bukaHalaman('page-ukur-bumil');
}

// ==================================================================
// 2. ALGORITMA MEDIS & DIAGNOSIS
// ==================================================================
function tampilkanModal(status, ikonPath, judul, kategori, detail, saran, dataObj) {
    // 1. Menyesuaikan dengan class modal versi Figma yang baru
    const modalCard = document.querySelector('.modal-card-figma') || document.querySelector('.modal-card');
    if (modalCard) {
        modalCard.className = "modal-card-figma " + status;
    }
    
    // 2. Mencegah error jika elemen id="modal-icon" terlewat di HTML
    const iconWrapper = document.getElementById('modal-icon');
    if (iconWrapper) {
        if (ikonPath.includes('.')) {
            // Jika yang dikirim berupa nama file gambar (.svg/.png)
            iconWrapper.innerHTML = `<img src="${ikonPath}" alt="Status" style="width: 70px; height: 70px; object-fit: contain;">`;
        } else {
            // Cadangan jika masih berupa emoji biasa
            iconWrapper.textContent = ikonPath;
        }
    }
    
    document.getElementById('modal-title').textContent = judul;
    document.getElementById('modal-nama').textContent = dataObj.nama;
    document.getElementById('modal-kategori').textContent = kategori;
    document.getElementById('modal-detail').textContent = detail;
    document.getElementById('modal-saran').textContent = saran;
    
    window.dataSiapSimpan = dataObj;
    
    // Memunculkan pop-up modal ke layar
    document.getElementById('modal-diagnosis').style.display = "flex";
}
function tutupModal() { document.getElementById('modal-diagnosis').style.display = "none"; }

function simpanHasilBalita() {
    if (!window.draftBalita) return alert("⚠️ Data registrasi kosong, silakan ulangi dari awal.");
    
    const bb = parseFloat(document.getElementById('ukur-balita-bb').value) || 0;
    const tb = parseFloat(document.getElementById('ukur-balita-tb').value) || 0;
    const lila = parseFloat(document.getElementById('ukur-balita-lila').value) || 0;
    const lk = parseFloat(document.getElementById('ukur-balita-lk').value) || 0;
    const imun = document.getElementById('ukur-balita-imun').value;
    const vit = document.getElementById('ukur-balita-vit').value;
    const catatan = document.getElementById('ukur-balita-catatan').value || "-";

    let status = "", ikon = "", judul = "", saran = "";
    if (lila > 0 && lila < 11.5) {
        status = "status-bahaya"; ikon = "🚨"; judul = "RISIKO GIZI BURUK / STUNTING!";
        saran = "PERINGATAN: LiLA di bawah 11.5 cm (Zona Merah)! Wajib segera dirujuk ke Bidan Desa untuk pemeriksaan klinis lanjutan.";
    } else if (lila >= 11.5 && lila < 12.5) {
        status = "status-waspada"; ikon = "🟡"; judul = "GIZI KURANG (ZONA KUNING)";
        saran = "LiLA berada di Zona Kuning KMS. Berikan PMT Pemulihan tinggi protein hewani (telur/ikan) dan pantau ketat 2 minggu lagi.";
    } else {
        status = "status-aman"; ikon = "👶"; judul = "GIZI BAIK & NORMAL";
        saran = "Hebat! Status gizi balita normal di zona HIJAU. Lanjutkan MPASI bergizi seimbang dan lengkapi imunisasi.";
    }

    document.getElementById("modal-avatar-img").src = "assets/ill-balita.svg";

    const detail = `BB: ${bb}kg | TB: ${tb}cm | LiLA: ${lila}cm | LK: ${lk}cm`;
    const paket = {
        kategori: "Balita",
        nama: `${window.draftBalita.namaAnak} (Ibu: ${window.draftBalita.namaIbu})`,
        umur: window.draftBalita.umurTeks,
        rt: window.draftBalita.rt, kader: window.draftBalita.kader,
        hasilUkur: `BB ${bb}kg/TB ${tb}cm (LiLA ${lila}cm/LK ${lk}cm)`,
        status: judul, tindakan: `Suntik: ${imun} | Vit A: ${vit}`,
        catatan: `Anak ke-${window.draftBalita.anakKe} (${window.draftBalita.bpjs}). ${catatan}`
    };
    tampilkanModal(status, ikon, judul, "Skrining KMS Balita", detail, saran, paket);
}

function simpanHasilBumil() {
    if (!window.draftBumil) return alert("⚠️ Data registrasi kosong, silakan ulangi dari awal.");

    const bb = parseFloat(document.getElementById('ukur-bumil-bb').value) || 0;
    const tb = parseFloat(document.getElementById('ukur-bumil-tb').value) || 0;
    const lila = parseFloat(document.getElementById('ukur-bumil-lila').value) || 0;
    const catatan = document.getElementById('ukur-bumil-catatan').value || "-";

    let status = "", ikon = "", judul = "", saran = "";
    if (lila > 0 && lila < 23.5) {
        status = "status-bahaya"; ikon = "🔴"; judul = "RISIKO KEK & POTENSI STUNTING!";
        saran = "BAHAYA: LiLA Ibu di bawah 23.5 cm (Kurang Energi Kronis)! Berisiko tinggi melahirkan bayi Stunting. Segera berikan PMT Bumil dan konsultasi ke Bidan!";
    } else {
        status = "status-aman"; ikon = "🤰"; judul = "STATUS GIZI BUMIL NORMAL";
        saran = "Status gizi Ibu Hamil sangat baik (LiLA >= 23.5 cm). Ingatkan Ibu rutin minum Tablet Tambah Darah (TTD) minimal 90 butir.";
    }

    document.getElementById("modal-avatar-img").src = "assets/ill-bumil.svg";

    const detail = `LiLA: ${lila}cm | BB: ${bb}kg | TB: ${tb}cm`;
    const paket = {
        kategori: "Ibu Hamil",
        nama: window.draftBumil.nama,
        umur: `${window.draftBumil.umurTeks} (Hamil: ${window.draftBumil.hamilTeks})`,
        rt: window.draftBumil.rt, kader: window.draftBumil.kader,
        hasilUkur: `LiLA ${lila}cm (BB ${bb}kg/TB ${tb}cm)`,
        status: judul, tindakan: `Senam: ${window.draftBumil.senam}`,
        catatan: catatan
    };
    tampilkanModal(status, ikon, judul, "Skrining KEK Ibu Hamil", detail, saran, paket);
}

// ==================================================================
// 3. DATABASE OFFLINE & GOOGLE SHEETS LIVE SYNC
// ==================================================================
function konfirmasiSimpanKeDatabase() {
    if (!window.dataSiapSimpan) return;
    const sekarang = new Date();
    const waktuStr = sekarang.toLocaleDateString('id-ID') + ", " + sekarang.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
    
    const dataUtuh = { id: Date.now(), waktu: waktuStr, ...window.dataSiapSimpan, statusSync: "⏳ Mengirim..." };
    
    let db = JSON.parse(localStorage.getItem('database_asih_v3')) || [];
    db.unshift(dataUtuh);
    localStorage.setItem('database_asih_v3', JSON.stringify(db));
    
    if (navigator.onLine && GOOGLE_SHEETS_URL !== "") {
        kirimKeGoogleSheets(dataUtuh);
    } else {
        alert(`💾 Data "${dataUtuh.nama}" tersimpan Offline di HP!`);
    }
    
    tutupModal();
    if (document.getElementById('form-reg-balita')) document.getElementById('form-reg-balita').reset();
    if (document.getElementById('form-ukur-balita')) document.getElementById('form-ukur-balita').reset();
    if (document.getElementById('form-reg-bumil')) document.getElementById('form-reg-bumil').reset();
    if (document.getElementById('form-ukur-bumil')) document.getElementById('form-ukur-bumil').reset();
    
    bukaHalaman('page-home');
    renderTabelAdmin();
}

function kirimKeGoogleSheets(dataObj) {
    fetch(GOOGLE_SHEETS_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(dataObj)
    }).then(() => {
        let db = JSON.parse(localStorage.getItem('database_asih_v3')) || [];
        const idx = db.findIndex(item => item.id === dataObj.id);
        if (idx !== -1) { db[idx].statusSync = "🟢 Masuk Sheets"; localStorage.setItem('database_asih_v3', JSON.stringify(db)); renderTabelAdmin(); }
    }).catch(e => console.error(e));
}

function renderTabelAdmin() {
    const tbody = document.getElementById('tabel-body-posyandu');
    const empty = document.getElementById('pesan-kosong');
    if (!tbody) return;
    
    let db = JSON.parse(localStorage.getItem('database_asih_v3')) || [];
    tbody.innerHTML = "";
    
    if (db.length === 0) { 
        if (empty) empty.style.display = "block"; 
        return; 
    } else { 
        if (empty) empty.style.display = "none"; 
    }
    
    db.forEach((row, idx) => {
        let bgClass = "aman";
        if (row.status.includes("BURUK") || row.status.includes("KEK") || row.status.includes("STUNTING")) bgClass = "bahaya";
        else if (row.status.includes("KURANG") || row.status.includes("WASPADA")) bgClass = "waspada";
        
        tbody.innerHTML += `
            <tr>
                <td style="text-align: center;"><strong>${idx + 1}</strong></td>
                <td style="font-size:10.5px; color:#64748B; white-space:nowrap;">${row.waktu}</td>
                <td><strong style="color:#0F766E;">${row.nama}</strong><br><small style="color:#64748B;">${row.rt}</small></td>
                <td><span style="color:#0D9488; font-weight:800;">${row.kategori}</span><br><small>${row.umur}</small></td>
                <td style="font-weight:600;">${row.hasilUkur}</td>
                <td><span class="badge-status ${bgClass}">${row.status}</span></td>
                <td><small style="line-height:1.2; display:block;">${row.tindakan}</small></td>
                <td><strong>${row.kader}</strong><br><small style="color:#0284C7; font-weight:700;">${row.statusSync || '-'}</small></td>
                <td style="text-align: center;">
                    <button type="button" class="btn-del-mini" onclick="hapusPasien(${row.id})">Hapus</button>
                </td>
            </tr>`;
    });
}

function filterTabelAdmin() {
    const cari = document.getElementById('cariPasien').value.toLowerCase();
    const kat = document.getElementById('filterKategori').value;
    document.querySelectorAll('#tabel-body-posyandu tr').forEach(tr => {
        const teks = tr.innerText.toLowerCase();
        tr.style.display = (teks.includes(cari) && (kat === "Semua" || tr.innerHTML.includes(kat))) ? "" : "none";
    });
}
function hapusPasien(id) {
    if (!confirm("⚠️ Hapus data pasien ini?")) return;
    let db = JSON.parse(localStorage.getItem('database_asih_v3')) || [];
    localStorage.setItem('database_asih_v3', JSON.stringify(db.filter(i => i.id !== id)));
    renderTabelAdmin();
}
function hapusSemuaData() {
    if (confirm("🚨 PERINGATAN: Hapus SELURUH data posyandu dari HP ini? Pastikan sudah unduh CSV!")) {
        localStorage.removeItem('database_asih_v3'); renderTabelAdmin();
    }
}
function sinkronkanSemuaKeSheets() {
    if (!navigator.onLine) return alert("⚠️ Internet offline! Nyalakan WiFi/Data dulu.");
    let db = JSON.parse(localStorage.getItem('database_asih_v3')) || [];
    if (db.length === 0) return alert("📭 Data kosong.");
    alert("⏳ Sedang menyinkronkan seluruh data ke Google Sheets...");
    db.forEach(row => kirimKeGoogleSheets(row));
    setTimeout(() => { alert("✅ Selesai! Seluruh data terkirim."); renderTabelAdmin(); }, 2000);
}
function downloadCSV() {
    let db = JSON.parse(localStorage.getItem('database_asih_v3')) || [];
    if (db.length === 0) return alert("⚠️ Data kosong!");
    let csv = "No,Waktu Periksa,Nama Pasien,Kategori & Umur,RT/Dusun,Hasil Pengukuran,Status Diagnosis,Tindakan Medis,Catatan,Nama Kader\n";
    db.forEach((r, i) => {
        csv += [i+1, `"${r.waktu}"`, `"${r.nama}"`, `"${r.kategori} (${r.umur})"`, `"${r.rt}"`, `"${r.hasilUkur}"`, `"${r.status}"`, `"${r.tindakan}"`, `"${r.catatan}"`, `"${r.kader}"`].join(",") + "\n";
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Laporan_ASIH_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
}

// SINYAL MONITOR
// SINYAL MONITOR (100% SESUAI DESAIN FIGMA GROUP 72)
const badgeSinyal = document.getElementById('statusSinyal');
// SINYAL MONITOR (100% SESUAI DESAIN FIGMA GROUP 72)
function updateSinyal() {
    const badges = document.querySelectorAll('.home-status-bar');
    badges.forEach(badge => {
        if (navigator.onLine) {
            badge.textContent = "● Online";
            badge.className = "home-status-bar online";
        } else {
            badge.textContent = "● Offline";
            badge.className = "home-status-bar offline";
        }
    });
}
window.addEventListener('online', updateSinyal); 
window.addEventListener('offline', updateSinyal); 
updateSinyal();
renderTabelAdmin();

// Deklarasi variabel untuk menyimpan event prompt dari browser
let deferredPrompt;

// Ambil elemen HTML yang baru saja kita buat
const installPopup = document.getElementById('install-popup');
const btnInstall = document.getElementById('btn-install');
const btnCloseInstall = document.getElementById('btn-close-install');

// 1. Dengarkan event beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
    // Cegah Chrome agar tidak memunculkan prompt mini bawaannya secara otomatis
    e.preventDefault();
    
    // Simpan event tersebut ke variabel untuk dipanggil nanti
    deferredPrompt = e;
    
    // Munculkan Pop-up Kustom kita yang besar di layar warga
    installPopup.style.display = 'flex';
});

// 2. Beri aksi pada tombol "Install Aplikasi Ini ke Homescreen"
btnInstall.addEventListener('click', async () => {
    // Sembunyikan pop-up kustom kita
    installPopup.style.display = 'none';
    
    if (deferredPrompt) {
        // Panggil prompt instalasi bawaan browser
        deferredPrompt.prompt();
        
        // Tunggu hingga warga memilih "Install" atau "Cancel" di prompt browser
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('Warga setuju menginstal aplikasi ASIH');
        } else {
            console.log('Warga menolak instalasi');
        }
        
        // Kosongkan variabel karena prompt hanya bisa dipanggil satu kali
        deferredPrompt = null;
    }
});

// 3. Tombol untuk menutup pop-up jika warga memilih "Nanti Saja"
btnCloseInstall.addEventListener('click', () => {
    installPopup.style.display = 'none';
});

// (Opsional) Deteksi jika aplikasi sudah sukses terinstal
window.addEventListener('appinstalled', () => {
    console.log('Aplikasi ASIH berhasil diinstal ke Homescreen!');
    installPopup.style.display = 'none';
});