let map;
let marker;
let rssiChart;
let previousData = {};

function initMap(latitude, longitude) {
    const initialPosition = { lat: latitude, lng: longitude };
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: initialPosition,
        styles: []
    });
    marker = new google.maps.Marker({
        position: initialPosition,
        map: map
    });
}

function updateMap(latitude, longitude) {
    const newPosition = { lat: latitude, lng: longitude };
    if (map && marker) {
        map.setCenter(newPosition);
        marker.setPosition(newPosition);
    } else {
        initMap(latitude, longitude);
    }
}

function updateWarningBox(rssi, snr, delay) {
    const warningBox = document.getElementById('warningBox');
    let warnings = [];

    if (rssi < -90 || snr < 15 || delay > 100) {
        if (rssi < -90) {
            warnings.push("Sinyal RSSI lemah");
        }
        if (snr < 15) {
            warnings.push("SNR rendah");
        }
        if (delay > 100) {
            warnings.push("Delay tinggi");
        }
    }

    if (warnings.length > 0) {
        warningBox.innerHTML = warnings.join('<br>');
        warningBox.style.display = 'block';
    } else {
        warningBox.innerHTML = 'Semua parameter dalam batas normal';
        warningBox.style.display = 'none';
    }
}

function initRssiChart() {
    const ctx = document.getElementById('rssiChart').getContext('2d');
    rssiChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'RSSI',
                data: [],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }, {
                label: 'SNR',
                data: [],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }, {
                label: 'Delay',
                data: [],
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 10 // Atur jarak antar ticks (misalnya setiap 10 unit)
                    },
                    grid: {
                        display: true,
                        color: "rgba(200, 200, 200, 0.2)" // Warna dan opacity dari gridlines
                    }
                },
                x: {
                    grid: {
                        display: false // Nonaktifkan gridlines pada sumbu X
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.4 // Atur ketegangan garis untuk membuat garis lebih halus atau lebih lurus
                }
            }
        }
    });
}


function updateRssiChart(rssi, snr, delay) {
    const timestamp = new Date().toLocaleTimeString();

    // Menambahkan data baru ke setiap dataset
    rssiChart.data.labels.push(timestamp);
    rssiChart.data.datasets[0].data.push(rssi);
    rssiChart.data.datasets[1].data.push(snr);
    rssiChart.data.datasets[2].data.push(delay);

    // Memastikan bahwa jumlah data dalam dataset tidak melebihi batas tertentu (misalnya 10)
    const maxDataPoints = 10;
    if (rssiChart.data.labels.length > maxDataPoints) {
        // Menghapus data yang paling awal jika jumlah data sudah melebihi batas
        rssiChart.data.labels.shift();
        rssiChart.data.datasets.forEach(dataset => {
            dataset.data.shift();
        });
    }

    // Memperbarui grafik
    rssiChart.update();
}


function fetchData() {
    fetch('http://localhost:3000/api/data')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (!data) {
                console.log('No data received');
                return;
            }

            if (data.latitude && data.longitude) {
                updateMap(parseFloat(data.latitude), parseFloat(data.longitude));
            }

            if (data.rssi && data.snr && data.delay) {
                if (JSON.stringify(data) !== JSON.stringify(previousData)) {
                    updateRssiChart(parseFloat(data.rssi), parseFloat(data.snr), parseFloat(data.delay));
                    updateWarningBox(parseFloat(data.rssi), parseFloat(data.snr), parseFloat(data.delay));
                    previousData = data;
                }
            }
        })
        .catch(error => console.error('Error fetching data:', error));
}

setInterval(fetchData, 1000);

window.onload = function () {
    initMap(0, 0); // Default position
    initRssiChart();
    fetchData();
};