if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(err => console.log(err)); });
}

// ==========================================
// DATA 57 AKUN
// ==========================================
const databaseUsers = [
    { username: "admin_adita", password: "admin123", nama_lengkap: "Admin Sistem Web", role: "admin" },
    { username: "pradana_pa", password: "pramuka2026", nama_lengkap: "Kelvin Sutirta (Pradana Pa)", role: "admin" },
    { username: "pradana_pi", password: "pramuka2026", nama_lengkap: "Aurell Tatia (Pradana Pi)", role: "admin" },
    { username: "kerani_pa", password: "pramuka2026", nama_lengkap: "Moch Sigit (Kerani Pa)", role: "admin" },
    { username: "kerani_pi1", password: "pramuka2026", nama_lengkap: "Nabila Putri (Kerani Pi 1)", role: "admin" },
    { username: "kerani_pi2", password: "pramuka2026", nama_lengkap: "Selma Janiska (Kerani Pi 2)", role: "admin" },
    
    { username: "kelvin_sutirta", password: "aditapraja", nama_lengkap: "Kelvin Sutirta Augusto W.", role: "anggota" },
    { username: "m_rayhan", password: "aditapraja", nama_lengkap: "M. Rayhan Kautsar Adirafa", role: "anggota" }
    // (Anda bisa tambahkan sisa akun lainnya di sini seperti biasa)
];

let userLogin = JSON.parse(localStorage.getItem('userLogin'));
let currentLat = null, currentLng = null;

// PENGATURAN DEFAULT DEMO
let settingDemo = JSON.parse(localStorage.getItem('settingDemo')) || { lat: "-6.200000", lng: "106.816666", radius: 50, jamBuka: "00:00", jamTutup: "23:59" };
// RIWAYAT DEFAULT DEMO
let riwayatDemo = JSON.parse(localStorage.getItem('riwayatDemo')) || [];

// ==========================================
// INISIALISASI HALAMAN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.includes('anggota.html') && (!userLogin || userLogin.role !== 'anggota')) { window.location.href = 'index.html'; return; }
    if (path.includes('admin.html') && (!userLogin || userLogin.role !== 'admin')) { window.location.href = 'index.html'; return; }
    if ((path.includes('index.html') || path.endsWith('/')) && userLogin) { window.location.href = userLogin.role === 'admin' ? 'admin.html' : 'anggota.html'; return; }

    if (document.getElementById('halaman-admin')) {
        if(document.getElementById('user-info')) document.getElementById('user-info').innerText = userLogin.nama_lengkap;
        muatPengaturanAdminDemo();
        if(document.getElementById('filter-tanggal')) document.getElementById('filter-tanggal').value = new Date().toISOString().split('T')[0];
        muatDataAbsensiHarianDemo();
    }
    
    if (document.getElementById('halaman-anggota')) {
        if (document.getElementById('user-info-top')) document.getElementById('user-info-top').innerText = userLogin.nama_lengkap;
        if (document.getElementById('welcome-nama')) document.getElementById('welcome-nama').innerText = userLogin.nama_lengkap;
        if (document.getElementById('wm-nama')) document.getElementById('wm-nama').innerText = userLogin.nama_lengkap;
        if (document.getElementById('wm-nama-rapat')) document.getElementById('wm-nama-rapat').innerText = userLogin.nama_lengkap;
        
        ambilLokasiSekarang(); jalankanKamera(); jalankanJamLive(); muatRiwayatPribadiDemo();
    }
});

// ==========================================
// LOGIKA UI & LOGIN
// ==========================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && overlay) {
        if (sidebar.style.left === '0px') { sidebar.style.left = '-260px'; overlay.style.display = 'none'; } 
        else { sidebar.style.left = '0px'; overlay.style.display = 'block'; }
    }
}
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    if(document.getElementById(viewId)) document.getElementById(viewId).style.display = 'block';
    const sidebar = document.getElementById('sidebar');
    if(sidebar && sidebar.style.left === '0px') toggleSidebar();
}
function prosesLogin(event) {
    event.preventDefault();
    const userFound = databaseUsers.find(u => u.username === document.getElementById('input-username').value && u.password === document.getElementById('input-password').value);
    if (userFound) { localStorage.setItem('userLogin', JSON.stringify(userFound)); window.location.href = userFound.role === 'admin' ? 'admin.html' : 'anggota.html'; } 
    else alert("Username atau Password salah!");
}
function logout() { localStorage.removeItem('userLogin'); window.location.href = 'index.html'; }

