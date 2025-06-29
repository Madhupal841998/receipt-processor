const FileService = require('../services/FileService');
const fileService = new FileService();

const FileController = {
  async uploadFile(req, res) {
    try {
      console.log('Uploading file...');
      const fileRecord = await fileService.handleUpload(req, res);

      if (!fileRecord || !fileRecord.id) {
        return res.status(400).json({
          status: false,
          message: 'File upload failed. No file record returned.',
        });
      }

      const validationResult = await fileService.validateFile(fileRecord.id);

      res.status(201).json({
        status: true,
        id: fileRecord.id,
        file_name: fileRecord.file_name,
        file_path: fileRecord.file_path,
        is_valid: validationResult.isValid,
        message: validationResult.isValid
          ? 'File uploaded and validated successfully'
          : 'File uploaded but validation failed',
        validation_error: validationResult.error || null
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({
        status: false,
        message: 'Internal Server Error during file upload',
        error: error.message,
        stack: error.stack
      });
    }
  },

  async validateFile(req, res) {
    try {
      console.log('Validating file...');
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ status: false, message: 'File ID is required' });
      }

      const result = await fileService.validatePdf(id);

      res.json({
        status: true,
        id,
        is_valid: result.isValid,
        message: result.isValid ? 'File is valid' : 'File is not valid',
        invalid_reason: result.error || null,
        file: result.file || null
      });
    } catch (error) {
      console.error('Error validating file:', error);
      res.status(500).json({
        status: false,
        message: 'Internal Server Error during validation',
        error: error.message,
        stack: error.stack
      });
    }
  },

  async cleanupFiles(req, res) {
    try {
      console.log('Cleaning up invalid files...');
      const count = await fileService.cleanupInvalidFiles();

      res.json({
        status: true,
        message: `Cleaned up ${count} invalid files`,
        count
      });
    } catch (error) {
      console.error('Error cleaning up invalid files:', error);
      res.status(500).json({
        status: false,
        message: 'Internal Server Error during cleanup',
        error: error.message,
        stack: error.stack
      });
    }
  }
};

module.exports = FileController;
