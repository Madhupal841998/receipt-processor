const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');
const FileModel = require('../models/FileModel');
const fileModel = new FileModel();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed.'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
}).single('receipt');

class FileService {
  constructor() {
  }

  handleUpload(req, res) {
    console.log('Uploading file...');
    return new Promise((resolve, reject) => {
      upload(req, res, async (err) => {
        if (err) {
          console.log('Error uploading file:', err);
          return reject(err);
        }
        
        if (!req.file) {
          console.log('No file uploaded');
          return reject(new Error('No file uploaded'));
        }

        try {
          const fileData = {
            file_name: req.file.originalname,
            file_path: req.file.path,
            file_url:'http://localhost:3000/uploads/' + req.file.filename,
            file_type: req.file.mimetype,
            file_size: req.file.size
          };

          const fileId = await fileModel.create(fileData);
          const fileRecord = await fileModel.findById(fileId);
          
          resolve(fileRecord);
        } catch (error) {
          console.log('Error processing file:', error);
          if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          reject(error);
        }
      });
    });
  }

  async validateFile(fileId) {
    console.log('Validating file...');
    const file = await fileModel.findById(fileId);
    if (!file) {
      console.log('File not found');
      throw new Error('File not found');
    }

    try {
      console.log('Validating file...');
      if (file.file_type === 'application/pdf') {
        console.log('Validating PDF...');
        const dataBuffer = fs.readFileSync(file.file_path);
        await pdf(dataBuffer);
        await fileModel.updateValidity(fileId, true);
        return { isValid: true, file };
      }
      // else if (file.file_type.startsWith('image/')) {
      //   console.log('Validating image...');
      //   await this.fileModel.updateValidity(fileId, true);
      //   return { isValid: true, file };
      // } 
      else {
        console.log('Unsupported file type');
        throw new Error('Unsupported file type');
      }
    } catch (error) {
      console.log('Error validating file:', error);
      await fileModel.updateValidity(fileId, false, error.message);
      return { isValid: false, error: error.message, file };
    }
  }

  async cleanupInvalidFiles() {
    console.log('Cleaning up invalid files...');
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const invalidFiles = await fileModel.findInvalidFilesBefore(cutoff);
    
    for (const file of invalidFiles) {
      console.log('Deleting invalid file:', file.file_path);
      if (fs.existsSync(file.file_path)) {
        fs.unlinkSync(file.file_path);
      }
      await fileModel.delete(file.id);
    }
    
    return invalidFiles.length;
  }
}

module.exports = FileService;