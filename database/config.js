const mysql = require('mysql2');

// Konfigurasi pool koneksi ke database MySQL
// const pool = mysql.createPool({
//     host: '10.15.130.33', // Alamat host MySQL, bisa juga IP server
//     user: 'hendy',         // Nama pengguna MySQL
//     password: 'ID3@WIFI03',  // Password MySQL
//     database: 'giat_id',    // Nama database yang akan diakses
//     waitForConnections: true, // Menunggu koneksi jika pool penuh
//     connectionLimit: 10,      // Jumlah maksimum koneksi dalam pool
//     queueLimit: 0             // Tidak ada batasan antrian koneksi
// });
const pool = mysql.createPool({
    host: '10.15.130.33', // Alamat host MySQL, bisa juga IP server
    user: 'hendy',         // Nama pengguna MySQL
    password: 'ID3@WIFI03',  // Password MySQL
    database: 'giat_id',    // Nama database yang akan diakses
    waitForConnections: true, // Menunggu koneksi jika pool penuh
    connectionLimit: 10,      // Jumlah maksimum koneksi dalam pool
    queueLimit: 0             // Tidak ada batasan antrian koneksi
});

// Test koneksi ke database MySQL
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.stack);
        return;
    }
    console.log('Connected to MySQL as id', connection.threadId);
    connection.release(); // Lepaskan koneksi kembali ke pool
});

// Ekspor pool koneksi agar bisa digunakan di file lain
module.exports = pool;
