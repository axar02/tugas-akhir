let previousDataIDs = []; // Simpan ID data sebelumnya sebagai array
const imagePlaceholder = document.getElementById('image-placeholder');
const totalDataElement = document.getElementById('total-data');
const lossRataElement = document.getElementById('loss-rata');
const tablerssi = document.getElementById('table-loss');
let totalDataCount = 0; // Variabel untuk menyimpan total data yang masuk ke tabel
let totalPacketsReceived = 0; // Total paket yang diterima
let totalPacketLoss = 0; // Total paket yang hilang
let previousCounter = null; // Counter sebelumnya

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
                let rowData = '';
                let currentCounter = null;

                for (const key in newItem) {
                    if (newItem.hasOwnProperty(key) && key === 'f_cnt') {
                        rowData += `${newItem[key]}, `;
                        currentCounter = parseInt(newItem[key]);
                    }
                }

                if (currentCounter !== null) {
                    // Hitung packet loss jika ada counter sebelumnya
                    if (previousCounter !== null) {
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
                            totalPacketLoss += packetLoss;
                            const lossLimitElement = document.getElementById('loss-limit');
                            if (lossLimitElement) {
                                // Dapatkan nilai yang sudah ada
                                let currentValue = parseInt(lossLimitElement.textContent);
                                // Tambahkan packet loss
                                if (isNaN(currentValue)) {
                                    currentValue = 0;
                                }
                                lossLimitElement.textContent = `${currentValue + packetLoss}`;
                            } else {
                                // Jika elemen belum ada, buat elemen baru dan tambahkan nilai
                                const newLossLimitElement = document.createElement('p');
                                newLossLimitElement.setAttribute('id', 'loss-limit');
                                newLossLimitElement.textContent = `${packetLoss}`;
                                document.body.appendChild(newLossLimitElement);
                            }
                        }
                    }

                    // Simpan nilai counter saat ini untuk perbandingan berikutnya
                    previousCounter = currentCounter;
                }

                // Hapus tanda koma ekstra di akhir
                rowData = rowData.slice(0, -2);

                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.textContent = rowData;
                cell.classList.add('rssi-width');
                row.appendChild(cell);

                // Tambahkan baris ke tabel
                if (tablerssi.children.length === 0) {
                    // Jika tabel kosong, tambahkan langsung ke tbody
                    tablerssi.appendChild(row);
                } else {
                    // Jika tidak, sisipkan setelah baris terakhir
                    tablerssi.insertBefore(row, tablerssi.children[0]);
                }

                // Sembunyikan placeholder gambar jika ada data yang ditemukan
                if (imagePlaceholder) {
                    imagePlaceholder.style.display = 'none';
                }

                // Perbarui total data yang masuk ke tabel
                totalDataCount++;
                totalPacketsReceived++;
                updateTotalData();

                // Hitung rata-rata packet loss dan perbarui elemen loss-rata
                hitungRataRataPacketLoss();

                // Simpan ID data baru ke dalam array previousDataIDs
                previousDataIDs.push(newItem.f_cnt);
            });

        })
        .catch(error => console.error('Error fetching data:', error));
}

function updateTotalData() {
    totalDataElement.textContent = `Data yang terkirim: ${totalDataCount}`;
}

// Fungsi untuk menghitung rata-rata packet loss dalam persen
function hitungRataRataPacketLoss() {
    const packetLossPercentage = (totalPacketLoss / (totalPacketLoss + totalPacketsReceived)) * 100;
    if (lossRataElement) {
        if (isNaN(packetLossPercentage)) {
            lossRataElement.textContent = `---`;
        } else {
            lossRataElement.textContent = `${packetLossPercentage.toFixed(2)} %`;
        }
    } else {
        console.error('Element with id "loss-rata" not found.');
    }
}

// Panggil ambilData setiap 5 detik
setInterval(ambilData, 5000);

// Panggil ambilData saat halaman dimuat pertama kali
window.onload = ambilData;
