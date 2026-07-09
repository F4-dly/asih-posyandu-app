// ==========================================
// 0. KONFIGURASI LINK LIVE SYNC GOOGLE SHEETS
// ==========================================
// PASTE LINK APPS SCRIPT ANDA DI DALAM TANDA KUTIP DI BAWAH INI:
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbzk5acMfkzVe2WHoCyJzBtc8yOdBK9kccQo4f8e0q3FXZhilG36-iMYARzglB3EujEn/exec";

// ==========================================
// 1. FUNGSI ROUTING BIASA (UNTUK TOMBOL KEMBALI & ADMIN)
// ==========================================
function bukaHalaman(idHalamanTujuan) {
    const semuaHalaman = document.querySelectorAll('.page');
    semuaHalaman.forEach(halaman => halaman.classList.remove('active'));

    const halamanTujuan = document.getElementById(idHalamanTujuan);
    if (halamanTujuan) {
        halamanTujuan.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ==========================================
// 2. LOGIKA UTAMA: SIMPAN BIODATA & MUNCULKAN MENU SKRINING
// ==========================================
function simpanBiodataDanLanjut() {
    // A. Ambil teks yang diketik kader di Layar 1
    const nama = document.getElementById('inputNama').value;
    const umur = document.getElementById('inputUmur').value;
    const rt = document.getElementById('inputRt').value;
    const kader = document.getElementById('selectKader').value;

    // B. Validasi ramah: Pastikan Nama & Kader wajib diisi
    if (!nama || !kader) {
        alert("⚠️ Mohon isi 'Nama Pasien' dan pilih 'Nama Kader' terlebih dahulu ya Bu!");
        return; // Hentikan agar tidak buka menu skrining
    }

    // C. Gabungkan teks biodata untuk ditampilkan di Banner
    const teksBanner = `${nama} (${umur ? umur + ' Thn/Bln' : 'Umur -'}) | ${rt ? rt : 'RT -'} | Petugas: ${kader}`;
    
    // D. Tampilkan biodata ini di SEMUA banner (Layar Menu & Layar Form Skrining)
    document.getElementById('banner-menu').textContent = teksBanner;
    document.getElementById('banner-balita').textContent = teksBanner;
    document.getElementById('banner-bumil').textContent = teksBanner;
    document.getElementById('banner-lansia').textContent = teksBanner;

    // E. BARU PINDAH KE LAYAR 2 (MENU SKRINING)!
    bukaHalaman('page-menu-skrining');
}

// ==========================================
// 3. FITUR PENDETEKSI SINYAL (ONLINE / OFFLINE)
// ==========================================
const badgeSinyal = document.getElementById('statusSinyal');
function updateStatusSinyal() {
    if (navigator.onLine) {
        badgeSinyal.textContent = "🟢 Online";
        badgeSinyal.className = "status-badge online";
    } else {
        badgeSinyal.textContent = "🔴 Offline Mode";
        badgeSinyal.className = "status-badge offline";
    }
}
window.addEventListener('online', updateStatusSinyal);
window.addEventListener('offline', updateStatusSinyal);
updateStatusSinyal();

console.log("🚀 Mesin ASIH Versi 2.1 (Step-by-Step Wizard) Berhasil Dijalankan!");  

// ==========================================
// 4. ALGORITMA MEDIS & POP-UP DIAGNOSIS (FASE 3)
// ==========================================

// Variabel global sementara untuk menampung data sebelum masuk LocalStorage di Fase 4
window.dataSiapSimpan = null;

// ---> A. FUNGSI UNTUK MEMUNCULKAN MODAL POP-UP
function tampilkanModalDiagnosis(tipeStatus, ikon, judul, kategori, detailTeks, saranTeks, dataObjek) {
    const modal = document.getElementById('modal-diagnosis');
    const modalCard = document.querySelector('.modal-card');
    
    // 1. Ambil Nama Pasien dari form biodata awal (Langkah 1)
    const namaPasien = document.getElementById('inputNama').value || "Pasien Tanpa Nama";
    
    // 2. Reset dan atur warna kartu modal sesuai status medis (aman / waspada / bahaya)
    modalCard.className = "modal-card " + tipeStatus;
    
    // 3. Masukkan teks hasil analisis ke dalam elemen HTML modal
    document.getElementById('modal-icon').textContent = ikon;
    document.getElementById('modal-title').textContent = judul;
    document.getElementById('modal-nama').textContent = namaPasien;
    document.getElementById('modal-kategori').textContent = kategori;
    document.getElementById('modal-detail').textContent = detailTeks;
    document.getElementById('modal-saran').textContent = saranTeks;
    
    // 4. Simpan objek data sementara ke memori browser
    window.dataSiapSimpan = dataObjek;
    
    // 5. Munculkan modal ke layar HP!
    modal.style.display = "flex";
}

function tutupModal() {
    document.getElementById('modal-diagnosis').style.display = "none";
}

// ---> B. ALGORITMA 1: SKRINING LANSIA (TENSI DARAH)
function simpanDataLansia() {
    const bb = parseFloat(document.getElementById('lansia-bb').value) || 0;
    const tb = parseFloat(document.getElementById('lansia-tb').value) || 0;
    const sistolik = parseInt(document.getElementById('lansia-sistolik').value) || 0;
    const diastolik = parseInt(document.getElementById('lansia-diastolik').value) || 0;
    const obat = document.getElementById('lansia-obat').value || "Tidak ada";
    const catatan = document.getElementById('lansia-catatan').value || "-";

    // Logika Klasifikasi Tekanan Darah (Standar Kemenkes / JNC VII)
    let tipeStatus = "";
    let ikon = "";
    let judul = "";
    let saran = "";

    if (sistolik >= 140 || diastolik >= 90) {
        tipeStatus = "status-bahaya";
        ikon = "🚨";
        judul = "HIPERTENSI (TEKANAN TINGGI)";
        saran = "PERINGATAN: Tekanan darah pasien tinggi! Segera rujuk ke Meja Bidan Desa sekarang juga untuk pemeriksaan klinis dan pemberian obat antihipertensi.";
    } else if (sistolik >= 120 || diastolik >= 80) {
        tipeStatus = "status-waspada";
        ikon = "⚠️";
        judul = "PRE-HIPERTENSI (WASPADA)";
        saran = "Tekanan darah sedikit di atas batas optimal. Anjurkan pasien mengurangi konsumsi garam, tidur cukup, dan wajib rutin cek tensi bulan depan di Posyandu.";
    } else {
        tipeStatus = "status-aman";
        ikon = "🟢";
        judul = "TEKANAN DARAH NORMAL";
        saran = "Kondisi tekanan darah Mbah sangat baik dan optimal! Anjurkan untuk terus mempertahankan pola makan sehat dan tetap aktif bergerak santai setiap hari.";
    }

    const detailTeks = `Tensi: ${sistolik}/${diastolik} mmHg | BB: ${bb} kg | TB: ${tb} cm`;
    
    // Siapkan paket data untuk disetor ke Database di Fase 4 besok
    const paketData = {
        kategori: "Lansia",
        hasilUkur: `${sistolik}/${diastolik} mmHg`,
        status: judul,
        tindakan: obat,
        catatan: catatan
    };

    tampilkanModalDiagnosis(tipeStatus, ikon, judul, "Skrining Lansia", detailTeks, saran, paketData);
}

// ---> C. ALGORITMA 2: SKRINING IBU HAMIL (LiLA & KEK)
function simpanDataBumil() {
    const usiaHamil = parseInt(document.getElementById('bumil-usia').value) || 0;
    const bb = parseFloat(document.getElementById('bumil-bb').value) || 0;
    const tb = parseFloat(document.getElementById('bumil-tb').value) || 0;
    const lila = parseFloat(document.getElementById('bumil-lila').value) || 0;
    const senam = document.querySelector('input[name="bumil-senam"]:checked').value;
    const catatan = document.getElementById('bumil-catatan').value || "-";

    // Logika Deteksi Risiko KEK (Kurang Energi Kronis) - Batas Kemenkes: LiLA < 23.5 cm
    let tipeStatus = "";
    let ikon = "";
    let judul = "";
    let saran = "";

    if (lila < 23.5) {
        tipeStatus = "status-bahaya";
        ikon = "🔴";
        judul = "RISIKO KEK & POTENSI STUNTING!";
        saran = "BAHAYA: Lingkar Lengan Atas (LiLA) Ibu di bawah 23.5 cm! Ibu mengalami Kurang Energi Kronis (KEK) yang berisiko tinggi melahirkan bayi Stunting. SEGERA berikan PMT Bumil dan rujuk ke Bidan Desa!";
    } else {
        tipeStatus = "status-aman";
        ikon = "🤰";
        judul = "STATUS GIZI IBU HAMIL NORMAL";
        saran = "Status gizi Ibu Hamil sangat baik (LiLA normal >= 23.5 cm). Ingatkan Ibu untuk rutin mengonsumsi Tablet Tambah Darah (TTD) minimal 90 butir selama kehamilan dan aktif mengikuti senam hamil.";
    }

    const detailTeks = `LiLA: ${lila} cm | Usia Hamil: ${usiaHamil} Mgg | BB: ${bb} kg`;
    
    const paketData = {
        kategori: "Ibu Hamil",
        hasilUkur: `LiLA ${lila} cm (${usiaHamil} Mgg)`,
        status: judul,
        tindakan: `Senam: ${senam}`,
        catatan: catatan
    };

    tampilkanModalDiagnosis(tipeStatus, ikon, judul, "Skrining Bumil", detailTeks, saran, paketData);
}

// ---> D. ALGORITMA 3: SKRINING BALITA (DETEKSI AWAL RISIKO STUNTING / LILA)
function simpanDataBalita() {
    const anakKe = document.getElementById('balita-anak-ke').value || "1";
    const bpjs = document.querySelector('input[name="balita-bpjs"]:checked').value;
    const bb = parseFloat(document.getElementById('balita-bb').value) || 0;
    const tb = parseFloat(document.getElementById('balita-tb').value) || 0;
    const lila = parseFloat(document.getElementById('balita-lila').value) || 0;
    const lk = parseFloat(document.getElementById('balita-lk').value) || 0;
    const imunisasi = document.querySelector('input[name="balita-imunisasi"]:checked').value;
    const vitA = document.querySelector('input[name="balita-vit"]:checked').value;
    const catatan = document.getElementById('balita-catatan').value || "-";

    // Logika Deteksi Cepat Gizi Balita (Menggunakan acuan LiLA KMS Balita Kemenkes)
    let tipeStatus = "";
    let ikon = "";
    let judul = "";
    let saran = "";

    if (lila > 0 && lila < 11.5) {
        tipeStatus = "status-bahaya";
        ikon = "🚨";
        judul = "RISIKO GIZI BURUK / STUNTING!";
        saran = "PERINGATAN KRITIS: Lingkar Lengan (LiLA) berada di zona MERAH KMS (< 11.5 cm)! Balita berisiko mengalami gizi buruk atau stunting. Wajib segera dirujuk ke Bidan Desa / Puskesmas hari ini juga untuk pemeriksaan klinis!";
    } else if (lila >= 11.5 && lila < 12.5) {
        tipeStatus = "status-waspada";
        ikon = "🟡";
        judul = "GIZI KURANG (ZONA KUNING)";
        saran = "Lingkar Lengan berada di zona KUNING KMS. Balita mengalami gizi kurang. Berikan PMT Pemulihan berbahan pangan lokal (kaya protein hewani seperti telur/ikan) dan pantau ketat berat badannya 2 minggu lagi.";
    } else {
        tipeStatus = "status-aman";
        ikon = "👶";
        judul = "GIZI BAIK & NORMAL (ZONA HIJAU)";
        saran = "Hebat! Pertumbuhan fisik dan status gizi balita berada di zona HIJAU (Normal). Anjurkan orang tua untuk terus melanjutkan pemberian MPASI bergizi seimbang dan melengkapi imunisasi.";
    }

    const detailTeks = `BB: ${bb} kg | TB/PB: ${tb} cm | LiLA: ${lila || '-'} cm | LK: ${lk || '-'} cm`;
    
    const paketData = {
        kategori: "Balita",
        hasilUkur: `BB ${bb}kg / TB ${tb}cm (LiLA ${lila}cm)`,
        status: judul,
        tindakan: `Imunisasi: ${imunisasi} | Vit A: ${vitA}`,
        catatan: catatan
    };

    tampilkanModalDiagnosis(tipeStatus, ikon, judul, "Skrining Balita & KMS", detailTeks, saran, paketData);
}
// ==========================================
// 5. DATABASE OFFLINE (LOCALSTORAGE) & EKSPOR (FASE 4)
// ==========================================

// ---> A. FUNGSI MENYIMPAN DATA KE LOCALSTORAGE & LIVE SYNC GOOGLE SHEETS
function konfirmasiSimpanKeDatabase() {
    if (!window.dataSiapSimpan) return;
    
    const nama = document.getElementById('inputNama').value || "Tanpa Nama";
    const umur = document.getElementById('inputUmur').value || "-";
    const rt = document.getElementById('inputRt').value || "-";
    const kader = document.getElementById('selectKader').value || "Petugas";
    
    const sekarang = new Date();
    const waktuStr = sekarang.toLocaleDateString('id-ID') + ", " + sekarang.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
    
    // Gabungkan data pasien
    const dataPasienUtuh = {
        id: Date.now(),
        waktu: waktuStr,
        nama: nama,
        umur: umur,
        rt: rt,
        kader: kader,
        kategori: window.dataSiapSimpan.kategori,
        hasilUkur: window.dataSiapSimpan.hasilUkur,
        status: window.dataSiapSimpan.status,
        tindakan: window.dataSiapSimpan.tindakan,
        catatan: window.dataSiapSimpan.catatan,
        statusSync: "⏳ Mengirim..." // Penanda status live di tabel Bidan
    };
    
    // 1. Simpan dulu ke LocalStorage (Sebagai pengaman kalau sinyal mati)
    let database = JSON.parse(localStorage.getItem('database_asih_v2')) || [];
    database.unshift(dataPasienUtuh);
    localStorage.setItem('database_asih_v2', JSON.stringify(database));
    
    // 2. TEMBAKKAN SECARA LIVE KE GOOGLE SHEETS! (Jika internet aktif)
    if (navigator.onLine && GOOGLE_SHEETS_URL !== "") {
        kirimKeGoogleSheets(dataPasienUtuh);
    } else {
        alert(`💾 Data "${nama}" tersimpan di HP!\n\n⚠️ Sinyal internet sedang offline. Data akan disinkronkan ke Google Sheets nanti saat online.`);
    }
    
    tutupModal();
    
    // Bersihkan layar awal
    document.getElementById('inputNama').value = "";
    document.getElementById('inputUmur').value = "";
    document.getElementById('inputRt').value = "";
    
    bukaHalaman('page-home');
    renderTabelAdmin();
}

// ---> FUNGSI RAHASIA: MENEMBAK DATA KE GOOGLE SHEETS TANPA RELOAD
function kirimKeGoogleSheets(dataObjek) {
    fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors', // Kunci penting agar browser HP tidak memblokir pengiriman ke Google
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(dataObjek)
    })
    .then(() => {
        console.log(`🚀 Sukses tembak data "${dataObjek.nama}" ke Google Sheets!`);
        // Ubah status di localStorage menjadi Sukses Sync
        tandaiSuksesSync(dataObjek.id);
    })
    .catch(error => {
        console.error("Gagal kirim ke Google Sheets:", error);
    });
}

