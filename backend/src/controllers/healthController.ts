import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createHealthRecord = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { type, value, unit, notes } = req.body;

    if (!type || !value) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Type and value are required'
      });
    }

    const healthRecord = await prisma.healthRecord.create({
      data: {
        userId,
        type,
        value,
        unit,
        notes
      }
    });

    res.status(201).json({
      message: 'Health record created successfully',
      data: healthRecord
    });
  } catch (error) {
    console.error('Create health record error:', error);
    res.status(500).json({
      error: 'Failed to create health record',
      message: 'An error occurred while saving your health data'
    });
  }
};

export const getHealthRecords = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { type, limit = '50', offset = '0' } = req.query;

    const whereClause: any = { userId };
    if (type) {
      whereClause.type = type;
    }

    const healthRecords = await prisma.healthRecord.findMany({
      where: whereClause,
      orderBy: { recordedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    res.json({
      message: 'Health records retrieved successfully',
      data: healthRecords
    });
  } catch (error) {
    console.error('Get health records error:', error);
    res.status(500).json({
      error: 'Failed to retrieve health records',
      message: 'An error occurred while fetching your health data'
    });
  }
};

export const getHealthSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { days = '7' } = req.query;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    // Get recent health records
    const recentRecords = await prisma.healthRecord.findMany({
      where: {
        userId,
        recordedAt: {
          gte: daysAgo
        }
      },
      orderBy: { recordedAt: 'desc' }
    });

    // Group by type for summary
    const summary = recentRecords.reduce((acc: any, record: any) => {
      if (!acc[record.type]) {
        acc[record.type] = [];
      }
      acc[record.type].push(record);
      return acc;
    }, {});

    // Calculate averages for numeric values
    const averages: any = {};
    Object.keys(summary).forEach(type => {
      const records = summary[type];
      const numericValues = records
        .map((r: any) => parseFloat(r.value))
        .filter((v: number) => !isNaN(v));
      
      if (numericValues.length > 0) {
        averages[type] = {
          average: numericValues.reduce((a: number, b: number) => a + b, 0) / numericValues.length,
          count: numericValues.length,
          latest: records[0]
        };
      }
    });

    res.json({
      message: 'Health summary retrieved successfully',
      data: {
        summary: averages,
        totalRecords: recentRecords.length,
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Get health summary error:', error);
    res.status(500).json({
      error: 'Failed to retrieve health summary',
      message: 'An error occurred while generating your health summary'
    });
  }
};

export const updateHealthRecord = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { type, value, unit, notes } = req.body;

    // Verify ownership
    const existingRecord = await prisma.healthRecord.findFirst({
      where: { id, userId }
    });

    if (!existingRecord) {
      return res.status(404).json({
        error: 'Health record not found',
        message: 'The requested health record does not exist or you do not have permission to modify it'
      });
    }

    const updatedRecord = await prisma.healthRecord.update({
      where: { id },
      data: {
        type: type || existingRecord.type,
        value: value || existingRecord.value,
        unit: unit !== undefined ? unit : existingRecord.unit,
        notes: notes !== undefined ? notes : existingRecord.notes
      }
    });

    res.json({
      message: 'Health record updated successfully',
      data: updatedRecord
    });
  } catch (error) {
    console.error('Update health record error:', error);
    res.status(500).json({
      error: 'Failed to update health record',
      message: 'An error occurred while updating your health data'
    });
  }
};

export const deleteHealthRecord = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    // Verify ownership
    const existingRecord = await prisma.healthRecord.findFirst({
      where: { id, userId }
    });

    if (!existingRecord) {
      return res.status(404).json({
        error: 'Health record not found',
        message: 'The requested health record does not exist or you do not have permission to delete it'
      });
    }

    await prisma.healthRecord.delete({
      where: { id }
    });

    res.json({
      message: 'Health record deleted successfully'
    });
  } catch (error) {
    console.error('Delete health record error:', error);
    res.status(500).json({
      error: 'Failed to delete health record',
      message: 'An error occurred while deleting your health data'
    });
  }
};
