const json = require('body-parser');
const modelVpr = require('../model/vprModel');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment')
require('dotenv').config();
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const { Document } = require('docx');
const mammoth = require('mammoth');
const db = require('../database/config');
// Import OpenAI library
const OpenAI = require('openai');
const { promisify } = require('util');
const axios = require('axios');
const { encode } = require('gpt-3-encoder');
const FormData = require('form-data');

// Inisialisasi OpenAI dengan API Key
const apiGemini = process.env.keygemini
const openai = new OpenAI({
    apiKey: process.env.key
    });


    // READ FILE
async function convertToBase64(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const validExt = ['.png', '.jpg', '.jpeg'];
    if (!validExt.includes(ext)) return null;

    const fileData = await fs.promises.readFile(filePath);
    // cukup kembalikan base64-nya saja
    return fileData.toString('base64');
}
async function readFolderRecursive(dirPath, level = 0) {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const result = [];

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {

            const children = await readFolderRecursive(fullPath, level + 1);

            const folderObj = {
                name: entry.name,
                type: 'folder',
                children
            };

            // HANYA tambahkan ekstraksi pada folder level 1 ke bawah (bukan folder pertama)
            if (level >= 1) {
                folderObj.ekstraksi = {
                    skpd: '',
                    lokasi: '',
                    jenis: '',
                    permohonan: ''
                };
            }

            result.push(folderObj);

        } else {
            // File
            let base64Data = null;

            if (
                entry.name.toLowerCase().includes('ba') &&
                ['.png', '.jpg', '.jpeg'].includes(path.extname(entry.name).toLowerCase())
            ) {
                base64Data = await convertToBase64(fullPath);
            }

            result.push({
                name: entry.name,
                type: 'file',
                base64: base64Data
            });
        }
    }

    return result;
}
// async function readFolderRecursive(dirPath) {
//     const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
//     const result = [];

//     for (const entry of entries) {
//         const fullPath = path.join(dirPath, entry.name);

//         if (entry.isDirectory()) {
//             // Jika folder → baca isi di dalamnya
//             const children = await readFolderRecursive(fullPath);
//             result.push({
//                 name: entry.name,
//                 ekstraksi: {
//                     skpd:'',
//                     lokasi:'',
//                     jenis:'',
//                     permohonan:''
//                 },
//                 type: 'folder',
//                 children
//             });
//         } else {
//             // Jika file
//             let base64Data = null;

//             // Hanya ubah file yang namanya mengandung "ba" dan berekstensi gambar
//             if (
//                 entry.name.toLowerCase().includes('ba') &&
//                 ['.png', '.jpg', '.jpeg'].includes(path.extname(entry.name).toLowerCase())
//             ) {
//                 base64Data = await convertToBase64(fullPath);
//             }

//             result.push({
//                 name: entry.name,
//                 type: 'file',
//                 base64: base64Data // null kalau bukan file "ba"
//             });
//         }
//     }

//     return result;
// }
async function scanDokumen(req, res) {
    try {
        const folderPath = path.join(__dirname, '../file/proses');
        const content = await readFolderRecursive(folderPath);

        console.log('folderPath',folderPath);
        

        return res.status(200).json({
            status: 'success',
            basePath: folderPath,
            content
        });
    } catch (error) {
        console.error('Error reading folder:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Gagal membaca isi folder',
            detail: error.message
        });
    }
}

async function getPeriode(req, res) {
    try{
        const queryAsync = promisify(db.query).bind(db);
        const query = `select * from periode`;
        const dataget = await queryAsync(query);


        res.status(200).send({
            message: 'success',
            // hashed: hashedPassword,
            result: dataget
        });

    }catch(error){
        res.status(500).send({
            message: 'Error in get periode',
            error: error.message
        });
        
    }
}
async function getOpd(req, res) {
    try{
        const queryAsync = promisify(db.query).bind(db);
        const query = `select * from opd`;
        const dataget = await queryAsync(query);


        res.status(200).send({
            message: 'success',
            // hashed: hashedPassword,
            result: dataget
        });

    }catch(error){
        res.status(500).send({
            message: 'Error in get periode',
            error: error.message
        });
        
    }
}

async function postOpd(req, res) {
    const { namaOpd } = req.body;

    try {

        const queryInsert = 'INSERT INTO opd (opd) VALUES (?)';

        db.query(queryInsert, [namaOpd], (err, result) => {

            if (err) {
                return res.status(500).json({ error: err.message });
            }

            console.log('result', result);

            res.status(200).send({
                message: 'OPD Berhasil Di Submit',
                result: {
                    id: result.insertId,
                    nama_opd: namaOpd
                }
            });

        });

    } catch (error) {

        console.error('Error processing the request:', error);

        res.status(500).send({
            message: 'Error post opd.'
        });

    }
}

