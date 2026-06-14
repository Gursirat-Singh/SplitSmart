import { Request, Response } from 'express';
import { ImportService } from '../services/import.service';
import { catchAsync } from '../utils/helpers';
import { ValidationError } from '../utils/errors';
import { ApiResponse } from '../types';
import { prisma } from '../utils/prisma';

type ImportBatchLike = {
  id: string;
  groupId: string;
  importedById: string;
  fileName: string;
  status: string;
  totalRows: number;
  successCount: number;
  createdAt: Date;
  anomalies?: Array<{ id: string }>;
  rows?: Array<{
    id: string;
    rowNumber: number;
    verdict: string;
    rawData?: unknown;
  }>;
};

export class ImportController {
  private static mapStatus(status: string): 'PENDING' | 'COMPLETED' | 'FAILED' {
    if (status === 'COMPLETED') return 'COMPLETED';
    if (status === 'FAILED') return 'FAILED';
    return 'PENDING';
  }

  private static mapSummary(importBatch: ImportBatchLike) {
    return {
      id: importBatch.id,
      groupId: importBatch.groupId,
      uploadedById: importBatch.importedById,
      fileName: importBatch.fileName,
      status: this.mapStatus(importBatch.status),
      totalRows: importBatch.totalRows,
      importedRows: importBatch.successCount,
      anomaliesCount: importBatch.anomalies?.length ?? 0,
      createdAt: importBatch.createdAt,
    };
  }

  private static mapDetail(importBatch: ImportBatchLike & { anomalies: any[]; rows: any[] }) {
    const rowByNumber = new Map(importBatch.rows.map((row) => [row.rowNumber, row]));
    return {
      ...this.mapSummary(importBatch),
      anomalies: importBatch.anomalies.map((anomaly: any) => {
        const row = rowByNumber.get(anomaly.rowNumber);
        return {
          id: anomaly.id,
          reportId: importBatch.id,
          rowNumber: anomaly.rowNumber,
          rowData: JSON.stringify(anomaly.rawData ?? row?.rawData ?? {}, null, 2),
          reason: anomaly.message,
          resolved: row ? row.verdict !== 'FLAGGED' : false,
        };
      }),
    };
  }

  /**
   * Lists import batches for a group.
   */
  static getImportReports = catchAsync(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const userId = req.user!.userId;

    if (!groupId) {
      throw new ValidationError('Group ID parameter is required');
    }

    const reports = await ImportService.listImportReports(groupId as string, userId);
    const response: ApiResponse = {
      success: true,
      message: 'Import reports fetched successfully',
      data: reports.map((report) => ImportController.mapSummary(report as ImportBatchLike)),
    };

    res.status(200).json(response);
  });

  /**
   * Uploads and parses a CSV import file.
   */
  static uploadCSV = catchAsync(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const userId = req.user!.userId;

    if (!req.file) {
      throw new ValidationError('No CSV file uploaded. Please upload a file with the key "file"');
    }

    if (!groupId) {
      throw new ValidationError('Group ID parameter is required');
    }

    const importReport = await ImportService.processImport(
      groupId as string,
      userId,
      req.file.originalname,
      req.file.buffer
    );

    const response: ApiResponse = {
      success: true,
      message: 'CSV processing completed',
      data: ImportController.mapSummary(importReport as ImportBatchLike),
    };

    res.status(201).json(response);
  });

  /**
   * Resolves a duplicate import row using a specific action (ACCEPT or SKIP).
   */
  static resolveDuplicate = catchAsync(async (req: Request, res: Response) => {
    const { groupId, importId } = req.params;
    const userId = req.user!.userId;
    const { rowId, anomalyId } = req.body as {
      rowId?: string;
      anomalyId?: string;
      action: 'ACCEPT' | 'SKIP' | 'IMPORT';
    };
    const action = req.body.action === 'IMPORT' ? 'ACCEPT' : req.body.action;

    if (!groupId || !importId) {
      throw new ValidationError('Group ID and Import ID parameters are required');
    }

    let targetRowId = rowId;
    if (!targetRowId && anomalyId) {
      const anomaly = await prisma.importAnomaly.findFirst({
        where: { id: anomalyId, importId: importId as string },
      });

      if (!anomaly) {
        throw new ValidationError('Anomaly not found for this import batch');
      }

      const row = await prisma.importRow.findFirst({
        where: {
          importId: importId as string,
          rowNumber: anomaly.rowNumber,
        },
      });

      if (!row) {
        throw new ValidationError('Import row not found for provided anomaly');
      }

      targetRowId = row.id;
    }

    if (!targetRowId) {
      throw new ValidationError('Either rowId or anomalyId is required');
    }

    const resolvedRow = await ImportService.resolveDuplicate(
      groupId as string,
      userId,
      importId as string,
      targetRowId,
      action as 'ACCEPT' | 'SKIP'
    );

    const response: ApiResponse = {
      success: true,
      message: `Successfully resolved row duplicate check with action: ${action}`,
      data: resolvedRow,
    };

    res.status(200).json(response);
  });

  /**
   * Gets an import batch's report details and rows.
   */
  static getImportReport = catchAsync(async (req: Request, res: Response) => {
    const { groupId, importId } = req.params;
    const userId = req.user!.userId;

    if (!groupId || !importId) {
      throw new ValidationError('Group ID and Import ID parameters are required');
    }

    const importReport = await ImportService.getImportReport(groupId as string, userId, importId as string);

    const response: ApiResponse = {
      success: true,
      message: 'Import report fetched successfully',
      data: ImportController.mapDetail(importReport as ImportBatchLike & { anomalies: any[]; rows: any[] }),
    };

    res.status(200).json(response);
  });
}
