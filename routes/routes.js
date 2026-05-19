const express = require('express')
const bodyParser = require('body-parser');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const dokumenController = require('../controller/dokumenController.js')
const database = require('../database/config.js')
const moment = require('moment')

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      // Menyimpan file yang diunggah dalam folder 'uploads'
      cb(null, path.join(__dirname, '../file/source'));
  },
  // filename: (req, file, cb) => {
  //     // Menyimpan file dengan nama asli
  //     namaFile = file.originalname.replace(/[^a-zA-Z0-9_]/g, '').replace(/\s+/g, '_')
  //     let timestamp = moment().format('YYYYMMDDhhmmss')
  //     let extension = path.extname(file.originalname);
  //     let basename = path.basename(namaFile, extension);
  //     let newFilename = `${basename}-${timestamp}${extension}`;
  //     cb(null, newFilename);
  // }
  filename: (req, file, cb) => {
    let timestamp = moment().format('YYYYMMDDhhmmss');
    let extension = path.extname(file.originalname);
  
    // Menghapus spasi dan karakter khusus, menggantinya dengan underscore
    let basename = path.basename(file.originalname, extension)
      .replace(/\s+/g, '_')         // Mengganti spasi dengan _
      .replace(/[^a-zA-Z0-9_]/g, '') // Menghapus karakter selain huruf, angka, dan underscore
  
    // Gabungkan dengan timestamp dan simpan file dengan nama baru
    let newFilename = `${basename}-${timestamp}${extension}`;
    cb(null, newFilename);
  }
});

// Inisialisasi multer dengan konfigurasi penyimpanan
const upload = multer({ storage: storage });



router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.get('/test', (req, res) => {
  res.json({ message: 'You have access to this protected route! yaa', data: req.query });
});

router.get('/scan', upload.none(), dokumenController.scanDokumen)
router.post('/scan', upload.none(), dokumenController.postScan)
router.post('/scanv2', upload.none(), dokumenController.postScanV2)
// router.post('/ekstraksi', upload.none(), dokumenController.ekstraksiDokumen)

router.get('/periode', upload.none(), dokumenController.getPeriode)
router.post('/periode', upload.none(), dokumenController.postPeriode)

router.get('/periode_detail', upload.none(), dokumenController.getPeriodeDetail)
router.get('/periode_detailv2', upload.none(), dokumenController.getPeriodeDetailV2)
router.post('/edit_detail', upload.none(), dokumenController.postEditDetail)
router.post('/edit_detailv2', upload.none(), dokumenController.postEditDetailV2)
router.post('/delete_detail', upload.none(), dokumenController.postDeleteDetail)

// router.post('/send_pjlp', upload.none(), dokumenController.postToPjlp)
router.post('/send_pjlp', upload.array('lampiran'), dokumenController.postToPjlp)
router.get('/opd', upload.none(), dokumenController.getOpd)
router.post('/opd', upload.none(), dokumenController.postOpd)
router.post('/delopd', upload.none(), dokumenController.delOpd)
router.get('/skpd', upload.none(), dokumenController.getSkpd)
router.post('/skpd', upload.none(), dokumenController.postSkpd)
router.post('/delskpd', upload.none(), dokumenController.delSkpd)
router.get('/opdskpd', upload.none(), dokumenController.getOpdSkpd)




module.exports = router;