async function getSkpd(req, res) {
    try{
        const queryAsync = promisify(db.query).bind(db);
        const query = `select * from ukpd`;
        const dataget = await queryAsync(query);


        res.status(200).send({
            message: 'success',
            // hashed: hashedPassword,
            result: dataget
        });

    }catch(error){
        res.status(500).send({
            message: 'Error in get periode',
            error: error.message
        });
        
    }
}

async function postSkpd(req, res) {
    const { idOpd,namaUkpd } = req.body;

    try {

        const queryInsert = 'INSERT INTO ukpd (id_opd,ukpd) VALUES (?,?)';

        db.query(queryInsert, [idOpd,namaUkpd], (err, result) => {

            if (err) {
                return res.status(500).json({ error: err.message });
            }

            console.log('result', result);

            res.status(200).send({
                message: 'UKPD Berhasil Di Submit',
                result: {
                    id: result.insertId,
                    nama_ukpd: namaUkpd
                }
            });

        });

    } catch (error) {

        console.error('Error processing the request:', error);

        res.status(500).send({
            message: 'Error post opd.'
        });

    }
}

async function delSkpd(req, res) {
    const { idSkpd } = req.body;

    try {

        const queryInsert = 'DELETE FROM ukpd WHERE id = ?';

        db.query(queryInsert, [idSkpd], (err, result) => {

            if (err) {
                return res.status(500).json({ error: err.message });
            }

            console.log('result', result);

            res.status(200).send({
                message: 'UKPD Berhasil Di Hapus',
                result: {
                    id: idSkpd
                }
            });

        });

    } catch (error) {

        console.error('Error processing the request:', error);

        res.status(500).send({
            message: 'Error delete skpd.'
        });

    }
}

async function delOpd(req, res) {
    const { idOpd } = req.body;

    try {

        const queryInsert = 'DELETE FROM opd WHERE id = ?';

        db.query(queryInsert, [idOpd], (err, result) => {

            if (err) {
                return res.status(500).json({ error: err.message });
            }

            console.log('result', result);

            res.status(200).send({
                message: 'OPD Berhasil Di Hapus',
                result: {
                    id: idOpd
                }
            });

        });

    } catch (error) {

        console.error('Error processing the request:', error);

        res.status(500).send({
            message: 'Error delete OPD.'
        });

    }
}

async function getOpdSkpd(req, res) {
    try {
        const queryAsync = promisify(db.query).bind(db);

        const query = `
            SELECT 
            o.id as id_opd,
            o.opd as opd,
            u.id as id_ukpd,
            u.ukpd
            FROM opd o
            LEFT JOIN ukpd u ON u.id_opd = o.id
            ORDER BY o.id;
        `;

        const rows = await queryAsync(query);

        const resultMap = {};

        rows.forEach(row => {
            if (!resultMap[row.id_opd]) {
                resultMap[row.id_opd] = {
                    id_opd: row.id_opd,
                    opd: row.opd,
                    ukpd: []
                };
            }

            if (row.id_ukpd) {
                resultMap[row.id_opd].ukpd.push({
                    id_ukpd: row.id_ukpd,
                    ukpd: row.ukpd
                });
            }
        });

        const result = Object.values(resultMap);

        res.status(200).send({
            message: 'success',
            result: result
        });

    } catch (error) {
        res.status(500).send({
            message: 'Error in get skpd',
            error: error.message
        });
    }
}

async function postPeriode(req, res) {
    const { tahun,bulan } = req.body;

    try {
        const queryInsert = 'insert into periode (bulan,tahun) values (?,?)'
        // const queryUpdate = 'update t_file set file_result = ? where id = ?';
        db.query(queryInsert, [bulan,tahun], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            console.log('result',result)
            

            res.status(200).send({
                message: 'Periode Berhasil Di Submit',
                result: {tahun:tahun,bulan:bulan}
            });
        })
    } catch (error) {
        console.error('Error processing the request:', error);
        res.status(500).send({ message: 'Error post periode.' });
    }
}

async function postScan(req,res) {
    const { id_periode,tanggal_ba,no_ba,skpd,lokasi,jenis,keterangan,image_ba,image_giat_a,image_giat_b,image_giat_c,image_giat_d } = req.body;
    try {
        const queryInsert = 'insert into giat (id_periode,tanggal_ba,no,skpd,lokasi,jenis,keterangan,image_ba,image_giat_a,image_giat_b,image_giat_c,image_giat_d) values (?,?,?,?,?,?,?,?,?,?,?,?)'
        // const queryUpdate = 'update t_file set file_result = ? where id = ?';
        db.query(queryInsert, [id_periode,
            tanggal_ba,
            no_ba,
            skpd,
            lokasi,
            jenis,
            keterangan,
            image_ba,
            image_giat_a ? image_giat_a : null,
            image_giat_b ? image_giat_b : null,
            image_giat_c ? image_giat_c : null,
            image_giat_d ? image_giat_d : null
        ], async (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message,salah:'ini' });
            }

            console.log('result',result)
            
            const content = await moveFolder(id_periode,tanggal_ba,no_ba);
            res.status(200).send({
                message: 'data scan berhasil di submit',
                result: req.body
            });
        })
    } catch (error) {
        console.error('Error processing the request:', error);
        res.status(500).send({ message: 'Error post periode.' });
    }
    
}