// Fungsi penanda bahwa data sudah masuk ke Google Sheets
function tandaiSuksesSync(idPasien) {
    let database = JSON.parse(localStorage.getItem('database_asih_v2')) || [];
    const index = database.findIndex(item => item.id === idPasien);
    if (index !== -1) {
        database[index].statusSync = "🟢 Masuk Sheets";
        localStorage.setItem('database_asih_v2', JSON.stringify(database));
        renderTabelAdmin(); // Update tulisan di tabel admin Bidan
    }
}

// ---> B. FUNGSI MEREKAP DATA KE DALAM TABEL BIDAN
function renderTabelAdmin() {
    const tabelBody = document.getElementById('tabel-body-posyandu');
    const pesanKosong = document.getElementById('pesan-kosong');
    if (!tabelBody) return;
    
    // Ambil data dari localStorage
    let database = JSON.parse(localStorage.getItem('database_asih_v2')) || [];
    
    // Kosongkan isi tabel sebelum diisi ulang
    tabelBody.innerHTML = "";
    
    if (database.length === 0) {
        pesanKosong.style.display = "block";
        return;
    } else {
        pesanKosong.style.display = "none";
    }
    
    // Loop (ulangi) setiap data dan buat baris tabel (<tr>)
    database.forEach((row, index) => {
        // Tentukan warna badge status
        let badgeClass = "aman";
        if (row.status.includes("HIPERTENSI") || row.status.includes("BURUK") || row.status.includes("KEK") || row.status.includes("STUNTING")) {
            badgeClass = "bahaya";
        } else if (row.status.includes("WASPADA") || row.status.includes("KURANG") || row.status.includes("PRE")) {
            badgeClass = "waspada";
        }
        
        const barisHTML = `
            <tr>
                <td><strong>${index + 1}</strong></td>
                <td style="font-size: 11px; color: #64748B;">${row.waktu}</td>
                <td>
                    <strong>${row.nama}</strong> <br>
                    <small style="color: #64748B;">Umur: ${row.umur} | ${row.rt}</small>
                </td>
                <td><span style="font-weight: bold; color: #0D9488;">${row.kategori}</span></td>
                <td>${row.hasilUkur} <br><small style="color: #64748B;">${row.tindakan}</small></td>
                <td><span class="badge-status ${badgeClass}">${row.status}</span></td>
                <td>${row.kader}</td>
                <td>
                    <button class="btn-hapus-row" onclick="hapusDataPasien(${row.id})">Hapus</button>
                </td>
            </tr>
        `;
        tabelBody.innerHTML += barisHTML;
    });
}

