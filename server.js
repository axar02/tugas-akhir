const express = require('express');
const cors = require('cors');
const app = express();
const mqtt = require('mqtt');
const path = require('path');

app.use(cors());
app.use(express.static(path.join(__dirname, 'views')));

const ttn_mqtt_broker = "au1.cloud.thethings.network";
const ttn_mqtt_port = 1883;
const ttn_app_id = "lora-watermeter-ta123@ttn";
const ttn_access_key = "NNSXS.KRG4SGIQPAS5XHLTARRZ7TFSCC5DLER7LXFVJEA.WUOJ5RB27ZRCCWGYAHUELQAV6XGYSLWUASIJL7JR6B25MX56NJJQ";

const client = mqtt.connect(`mqtt://${ttn_mqtt_broker}:${ttn_mqtt_port}`, {
    username: ttn_app_id,
    password: ttn_access_key
});

let dataHistory = []; // Simpan histori data

client.on('message', function (topic, message) {
    if (topic === `v3/${ttn_app_id}/devices/eui-70b3d57ed006232d/up`) {
        try {
            const msg = JSON.parse(message.toString());
            const time = msg.uplink_message.rx_metadata[0].time;
            // const deviceid = msg.identifiers.device_id;
            const f_cnt = String(msg.uplink_message.f_cnt);
            const data_Sensor = String(msg.uplink_message.decoded_payload.result);
            const rssi = msg.uplink_message.rx_metadata[0].rssi;
            const snr = msg.uplink_message.rx_metadata[0].snr;
            //delay
            // Waktu pengiriman dari end device (timestamp ISO 8601)
            const endDeviceSentTime = new Date(msg.uplink_message.rx_metadata[0].time).getTime();
            // Waktu diterima oleh gateway (timestamp ISO 8601)
            const gatewayReceivedTime = new Date(msg.uplink_message.received_at).getTime();
            // Hitung delay dari end device ke gateway (dalam milidetik)
            const delayMilliseconds = gatewayReceivedTime - endDeviceSentTime;
            // Ubah delay menjadi detik
            //const delay = delayMilliseconds / 1000;
            const delay = String(msg.uplink_message.consumed_airtime);

            const latitude = msg.uplink_message.locations.user.latitude;
            const longitude = msg.uplink_message.locations.user.longitude;
            const s_factor = msg.uplink_message.settings.data_rate.lora.spreading_factor;

            const newData = { time, f_cnt, data_Sensor, rssi, snr, delay, s_factor, latitude, longitude };

            // Tambahkan data baru ke histori
            dataHistory.push(newData);
        } catch (e) {
            console.error(`Error processing message: ${e}`);
        }
    }
});

// Endpoint untuk mengambil seluruh histori data
app.get('/api/data', (req, res) => {
    // Kirim seluruh histori data ke klien dalam bentuk JSON
    res.json(dataHistory);
});

client.on('connect', function () {
    console.log(`Terhubung ke broker MQTT`);
    client.subscribe(`v3/${ttn_app_id}/devices/eui-70b3d57ed006232d/up`, function (err) {
        if (err) {
            console.error(`Error subscribing to topic`);
        } else {
            console.log(`Berlangganan ke topik`);
        }
    });
});

// app.get('/dashboard', (req, res) => {
//     res.sendFile(path.join(__dirname, 'views', 'pages/dashboard.html'));
// });

app.set('view engine', 'ejs');

// about page
app.get('/dashboard', function(req, res) {
    res.render('pages/dashboard');
});

app.get('/data', function(req, res) {
    res.render('pages/Data');
});

app.get('/delay', function(req, res) {
    res.render('pages/delay');
});

app.get('/loss', function(req, res) {
    res.render('pages/loss');
});

app.get('/rssi', function(req, res) {
    res.render('pages/rssi');
});

app.get('/snr', function(req, res) {
    res.render('pages/snr');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server mendengarkan di port ${PORT}`);
});