async function postScanV2(req,res) {
    const { id_periode,tanggal_ba,no_ba,ukpd,opd,jenis,keterangan,image_ba,image_giat_a,image_giat_b,image_giat_c,image_giat_d } = req.body;
    try {
        const queryInsert = 'insert into giat_id (id_periode,tanggal_ba,no,ukpd,opd,jenis,keterangan,image_ba,image_giat_a,image_giat_b,image_giat_c,image_giat_d) values (?,?,?,?,?,?,?,?,?,?,?,?)'
        // const queryUpdate = 'update t_file set file_result = ? where id = ?';
        db.query(queryInsert, [id_periode,
            tanggal_ba,
            no_ba,
            ukpd,
            opd,
            jenis,
            keterangan,
            image_ba,
            image_giat_a ? image_giat_a : null,
            image_giat_b ? image_giat_b : null,
            image_giat_c ? image_giat_c : null,
            image_giat_d ? image_giat_d : null
        ], async (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message,salah:'ini' });
            }

            console.log('result',result)
            
            const content = await moveFolder(id_periode,tanggal_ba,no_ba);
            res.status(200).send({
                message: 'data scan berhasil di submit',
                result: req.body
            });
        })
    } catch (error) {
        console.error('Error processing the request:', error);
        res.status(500).send({ message: 'Error post periode.' });
    }
    
}

async function moveFolder(periode,tanggal_ba,ba){
    try {
        const  namaFolder  = periode; // misalnya "namaFolder" = parameter dari client
        const tanggalBa = tanggal_ba;
        const subFolder = ba; // contoh fix (bisa juga ambil dari body)

        // Path asal dan tujuan
        const source = path.join(__dirname, `../file/proses/${tanggalBa}`, subFolder);
        const destination = path.join(__dirname, `../file/data/${namaFolder}/${tanggalBa}`, subFolder);

        // Buat folder tujuan kalau belum ada
        await fs.ensureDir(path.dirname(destination));

        // Pindahkan seluruh isi folder (overwrite = true jika sudah ada)
        await fs.move(source, destination, { overwrite: true });

        // res.status(200).send({
        //     message: 'Folder berhasil dipindahkan!',
        //     from: source,
        //     to: destination,
        //     body:req.body
        // });
    } catch (error) {
        console.error('Error processing the request:', error);
        // res.status(500).send({ message: 'Error post periode.' });
    }
}

async function getPeriodeDetail(req, res) {
    const { id_periode } = req.query;

    try {
        const queryInsert = 'select * from giat where id_periode = ?'
        // const queryUpdate = 'update t_file set file_result = ? where id = ?';
        db.query(queryInsert, [id_periode], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            console.log('result',result)
            
            res.status(200).send({
                message: 'data detail berhasil di muat',
                result: result
            });
        })
    } catch (error) {
        console.error('Error processing the request:', error);
        res.status(500).send({ message: 'Error post periode.' });
    }
}

async function getPeriodeDetailV2(req, res) {
    const { id_periode } = req.query;

    try {
        const queryInsert = 'select * from giat_id where id_periode = ?'
        // const queryUpdate = 'update t_file set file_result = ? where id = ?';
        db.query(queryInsert, [id_periode], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            console.log('result',result)
            
            res.status(200).send({
                message: 'data detail berhasil di muat',
                result: result
            });
        })
    } catch (error) {
        console.error('Error processing the request:', error);
        res.status(500).send({ message: 'Error post periode.' });
    }
}

async function postEditDetail(req,res) {
    const { id_giat, skpd, lokasi, jenis, keterangan } = req.body;

    if (!id_giat) {
        return res.status(400).json({ message: "id_giat wajib dikirim" });
    }

    try {
        const queryUpdate = `
            UPDATE giat 
            SET skpd = ?, lokasi = ?, jenis = ?, keterangan = ?
            WHERE id_giat = ?
        `;

        db.query(
            queryUpdate,
            [skpd, lokasi, jenis, keterangan, id_giat],
            (err, result) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        message: "Data tidak ditemukan"
                    });
                }

                return res.status(200).json({
                    message: "Data berhasil diperbarui",
                    updated: {
                        id_giat,
                        skpd,
                        lokasi,
                        jenis,
                        keterangan
                    }
                });
            }
        );

    } catch (error) {
        console.error('Error processing the request:', error);
        res.status(500).send({ message: 'Error edit data giat.' });
    }
}

