import { supabase } from './supabase';

export interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  is_user: boolean;
  created_at: string;
}

export interface ChatMessageInput {
  message: string;
  is_user: boolean;
}

export class ChatHistoryService {
  /**
   * Save a chat message to the backend
   */
  static async saveMessage(
    message: ChatMessageInput,
    userId?: string
  ): Promise<{ success: boolean; data?: ChatMessage; error?: string }> {
    try {
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'User not authenticated' };
        targetUserId = user.id;
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: targetUserId,
          message: message.message,
          is_user: message.is_user,
        })
        .select()
        .single();

      if (error) {
        if (error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
          return { success: false, error: 'Chat messages table not found. Please run chat_messages_schema.sql in your Supabase SQL Editor.' };
        }
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to save message' };
    }
  }

  /**
   * Get chat history for a user
   */
  static async getChatHistory(
    limit: number = 100,
    userId?: string
  ): Promise<{ success: boolean; data?: ChatMessage[]; error?: string }> {
    try {
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'User not authenticated' };
        targetUserId = user.id;
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        if (error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
          return { success: false, error: 'Chat messages table not found. Please run chat_messages_schema.sql in your Supabase SQL Editor.' };
        }
        return { success: false, error: error.message };
      }
      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to fetch chat history' };
    }
  }

  /**
   * Delete all chat history for a user
   */
  static async clearChatHistory(
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'User not authenticated' };
        targetUserId = user.id;
      }

      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', targetUserId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to clear chat history' };
    }
  }

  /**
   * Delete a specific message
   */
  static async deleteMessage(
    messageId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to delete message' };
    }
  }
}

