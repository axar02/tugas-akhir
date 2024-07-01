let previousDataIDs = []; // Simpan ID data sebelumnya sebagai array
const imagePlaceholder = document.getElementById('image-placeholder');
const totalDataElement = document.getElementById('total-data');
const snrRataElement = document.getElementById('snr-rata');
const tablerssi = document.getElementById('table-snr');
let totalDataCount = 0; // Variabel untuk menyimpan total data yang masuk ke tabel
let previousCounter = null; // Counter sebelumnya untuk deteksi packet loss

function ambilData() {
    fetch('http://localhost:8000/api/data') // Sesuaikan URL dengan server Anda
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Data received:', data);

            if (!data || !Array.isArray(data)) {
                console.log('No valid data received');
                return;
            }

            // Filter data yang belum dimasukkan ke dalam tabel
            const newData = data.filter(item => !previousDataIDs.includes(item.f_cnt));

            // Tambahkan baris baru ke tabel untuk setiap data baru
            newData.forEach(newItem => {
                const rowData = Object.entries(newItem)
                    .filter(([key]) => key == 'snr') // Hanya ambil data dengan kunci 'snr'
                    .map(([key, value]) => `${value} dB`) // Format data 'snr'
                    .join(', ');

                // Hitung packet loss jika ada counter sebelumnya
                if (previousCounter !== null) {
                    const currentCounter = parseInt(newItem.f_cnt);
                    const packetLoss = currentCounter - previousCounter - 1;
                    if (packetLoss > 0) {
                        // Tambahkan "loss" ke tabel
                        for (let i = 0; i < packetLoss; i++) {
                            const lossRow = document.createElement('tr');
                            const lossCell = document.createElement('td');
                            lossCell.textContent = "loss";
                            lossCell.classList.add('rssi-width');
                            lossRow.appendChild(lossCell);

                            // Tambahkan baris loss ke tabel
                            if (tablerssi.children.length === 0) {
                                tablerssi.appendChild(lossRow);
                            } else {
                                tablerssi.insertBefore(lossRow, tablerssi.children[0]);
                            }
                        }
                    }
                }

                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.textContent = rowData;
                cell.classList.add('rssi-width');
                row.appendChild(cell);

                // Tambahkan baris ke tabel
                if (tablerssi.children.length === 0) {
                    tablerssi.appendChild(row);
                } else {
                    tablerssi.insertBefore(row, tablerssi.children[0]);
                }

                // Sembunyikan placeholder gambar jika ada data yang dimasukkan
                if (imagePlaceholder) {
                    imagePlaceholder.style.display = 'none';
                }

                // Perbarui total data yang masuk ke tabel
                totalDataCount++;
                updateTotalData();

                // Hitung rata-rata dan perbarui elemen snr-rata
                hitungRataRata();

                // Simpan ID data baru ke dalam array previousDataIDs
                previousDataIDs.push(newItem.f_cnt);

                // Simpan nilai counter saat ini untuk perbandingan berikutnya
                previousCounter = parseInt(newItem.f_cnt);

                // Tambahkan data ke elemen dengan id "snr-limit" jika nilai SNR kurang dari 0
                if (parseInt(newItem.snr) < 0) {
                    const snrLimitElement = document.getElementById('snr-limit');
                    if (snrLimitElement) {
                        let currentValue = parseInt(snrLimitElement.textContent);
                        if (isNaN(currentValue)) {
                            currentValue = 0;
                        }
                        snrLimitElement.textContent = `${currentValue + 1}`;
                    } else {
                        const newSnrLimitElement = document.createElement('p');
                        newSnrLimitElement.setAttribute('id', 'snr-limit');
                        newSnrLimitElement.textContent = '1';
                        document.body.appendChild(newSnrLimitElement);
                    }
                }
            });

        })
        .catch(error => console.error('Error fetching data:', error));
}

function updateTotalData() {
    totalDataElement.textContent = `Data yang terkirim: ${totalDataCount}`;
}

// Fungsi untuk menghitung rata-rata SNR dari data yang ada di tabel
function hitungRataRata() {
    const rows = document.querySelectorAll('#table-snr tr');
    let total = 0;
    let jumlahDataValid = 0;

    // Hitung jumlah total data yang ada di tabel dan jumlah data yang valid
    rows.forEach(row => {
        const rowData = row.querySelector('td').textContent;
        const snr = parseFloat(rowData.split(' ')[0].trim()); // Ambil nilai SNR dari data

        if (!isNaN(snr)) {
            total += snr;
            jumlahDataValid++;
        }
    });

    // Hitung rata-rata jika ada minimal dua data yang valid
    let rataRata;
    if (jumlahDataValid >= 2) {
        rataRata = total / jumlahDataValid;
    } else {
        rataRata = NaN; // Jika tidak ada cukup data valid, atur rata-rata ke NaN
    }

    // Masukkan rata-rata ke elemen dengan id 'snr-rata'
    if (snrRataElement) {
        if (isNaN(rataRata)) {
            snrRataElement.textContent = `---`;
        } else {
            snrRataElement.textContent = `${rataRata.toFixed(2)} dB`;
        }
    } else {
        console.error('Element with id "snr-rata" not found.');
    }
}

// Panggil ambilData setiap 5 detik
setInterval(ambilData, 5000);

// Panggil ambilData saat halaman dimuat pertama kali
window.onload = ambilData;
