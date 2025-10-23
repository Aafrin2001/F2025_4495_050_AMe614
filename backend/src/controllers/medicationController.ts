import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createMedication = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, dosage, frequency, instructions, startDate, endDate } = req.body;

    if (!name || !dosage || !frequency || !startDate) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, dosage, frequency, and start date are required'
      });
    }

    const medication = await prisma.medication.create({
      data: {
        userId,
        name,
        dosage,
        frequency,
        instructions,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null
      }
    });

    res.status(201).json({
      message: 'Medication created successfully',
      data: medication
    });
  } catch (error) {
    console.error('Create medication error:', error);
    res.status(500).json({
      error: 'Failed to create medication',
      message: 'An error occurred while adding your medication'
    });
  }
};

export const getMedications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { active, limit = '50', offset = '0' } = req.query;

    const whereClause: any = { userId };
    if (active !== undefined) {
      whereClause.isActive = active === 'true';
    }

    const medications = await prisma.medication.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    res.json({
      message: 'Medications retrieved successfully',
      data: medications
    });
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({
      error: 'Failed to retrieve medications',
      message: 'An error occurred while fetching your medications'
    });
  }
};

export const updateMedication = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { name, dosage, frequency, instructions, startDate, endDate, isActive } = req.body;

    // Verify ownership
    const existingMedication = await prisma.medication.findFirst({
      where: { id, userId }
    });

    if (!existingMedication) {
      return res.status(404).json({
        error: 'Medication not found',
        message: 'The requested medication does not exist or you do not have permission to modify it'
      });
    }

    const updatedMedication = await prisma.medication.update({
      where: { id },
      data: {
        name: name || existingMedication.name,
        dosage: dosage || existingMedication.dosage,
        frequency: frequency || existingMedication.frequency,
        instructions: instructions !== undefined ? instructions : existingMedication.instructions,
        startDate: startDate ? new Date(startDate) : existingMedication.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existingMedication.endDate,
        isActive: isActive !== undefined ? isActive : existingMedication.isActive
      }
    });

    res.json({
      message: 'Medication updated successfully',
      data: updatedMedication
    });
  } catch (error) {
    console.error('Update medication error:', error);
    res.status(500).json({
      error: 'Failed to update medication',
      message: 'An error occurred while updating your medication'
    });
  }
};

export const deleteMedication = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    // Verify ownership
    const existingMedication = await prisma.medication.findFirst({
      where: { id, userId }
    });

    if (!existingMedication) {
      return res.status(404).json({
        error: 'Medication not found',
        message: 'The requested medication does not exist or you do not have permission to delete it'
      });
    }

    await prisma.medication.delete({
      where: { id }
    });

    res.json({
      message: 'Medication deleted successfully'
    });
  } catch (error) {
    console.error('Delete medication error:', error);
    res.status(500).json({
      error: 'Failed to delete medication',
      message: 'An error occurred while deleting your medication'
    });
  }
};

export const getMedicationReminders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const activeMedications = await prisma.medication.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } }
        ]
      }
    });

    // Simple reminder logic (in production, this would be more sophisticated)
    const reminders = activeMedications.map((med: any) => ({
      id: med.id,
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      nextDose: 'Next dose due soon', // Simplified
      instructions: med.instructions
    }));

    res.json({
      message: 'Medication reminders retrieved successfully',
      data: reminders
    });
  } catch (error) {
    console.error('Get medication reminders error:', error);
    res.status(500).json({
      error: 'Failed to retrieve medication reminders',
      message: 'An error occurred while fetching your medication reminders'
    });
  }
};
