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
    }
}

// ---> A. VALIDASI & LANJUT DARI REGISTRASI BALITA
function lanjutKeUkurBalita() {

    // 1. Ambil data yang diketik bidan di halaman registrasi sebelumnya
    const namaAnak = document.getElementById('reg-balita-anak').value || "Nama Lengkap";
    const namaIbu = document.getElementById('reg-balita-ibu').value || "-";

    // 2. Tampilkan otomatis ke Kartu Ringkasan di halaman Pengukuran Fisik
    document.getElementById('display-nama-anak').innerHTML = namaAnak.replace(" ", "<br>");
    document.getElementById('display-nama-ibu').innerText = "Ibu: " + namaIbu;

    // 3. Buka halaman pengukuran fisik
    bukaHalaman('page-ukur-balita');
    
    const anak = document.getElementById('reg-balita-anak').value;
    const ibu = document.getElementById('reg-balita-ibu').value;
    const thn = document.getElementById('reg-balita-thn').value || "0";
    const bln = document.getElementById('reg-balita-bln').value || "0";
    const ke = document.getElementById('reg-balita-ke').value || "1";
    const bpjs = document.getElementById('reg-balita-bpjs').value;
    const rt = document.getElementById('reg-balita-rt').value || "-";
    const kader = document.getElementById('reg-balita-kader').value;

    if (!anak || !ibu || !kader) {
        alert("⚠️ Mohon lengkapi Nama Anak, Nama Ibu, dan pilih Kader!");
        return;
    }

    // Simpan ke memori draft
    window.draftBalita = {
        namaAnak: anak, namaIbu: ibu,
        umurTeks: `${thn} Thn ${bln} Bln`,
        anakKe: ke, bpjs: bpjs, rt: rt, kader: kader
    };

    // Tampilkan di Banner Layar Pengukuran
    document.getElementById('banner-balita-nama').textContent = `${anak} (Ibu: ${ibu})`;
    document.getElementById('banner-balita-detail').textContent = `Umur: ${thn} Thn ${bln} Bln | Anak Ke-${ke} (${bpjs}) | ${rt}`;

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
    const modalCard = document.querySelector('.modal-card');
    modalCard.className = "modal-card " + status;
    
    // MENGGANTI TEKS EMOJI MENJADI TAG GAMBAR
    const iconWrapper = document.getElementById('modal-icon');
    if (ikonPath.includes('.')) {
        // Jika yang dikirim berupa nama file gambar (.svg/.png)
        iconWrapper.innerHTML = `<img src="${ikonPath}" alt="Status" style="width: 70px; height: 70px; object-fit: contain;">`;
    } else {
        // Cadangan jika masih berupa emoji biasa
        iconWrapper.textContent = ikonPath;
    }
    
    document.getElementById('modal-title').textContent = judul;
    document.getElementById('modal-nama').textContent = dataObj.nama;
    document.getElementById('modal-kategori').textContent = kategori;
    document.getElementById('modal-detail').textContent = detail;
    document.getElementById('modal-saran').textContent = saran;
    
    window.dataSiapSimpan = dataObj;
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
    if (db.length === 0) { empty.style.display = "block"; return; } else { empty.style.display = "none"; }
    
    db.forEach((row, idx) => {
        let bgClass = "aman";
        if (row.status.includes("BURUK") || row.status.includes("KEK") || row.status.includes("STUNTING")) bgClass = "bahaya";
        else if (row.status.includes("KURANG") || row.status.includes("WASPADA")) bgClass = "waspada";
        
        tbody.innerHTML += `
            <tr>
                <td><strong>${idx + 1}</strong></td>
                <td style="font-size:11px; color:#64748B;">${row.waktu}</td>
                <td><strong>${row.nama}</strong><br><small style="color:#64748B;">${row.rt}</small></td>
                <td><span style="color:#0D9488; font-weight:bold;">${row.kategori}</span><br><small>${row.umur}</small></td>
                <td>${row.hasilUkur}</td>
                <td><span class="badge-status ${bgClass}">${row.status}</span></td>
                <td><small>${row.tindakan}</small></td>
                <td>${row.kader} <br><small style="color:#0284C7;">${row.statusSync || '-'}</small></td>
                <td><button class="btn-clear-db" style="padding:4px 8px; font-size:11px;" onclick="hapusPasien(${row.id})">Hapus</button>
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
const badgeSinyal = document.getElementById('statusSinyal');
function updateSinyal() {
    badgeSinyal.textContent = navigator.onLine ? "🟢 Online" : "🔴 Offline Mode";
    badgeSinyal.className = navigator.onLine ? "status-badge online" : "status-badge offline";
}
window.addEventListener('online', updateSinyal); window.addEventListener('offline', updateSinyal); updateSinyal();
renderTabelAdmin();