// ==========================================
// GPS & KAMERA
// ==========================================
async function jalankanKamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        const camKeg = document.getElementById('kamera-stream'); if(camKeg) camKeg.srcObject = stream;
        const camRap = document.getElementById('kamera-stream-rapat'); if(camRap) camRap.srcObject = stream;
    } catch (err) { alert("Izin kamera ditolak!"); }
}

function jalankanJamLive() {
    setInterval(() => {
        const skr = new Date();
        const strWaktu = skr.toLocaleString('id-ID');
        if(document.getElementById('wm-waktu')) document.getElementById('wm-waktu').innerText = strWaktu;
        if(document.getElementById('wm-waktu-rapat')) document.getElementById('wm-waktu-rapat').innerText = strWaktu;
        
        const jamSekarang = skr.getHours().toString().padStart(2, '0') + ":" + skr.getMinutes().toString().padStart(2, '0');
        const stWaktu = document.getElementById('status-waktu-alert');
        if (stWaktu) {
            if (jamSekarang >= settingDemo.jamBuka && jamSekarang <= settingDemo.jamTutup) { stWaktu.className = "alert alert-success"; stWaktu.innerHTML = `✅ Waktu Absen Buka (${settingDemo.jamBuka} - ${settingDemo.jamTutup})`; } 
            else { stWaktu.className = "alert alert-danger"; stWaktu.innerHTML = `⛔ Waktu Absen Tutup (Hanya buka: ${settingDemo.jamBuka} - ${settingDemo.jamTutup})`; }
        }
    }, 1000);
}

