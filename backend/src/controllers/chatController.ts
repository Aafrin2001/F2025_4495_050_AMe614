import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { message, isUser = true } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Message content is required'
      });
    }

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        userId,
        message,
        isUser: true
      }
    });

    // Generate AI response (simplified for now)
    let aiResponse = "I understand you need help. This is a demo response. In the full version, I'll provide personalized health guidance based on your needs.";
    
    if (message.toLowerCase().includes('blood pressure')) {
      aiResponse = "I can help you track your blood pressure readings. Please record your systolic and diastolic values, and I'll help you monitor trends over time.";
    } else if (message.toLowerCase().includes('medication')) {
      aiResponse = "I can help you manage your medications. I can remind you about doses, track side effects, and help you maintain your medication schedule.";
    } else if (message.toLowerCase().includes('appointment')) {
      aiResponse = "I can help you schedule and manage your medical appointments. Would you like me to remind you about upcoming visits or help you prepare questions for your doctor?";
    } else if (message.toLowerCase().includes('emergency')) {
      aiResponse = "If this is a medical emergency, please call 911 immediately. For non-emergency health concerns, I'm here to help guide you to appropriate resources.";
    }

    // Save AI response
    const aiMessage = await prisma.chatMessage.create({
      data: {
        userId,
        message: aiResponse,
        isUser: false
      }
    });

    res.status(201).json({
      message: 'Messages sent successfully',
      data: {
        userMessage,
        aiMessage
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      error: 'Failed to send message',
      message: 'An error occurred while processing your message'
    });
  }
};

export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { limit = '50', offset = '0' } = req.query;

    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    res.json({
      message: 'Chat history retrieved successfully',
      data: messages.reverse() // Return in chronological order
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      error: 'Failed to retrieve chat history',
      message: 'An error occurred while fetching your chat history'
    });
  }
};

export const clearChatHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    await prisma.chatMessage.deleteMany({
      where: { userId }
    });

    res.json({
      message: 'Chat history cleared successfully'
    });
  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({
      error: 'Failed to clear chat history',
      message: 'An error occurred while clearing your chat history'
    });
  }
};