async function postEditDetailV2(req,res) {
    const { id_giat, ukpd, opd, jenis, keterangan } = req.body;

    if (!id_giat) {
        return res.status(400).json({ message: "id_giat wajib dikirim" });
    }

    try {
        const queryUpdate = `
            UPDATE giat_id 
            SET ukpd = ?, opd = ?, jenis = ?, keterangan = ?
            WHERE id_giat = ?
        `;

        db.query(
            queryUpdate,
            [ukpd, opd, jenis, keterangan, id_giat],
            (err, result) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        message: "Data tidak ditemukan"
                    });
                }

                return res.status(200).json({
                    message: "Data berhasil diperbarui",
                    updated: {
                        id_giat,
                        ukpd,
                        opd,
                        jenis,
                        keterangan
                    }
                });
            }
        );

    } catch (error) {
        console.error('Error processing the request:', error);
        res.status(500).send({ message: 'Error edit data giat.' });
    }
}


async function postDeleteDetail(req, res) {
    const { id_giat } = req.body;
    console.log('masuk delete')
    try {
        const queryDelete = `
            DELETE FROM giat WHERE id_giat = ?
        `;

        db.query(queryDelete, [id_giat], async (err, result) => {

            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Data tidak ditemukanss"
                });
            }

            // ==== HAPUS FOLDER ID_GIAT ====
            const folderPath = path.join(__dirname, `../file/data/${id_giat}`);

            try {
                if (await fs.pathExists(folderPath)) {
                    await fs.remove(folderPath);    // Hapus folder beserta isinya
                }
            } catch (folderErr) {
                console.error("Gagal hapus folder:", folderErr);
                // tidak return error agar delete DB tetap sukses
            }

            return res.status(200).json({
                message: "Data berhasil dihapus",
                deleted_id: id_giat
            });
        });

    } catch (error) {
        console.error('Error processing the request:', error);
        res.status(500).send({ message: 'Error hapus data giat.' });
    }
}


// async function postToPjlp(req, res) {
//     // const { epjlp } = req.body;
//     // console.log('epjlp', epjlp)
//     // res.json(req.body);

//     try {
//         const body = req.body;

//         console.log('Kirim ke EPJLP:', body);

//         const response = await axios.post(
//         'https://siap-wkju.jakarta.go.id/epjlp/api/aktivitas/insert',
//         body,
//         {
//             headers: {
//             'Content-Type': 'application/json',
//             'x-api-key': 'GIAT-RAHASIA-2026' // kalau memang dipakai
//             },
//             timeout: 15000
//         }
//         );

//         console.log('Response EPJLP:', response.data);

//         // Balikkan response ke frontend
//         res.json({
//             success: true,
//             from_epjlp: response.data
//         });

//     } catch (error) {
//         console.error('Gagal kirim ke EPJLP:', error.response?.data || error.message);

//         res.status(500).json({
//         success: false,
//         error: error.response?.data || error.message
//         });
//     }

// }
async function postToPjlp(req, res) {
    try {
        const body = req.body;

        console.log('ini body', body)

        const form = new FormData();

        // ===== TEXT =====
        form.append('user_id', body.user_id);
        form.append('tanggal', body.tanggal);
        form.append('jam_mulai', body.jam_mulai);
        form.append('jam_selesai', body.jam_selesai);
        form.append('kategori', body.kategori);
        form.append('uraian', body.uraian);
        form.append('lokasi', body.lokasi || '-');
        form.append('nama_unit', body.nama_unit || '-');

        // ===== AMBIL FILE DARI file/data =====
        if (body.image_giat_a) {
            const filePath = path.join(__dirname, '../file/data', body.image_giat_a);

            if (fs.existsSync(filePath)) {
                form.append(
                    'lampiran[]',
                    fs.createReadStream(filePath),
                    body.image_giat_a
                );
            } else {
                console.log('File tidak ditemukan:', filePath);
            }
        }

        const response = await axios.post(
            'https://siap-wkju.jakarta.go.id/epjlp/api/aktivitas/insert',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'x-api-key': 'GIAT-RAHASIA-2026'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 20000
            }
        );

        res.json({
            success: true,
            from_epjlp: response.data
        });

    } catch (error) {
        console.error('Gagal kirim ke EPJLP:', error.response?.data || error.message);

        res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
}


module.exports = { 
    scanDokumen,getPeriode,postPeriode,postScan,getPeriodeDetail,postEditDetail,postDeleteDetail,
    postScanV2,getPeriodeDetailV2,postEditDetailV2,postToPjlp,getOpd,getSkpd,getOpdSkpd,postOpd,postSkpd,
    delSkpd,delOpd
};