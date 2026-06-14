import { Router } from 'express';
import multer from 'multer';
import { ImportController } from '../controllers/import.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { importIdParamSchema, resolveDuplicateSchema } from '../validation/import.schema';
import { groupIdParamSchema } from '../validation/group.schema';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (_req, file, cb) => {
    const hasCsvExt = file.originalname.toLowerCase().endsWith('.csv');
    const isCsvMime = file.mimetype === 'text/csv' || 
                      file.mimetype === 'application/vnd.ms-excel' || 
                      file.mimetype === 'application/csv';
    if (hasCsvExt && isCsvMime) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

const router = Router({ mergeParams: true });

// All import endpoints require user authentication
router.use(authenticate);

// GET /api/v1/groups/:groupId/imports
router.get(
  '/',
  validate(groupIdParamSchema, 'params'),
  ImportController.getImportReports
);

// POST /api/v1/groups/:groupId/imports
router.post(
  '/',
  validate(groupIdParamSchema, 'params'),
  upload.single('file'),
  ImportController.uploadCSV
);

// POST /api/v1/groups/:groupId/imports/upload
router.post(
  '/upload',
  validate(groupIdParamSchema, 'params'),
  upload.single('file'),
  ImportController.uploadCSV
);

// GET /api/v1/groups/:groupId/imports/:importId
router.get(
  '/:importId',
  validate(importIdParamSchema, 'params'),
  ImportController.getImportReport
);

// POST /api/v1/groups/:groupId/imports/:importId/resolve
router.post(
  '/:importId/resolve',
  validate(importIdParamSchema, 'params'),
  validate(resolveDuplicateSchema, 'body'),
  ImportController.resolveDuplicate
);

export default router;
