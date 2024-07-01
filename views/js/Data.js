let previousDataIDs = []; // Simpan ID data sebelumnya sebagai array
const imagePlaceholder = document.getElementById('image-placeholder');
const tableBody = document.getElementById('table-body');
const deviceDataElement = document.getElementById('devicedata');
const totalDataElement = document.getElementById('total-data');
let totalDataCount = 0; // Variabel untuk menyimpan total data yang masuk ke tabel
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
                const rowData = Object.entries(newItem)
                    .filter(([key]) => key !== 'time' && key !== 'deviceid' && key !== 'latitude' && key !== 'longitude')
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');
                
                // Deteksi packet loss berdasarkan counter f_cnt
                if (previousCounter !== null) {
                    const currentCounter = parseInt(newItem.f_cnt);
                    const packetLoss = currentCounter - previousCounter - 1;
                    if (packetLoss > 0) {
                        for (let i = 0; i < packetLoss; i++) {
                            const lossRow = document.createElement('tr');
                            const lossTimeCell = document.createElement('td');
                            const lossDataCell = document.createElement('td');

                            lossTimeCell.textContent = '---';
                            lossDataCell.textContent = 'loss';

                            lossTimeCell.classList.add('timecell-width');
                            lossDataCell.classList.add('datacell-width');

                            lossRow.appendChild(lossTimeCell);
                            lossRow.appendChild(lossDataCell);

                            // Tambahkan baris loss ke tabel
                            if (tableBody.children.length === 0) {
                                tableBody.appendChild(lossRow);
                            } else {
                                tableBody.insertBefore(lossRow, tableBody.children[0]);
                            }
                        }
                    }
                }
                const row = document.createElement('tr');
                const timeCell = document.createElement('td');
                const dataCell = document.createElement('td');

                const time = new Date(newItem['time']);
                const hours = time.getHours().toString().padStart(2, '0');
                const minutes = time.getMinutes().toString().padStart(2, '0');
                const seconds = time.getSeconds().toString().padStart(2, '0');
                timeCell.textContent = `${hours}:${minutes}:${seconds} WIB`;

                dataCell.innerHTML = `<span>${rowData}</span>`;

                timeCell.classList.add('timecell-width');
                dataCell.classList.add('datacell-width');

                row.appendChild(timeCell);
                row.appendChild(dataCell);

                // Tambahkan baris ke tabel
                if (tableBody.children.length === 0) {
                    tableBody.appendChild(row);
                } else {
                    tableBody.insertBefore(row, tableBody.children[0]);
                }

                // Sembunyikan placeholder gambar jika ada data yang dimasukkan
                if (imagePlaceholder) {
                    imagePlaceholder.style.display = 'none';
                }

                // Perbarui total data yang masuk ke tabel
                totalDataCount++;
                updateTotalData();

                // Simpan ID data baru ke dalam array previousDataIDs
                previousDataIDs.push(newItem.f_cnt);

                // Simpan nilai counter saat ini untuk perbandingan berikutnya
                previousCounter = parseInt(newItem.f_cnt);
            });

            // Perbarui elemen devicedata dengan deviceID dari data terakhir
            const lastData = data[data.length - 1];
            if (lastData.deviceid) {
                deviceDataElement.textContent = `${lastData.deviceid}`;
            }

        })
        .catch(error => console.error('Error fetching data:', error));
}

function updateTotalData() {
    totalDataElement.textContent = `Data yang terkirim: ${totalDataCount}`;
}

// Panggil ambilData setiap 1 detik
setInterval(ambilData, 5000);

// Panggil ambilData saat halaman dimuat pertama kali
window.onload = ambilData;