function ambilLokasiSekarang() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition((pos) => {
            currentLat = pos.coords.latitude; currentLng = pos.coords.longitude;
            const jarak = hitungJarak(currentLat, currentLng, settingDemo.lat, settingDemo.lng);
            if(document.getElementById('wm-jarak')) document.getElementById('wm-jarak').innerText = `Jarak: ${Math.round(jarak)}m`;
            const stGps = document.getElementById('status-gps-alert');
            if(stGps) {
                if (jarak <= settingDemo.radius) { stGps.className = "alert alert-success"; stGps.innerHTML = `✅ GPS Sesuai. Jarak: ${Math.round(jarak)}m.`; } 
                else { stGps.className = "alert alert-danger"; stGps.innerHTML = `⛔ Jarak Jauh: ${Math.round(jarak)}m (Maks ${settingDemo.radius}m).`; }
            }
        }, (err) => { if(document.getElementById('status-gps-alert')) document.getElementById('status-gps-alert').innerHTML = `⛔ GPS Gagal!`; }, { enableHighAccuracy: true });
    }
}
function hitungJarak(lat1, lon1, lat2, lon2) {
    const R = 6371e3, rad = Math.PI / 180;
    const a = Math.sin((lat2 - lat1)*rad/2)**2 + Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin((lon2 - lon1)*rad/2)**2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

// ==========================================
// SIMPAN ABSEN DEMO (LOCAL)
// ==========================================
function cekWaktuValid() {
    const skr = new Date();
    const jamSekarang = skr.getHours().toString().padStart(2, '0') + ":" + skr.getMinutes().toString().padStart(2, '0');
    return (jamSekarang >= settingDemo.jamBuka && jamSekarang <= settingDemo.jamTutup);
}

function simpanAbsenKegiatanDemo() {
    if (!cekWaktuValid()) { alert("Gagal: Saat ini di luar jam operasional absensi!"); return; }
    if (!currentLat || !currentLng) { alert("Tunggu sinyal GPS!"); return; }
    const jarak = Math.round(hitungJarak(currentLat, currentLng, settingDemo.lat, settingDemo.lng));
    prosesSimpanDemo(jarak <= settingDemo.radius ? 'Hadir' : 'Di Luar Area', jarak, 'kamera-stream');
}
function simpanIzinKegiatanDemo() {
    if (!cekWaktuValid()) { alert("Gagal: Saat ini di luar jam operasional absensi!"); return; }
    const alasan = prompt("Masukkan alasan izin kegiatan:"); if (!alasan) return;
    let jrk = currentLat ? Math.round(hitungJarak(currentLat, currentLng, settingDemo.lat, settingDemo.lng)) : 0;
    prosesSimpanDemo("Izin - " + alasan, jrk, 'kamera-stream');
}
function simpanAbsenRapatDemo() { prosesSimpanDemo('Hadir (Rapat)', 0, 'kamera-stream-rapat'); }
function simpanIzinRapatDemo() {
    const alasan = prompt("Masukkan alasan izin rapat:"); if (!alasan) return;
    prosesSimpanDemo("Izin - " + alasan + " (Rapat)", 0, 'kamera-stream-rapat');
}

function prosesSimpanDemo(statusTeks, jarakMeter, camId) {
    const video = document.getElementById(camId);
    let fotoBase64 = "";
    if (video && video.videoWidth > 0) {
        const cvs = document.createElement('canvas'); cvs.width = 320; cvs.height = 240;
        cvs.getContext('2d').drawImage(video, 0, 0, cvs.width, cvs.height);
        fotoBase64 = cvs.toDataURL('image/jpeg', 0.6); 
    }
    
    // Simpan ke array Lokal
    const tgl = new Date();
    const dataBaru = {
        username: userLogin.username,
        nama_lengkap: userLogin.nama_lengkap,
        jarak_meter: jarakMeter,
        status: statusTeks,
        tanggal_absen: tgl.toISOString().split('T')[0],
        waktu_absen: tgl.toISOString(),
        foto_base64: fotoBase64
    };
    
    riwayatDemo.push(dataBaru);
    localStorage.setItem('riwayatDemo', JSON.stringify(riwayatDemo));
    alert("Berhasil! Absen dicatat (Versi Demo Lokal).");
    muatRiwayatPribadiDemo();
}

function muatRiwayatPribadiDemo() {
    const tbody = document.getElementById('isi-riwayat-pribadi');
    if(tbody){
        const riwayatKu = riwayatDemo.filter(r => r.username === userLogin.username).reverse().slice(0, 5);
        if (riwayatKu.length > 0) tbody.innerHTML = riwayatKu.map(a => `<tr><td>${new Date(a.waktu_absen).toLocaleString('id-ID')}</td><td>${a.status} <br> ${a.jarak_meter}m</td></tr>`).join('');
        else tbody.innerHTML = `<tr><td colspan="2" class="text-center">Belum ada riwayat.</td></tr>`;
    }
}

// ==========================================
// FUNGSI ADMIN DEMO
// ==========================================
function muatPengaturanAdminDemo() {
    if(document.getElementById('cfg-lat')) document.getElementById('cfg-lat').value = settingDemo.lat; 
    if(document.getElementById('cfg-lng')) document.getElementById('cfg-lng').value = settingDemo.lng;
    if(document.getElementById('cfg-radius')) document.getElementById('cfg-radius').value = settingDemo.radius;
    if(document.getElementById('cfg-jam-mulai')) document.getElementById('cfg-jam-mulai').value = settingDemo.jamBuka; 
    if(document.getElementById('cfg-jam-selesai')) document.getElementById('cfg-jam-selesai').value = settingDemo.jamTutup;
}

function simpanPengaturanDemo(e) {
    e.preventDefault();
    settingDemo = {
        lat: document.getElementById('cfg-lat').value,
        lng: document.getElementById('cfg-lng').value,
        radius: parseInt(document.getElementById('cfg-radius').value),
        jamBuka: document.getElementById('cfg-jam-mulai').value,
        jamTutup: document.getElementById('cfg-jam-selesai').value
    };
    localStorage.setItem('settingDemo', JSON.stringify(settingDemo));
    alert("Pengaturan Demo Berhasil Disimpan Lokal!");
}

function muatDataAbsensiHarianDemo() {
    const tglEl = document.getElementById('filter-tanggal');
    if (!tglEl || !tglEl.value) return;
    
    const tbody = document.getElementById('isi-rekap-absen');
    if(tbody){
        const rekapHariIni = riwayatDemo.filter(r => r.tanggal_absen === tglEl.value);
        if (rekapHariIni.length > 0) {
            tbody.innerHTML = rekapHariIni.map(a => {
                const foto = a.foto_base64 ? `<img src="${a.foto_base64}" width="40" style="border-radius:5px; cursor:pointer;" onclick="window.open('${a.foto_base64}')">` : '-';
                return `<tr><td>${new Date(a.waktu_absen).toLocaleTimeString('id-ID')}</td><td>${a.nama_lengkap}</td><td>${a.jarak_meter}m</td><td>${a.status}</td><td>${foto}</td></tr>`;
            }).join('');
        } else tbody.innerHTML = `<tr><td colspan="5" class="text-center">Kosong.</td></tr>`;
    }
}

function exportExcel() {
    const table = document.getElementById("tabel-rekap");
    if(!table) return;
    const wb = XLSX.utils.table_to_book(table, { sheet: "Absensi_Demo" });
    XLSX.writeFile(wb, `Rekap_Demo_${document.getElementById('filter-tanggal').value}.xlsx`);
}

function resetDataDemo() {
    if(confirm("Yakin ingin MENGHAPUS SEMUA DATA absensi dari memori browser ini?")) {
        localStorage.removeItem('riwayatDemo');
        riwayatDemo = [];
        alert("Data berhasil dihapus!");
        muatDataAbsensiHarianDemo();
    }
}