// ---> C. FUNGSI FILTER PENCARIAN & KATEGORI DI TABEL
function filterTabelAdmin() {
    const teksCari = document.getElementById('cariPasien').value.toLowerCase();
    const filterKat = document.getElementById('filterKategori').value;
    const barisTabel = document.querySelectorAll('#tabel-body-posyandu tr');
    
    barisTabel.forEach(baris => {
        const teksBaris = baris.innerText.toLowerCase();
        const cocokTeks = teksBaris.includes(teksCari);
        const cocokKat = (filterKat === "Semua") || baris.innerHTML.includes(filterKat);
        
        if (cocokTeks && cocokKat) {
            baris.style.display = "";
        } else {
            baris.style.display = "none";
        }
    });
}

// ---> D. FUNGSI HAPUS 1 DATA PASIEN
function hapusDataPasien(idPasien) {
    if (!confirm("⚠️ Apakah yakin ingin menghapus data pasien ini?")) return;
    
    let database = JSON.parse(localStorage.getItem('database_asih_v2')) || [];
    database = database.filter(item => item.id !== idPasien);
    localStorage.setItem('database_asih_v2', JSON.stringify(database));
    
    renderTabelAdmin(); // Refresh tabel
}

// ---> E. FUNGSI RESET / HAPUS SEMUA DATA
function hapusSemuaData() {
    let database = JSON.parse(localStorage.getItem('database_asih_v2')) || [];
    if (database.length === 0) {
        alert("⚠️ Database sudah kosong!");
        return;
    }
    
    if (confirm("🚨 PERINGATAN KRITIS: Apakah Anda yakin ingin menghapus SELURUH data posyandu di HP ini?\n\nPastikan Anda sudah mendownload Laporan Excel (.CSV) terlebih dahulu!")) {
        localStorage.removeItem('database_asih_v2');
        renderTabelAdmin();
        alert("🗑️ Seluruh data berhasil dibersihkan.");
    }
}

