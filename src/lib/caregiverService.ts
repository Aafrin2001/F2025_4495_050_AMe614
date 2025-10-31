import { supabase } from './supabase';

export interface CaregiverRelationship {
  id: string;
  caregiver_id: string;
  caregiver_email: string;
  senior_email: string;
  senior_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  verification_code?: string;
  requested_at: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export class CaregiverService {
  /**
   * Request caregiver access to a senior account
   * Creates a pending relationship that requires senior approval
   */
  static async requestAccess(
    seniorEmail: string, 
    caregiverId: string, 
    caregiverEmail: string
  ): Promise<{ 
    success: boolean; 
    relationshipId?: string;
    verificationCode?: string;
    error?: string 
  }> {
    try {
      // Generate a verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Create a pending relationship request
      const { data, error } = await supabase
        .from('caregiver_relationships')
        .insert({
          caregiver_id: caregiverId,
          caregiver_email: caregiverEmail,
          senior_email: seniorEmail.trim().toLowerCase(),
          status: 'pending',
          verification_code: verificationCode,
          requested_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        // If table doesn't exist, create it (for development)
        if (error.code === '42P01') {
          console.warn('caregiver_relationships table does not exist. Please create it in Supabase.');
          return { 
            success: false, 
            error: 'Database table not set up. Please contact support.' 
          };
        }
        
        // Check if relationship already exists
        if (error.code === '23505') {
          return {
            success: false,
            error: 'A request for this senior already exists. Please wait for approval or contact the senior directly.'
          };
        }
        
        return { success: false, error: error.message };
      }
      
      return { 
        success: true, 
        relationshipId: data.id,
        verificationCode 
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error creating access request' };
    }
  }

  /**
   * Approve a caregiver request (called by senior)
   */
  static async approveRequest(
    relationshipId: string, 
    seniorId: string,
    verificationCode?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        status: 'approved',
        senior_id: seniorId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // If verification code provided, include it in the check
      let query = supabase
        .from('caregiver_relationships')
        .update(updateData)
        .eq('id', relationshipId)
        .eq('status', 'pending');

      if (verificationCode) {
        query = query.eq('verification_code', verificationCode);
      }

      const { error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error approving request' };
    }
  }

  /**
   * Reject a caregiver request (called by senior)
   */
  static async rejectRequest(relationshipId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('caregiver_relationships')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', relationshipId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error rejecting request' };
    }
  }

  /**
   * Verify and get approved relationship
   */
  static async verifyAccess(
    caregiverId: string, 
    seniorEmail: string
  ): Promise<{ 
    success: boolean; 
    relationship?: CaregiverRelationship;
    error?: string 
  }> {
    try {
      const { data, error } = await supabase
        .from('caregiver_relationships')
        .select('*')
        .eq('caregiver_id', caregiverId)
        .eq('senior_email', seniorEmail.trim().toLowerCase())
        .eq('status', 'approved')
        .order('approved_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'No approved access found. Please wait for senior approval.' };
        }
        return { success: false, error: error.message };
      }

      if (!data || data.status !== 'approved') {
        return { success: false, error: 'Access request not approved yet. Please wait for senior approval.' };
      }

      return { success: true, relationship: data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error verifying access' };
    }
  }

  /**
   * Find a senior user by email (helper for lookup)
   */
  static async findSeniorByEmail(email: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      // Query the auth.users table via a function or store relationships in a table
      // Since we can't directly query auth.users, we'll use a profiles table approach
      // For now, we'll use a simple lookup - in production, create a caregiver_relationships table
      
      // Check if we have a profiles table with user info
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single();
      
      if (error) {
        // If profiles table doesn't exist, try to get user via auth admin API (not available client-side)
        // For MVP, we'll use AsyncStorage to store relationships locally
        return { success: false, error: 'Senior user not found. Please ensure the senior has an account.' };
      }
      
      if (data) {
        return { success: true, userId: data.id };
      }
      
      return { success: false, error: 'Senior user not found' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error finding senior user' };
    }
  }

  /**
   * Get senior user ID for a caregiver (only if approved)
   */
  static async getSeniorUserId(caregiverId: string): Promise<{ 
    success: boolean; 
    seniorUserId?: string; 
    seniorEmail?: string;
    relationshipId?: string;
    error?: string 
  }> {
    try {
      const { data, error } = await supabase
        .from('caregiver_relationships')
        .select('senior_id, senior_email, id, status')
        .eq('caregiver_id', caregiverId)
        .eq('status', 'approved')
        .order('approved_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'No approved relationship found' };
        }
        return { success: false, error: 'Relationship not found' };
      }
      
      if (data && data.status === 'approved') {
        return { 
          success: true, 
          seniorUserId: data.senior_id || undefined,
          seniorEmail: data.senior_email,
          relationshipId: data.id
        };
      }
      
      return { success: false, error: 'Relationship not approved' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error retrieving relationship' };
    }
  }

  /**
   * Update senior user ID in relationship after finding it
   */
  static async updateRelationshipWithSeniorId(
    relationshipId: string,
    seniorUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('caregiver_relationships')
        .update({ 
          senior_id: seniorUserId,
          updated_at: new Date().toISOString()
        })
        .eq('id', relationshipId);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error updating relationship' };
    }
  }
}
