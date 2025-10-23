import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createActivity = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, description, type, duration, points } = req.body;

    if (!name || !type || !duration) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, type, and duration are required'
      });
    }

    const activity = await prisma.activity.create({
      data: {
        userId,
        name,
        description,
        type,
        duration: parseInt(duration),
        points: points ? parseInt(points) : Math.max(5, parseInt(duration) * 2)
      }
    });

    res.status(201).json({
      message: 'Activity created successfully',
      data: activity
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({
      error: 'Failed to create activity',
      message: 'An error occurred while creating your activity'
    });
  }
};

export const getActivities = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { completed, type, limit = '50', offset = '0' } = req.query;

    const whereClause: any = { userId };
    if (completed !== undefined) {
      whereClause.completed = completed === 'true';
    }
    if (type) {
      whereClause.type = type;
    }

    const activities = await prisma.activity.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    res.json({
      message: 'Activities retrieved successfully',
      data: activities
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      error: 'Failed to retrieve activities',
      message: 'An error occurred while fetching your activities'
    });
  }
};

export const completeActivity = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const activity = await prisma.activity.findFirst({
      where: { id, userId }
    });

    if (!activity) {
      return res.status(404).json({
        error: 'Activity not found',
        message: 'The requested activity does not exist or you do not have permission to modify it'
      });
    }

    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: {
        completed: true,
        completedAt: new Date()
      }
    });

    res.json({
      message: 'Activity completed successfully',
      data: updatedActivity,
      pointsEarned: activity.points
    });
  } catch (error) {
    console.error('Complete activity error:', error);
    res.status(500).json({
      error: 'Failed to complete activity',
      message: 'An error occurred while completing your activity'
    });
  }
};

export const submitGameScore = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { gameType, score, level, duration } = req.body;

    if (!gameType || score === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Game type and score are required'
      });
    }

    const gameScore = await prisma.gameScore.create({
      data: {
        userId,
        gameType,
        score: parseInt(score),
        level: level ? parseInt(level) : null,
        duration: duration ? parseInt(duration) : null
      }
    });

    res.status(201).json({
      message: 'Game score submitted successfully',
      data: gameScore
    });
  } catch (error) {
    console.error('Submit game score error:', error);
    res.status(500).json({
      error: 'Failed to submit game score',
      message: 'An error occurred while saving your game score'
    });
  }
};

export const getGameScores = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { gameType, limit = '20', offset = '0' } = req.query;

    const whereClause: any = { userId };
    if (gameType) {
      whereClause.gameType = gameType;
    }

    const gameScores = await prisma.gameScore.findMany({
      where: whereClause,
      orderBy: { playedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    // Calculate statistics
    const stats = await prisma.gameScore.groupBy({
      by: ['gameType'],
      where: { userId },
      _count: { gameType: true },
      _avg: { score: true },
      _max: { score: true }
    });

    res.json({
      message: 'Game scores retrieved successfully',
      data: {
        scores: gameScores,
        statistics: stats
      }
    });
  } catch (error) {
    console.error('Get game scores error:', error);
    res.status(500).json({
      error: 'Failed to retrieve game scores',
      message: 'An error occurred while fetching your game scores'
    });
  }
};

export const getActivityStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { days = '30' } = req.query;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    // Get activity statistics
    const stats = await prisma.activity.groupBy({
      by: ['type', 'completed'],
      where: {
        userId,
        createdAt: { gte: daysAgo }
      },
      _count: { type: true },
      _sum: { points: true, duration: true }
    });

    // Get total points earned
    const totalPoints = await prisma.activity.aggregate({
      where: {
        userId,
        completed: true,
        createdAt: { gte: daysAgo }
      },
      _sum: { points: true }
    });

    res.json({
      message: 'Activity statistics retrieved successfully',
      data: {
        stats,
        totalPoints: totalPoints._sum.points || 0,
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve activity statistics',
      message: 'An error occurred while fetching your activity statistics'
    });
  }
};