// ---> F. FITUR JUARA: DOWNLOAD LAPORAN EXCEL (.CSV)
function downloadCSV() {
    let database = JSON.parse(localStorage.getItem('database_asih_v2')) || [];
    if (database.length === 0) {
        alert("⚠️ Database masih kosong! Belum ada data yang bisa diunduh.");
        return;
    }
    
    // 1. Buat Header Kolom Excel
    let isiCSV = "No,Waktu Periksa,Nama Pasien,Umur (Thn/Bln),RT / Dusun,Kategori Skrining,Hasil Pengukuran,Status Diagnosis,Tindakan / Vitamin,Catatan Medis,Nama Petugas Kader\n";
    
    // 2. Masukkan setiap baris data (Gunakan tanda kutip "" agar koma di dalam teks tidak merusak kolom Excel)
    database.forEach((row, index) => {
        const baris = [
            index + 1,
            `"${row.waktu}"`,
            `"${row.nama}"`,
            `"${row.umur}"`,
            `"${row.rt}"`,
            `"${row.kategori}"`,
            `"${row.hasilUkur}"`,
            `"${row.status}"`,
            `"${row.tindakan}"`,
            `"${row.catatan}"`,
            `"${row.kader}"`
        ].join(",");
        
        isiCSV += baris + "\n";
    });
    
    // 3. Buat file Blob dan picu download otomatis di browser
    const blob = new Blob([isiCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Posyandu_ASIH_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Jalankan pembaca tabel saat aplikasi pertama kali dimuat
renderTabelAdmin();
console.log("🚀 Mesin Database Offline & Ekspor Excel (Fase 4) Berhasil Dijalankan!");

// ---> G. FITUR SINKRONISASI MASSAL (KALAU SEBELUMNYA OFFLINE)
function sinkronkanSemuaKeSheets() {
    if (!navigator.onLine) {
        alert("⚠️ Internet Anda masih offline! Nyalakan WiFi atau data seluler terlebih dahulu.");
        return;
    }
    
    let database = JSON.parse(localStorage.getItem('database_asih_v2')) || [];
    if (database.length === 0) {
        alert("📭 Tidak ada data untuk disinkronkan.");
        return;
    }

    alert("⏳ Sedang mengirim seluruh data ke Google Sheets... Mohon tunggu sebentar.");

    // Kirim satu per satu data yang ada di memori HP ke Google Sheets
    database.forEach(row => {
        kirimKeGoogleSheets(row);
    });

    setTimeout(() => {
        alert("✅ Selesai! Silakan cek Google Sheets milik desa, seluruh tab (Balita/Bumil/Lansia) sudah terisi otomatis!");
        renderTabelAdmin();
    }, 2000);
}   
// ==================================================================
// 6. PENDAFTARAN SERVICE WORKER PWA (FASE 6)
// ==================================================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js')
            .then(function(registration) {
                console.log('🚀 [PWA Sukses] Service Worker berhasil didaftarkan dengan ruang lingkup:', registration.scope);
            })
            .catch(function(error) {
                console.error('❌ [PWA Gagal] Service Worker gagal didaftarkan:', error);
            });
    });
}