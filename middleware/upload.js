// src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// S'assurer que le dossier existe
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Dossier de destination
  },
  filename: function (req, file, cb) {
    // Nom du fichier : timestamp + extension (ex: 123456789.jpg)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre pour accepter que les images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Le fichier doit être une image !'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite 5MB
  fileFilter: fileFilter
});

module.exports = upload;
