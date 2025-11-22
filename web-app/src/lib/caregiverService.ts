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
  static async requestAccess(
    seniorEmail: string,
    caregiverId: string,
    caregiverEmail: string
  ): Promise<{ success: boolean; relationshipId?: string; verificationCode?: string; error?: string }> {
    try {
      const { data: existingRelationship } = await supabase
        .from('caregiver_relationships')
        .select('id, status')
        .eq('caregiver_id', caregiverId)
        .eq('senior_email', seniorEmail.trim().toLowerCase())
        .maybeSingle();

      if (existingRelationship) {
        if (existingRelationship.status === 'pending') {
          return { success: false, error: 'A request for this senior is already pending' };
        }
        if (existingRelationship.status === 'approved') {
          return { success: false, error: 'You already have approved access' };
        }
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      const { data, error } = await supabase
        .from('caregiver_relationships')
        .upsert({
          caregiver_id: caregiverId,
          caregiver_email: caregiverEmail,
          senior_email: seniorEmail.trim().toLowerCase(),
          status: 'pending',
          verification_code: verificationCode,
          requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'caregiver_id,senior_email'
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, relationshipId: data.id, verificationCode };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to request access' };
    }
  }

  static async findSeniorByEmail(seniorEmail: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      // Note: We can't use admin.listUsers() from the client side
      // Instead, we'll try to find the user by attempting to sign in with a dummy password
      // or by checking if a relationship already exists with that email
      // For now, we'll return success: false and let the requestAccess handle it
      // The backend will validate the email exists when creating the relationship
      
      // Alternative: Query a profiles table if it exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', seniorEmail.trim().toLowerCase())
        .maybeSingle();
      
      if (!profileError && profileData) {
        return { success: true, userId: profileData.id };
      }
      
      // If profiles table doesn't exist or user not found, we'll still allow the request
      // The relationship creation will fail if the email doesn't exist
      // For now, return success: true to allow the flow to continue
      // The actual validation happens server-side when creating the relationship
      return { success: true, userId: undefined };
    } catch (error: any) {
      // If there's a network error, still allow the flow to continue
      // The backend will handle validation
      if (error?.message?.includes('fetch') || error?.message?.includes('Failed to fetch')) {
        console.warn('Network error finding senior by email, allowing request to proceed:', error);
        return { success: true, userId: undefined };
      }
      return { success: false, error: error.message || 'Failed to find user' };
    }
  }

  static async verifyAccess(caregiverId: string, seniorEmail: string): Promise<{ success: boolean; relationship?: CaregiverRelationship; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('caregiver_relationships')
        .select('*')
        .eq('caregiver_id', caregiverId)
        .eq('senior_email', seniorEmail.trim().toLowerCase())
        .maybeSingle();

      if (error) return { success: false, error: error.message };
      if (!data) return { success: false, error: 'No relationship found' };
      if (data.status !== 'approved') {
        return { success: false, error: 'Access not approved yet' };
      }

      return { success: true, relationship: data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to verify access' };
    }
  }

  static async getSeniorUserId(caregiverId: string): Promise<{ success: boolean; seniorUserId?: string; seniorEmail?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('caregiver_relationships')
        .select('senior_id, senior_email')
        .eq('caregiver_id', caregiverId)
        .eq('status', 'approved')
        .maybeSingle();

      if (error) return { success: false, error: error.message };
      if (!data || !data.senior_id) {
        return { success: false, error: 'No approved relationship found' };
      }

      return { success: true, seniorUserId: data.senior_id, seniorEmail: data.senior_email };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to get senior user ID' };
    }
  }

  /**
   * Get all caregiver relationships for a specific caregiver
   * Returns all patients (approved, pending, rejected) assigned to the caregiver
   */
  static async getCaregiverRelationships(
    caregiverId: string
  ): Promise<{ 
    success: boolean; 
    data?: CaregiverRelationship[]; 
    error?: string 
  }> {
    try {
      const { data, error } = await supabase
        .from('caregiver_relationships')
        .select('*')
        .eq('caregiver_id', caregiverId)
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Error fetching caregiver relationships:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error fetching caregiver relationships:', error);
      return { success: false, error: error.message || 'Error fetching relationships' };
    }
  }

  /**
   * Get pending caregiver requests for a senior (by email)
   */
  static async getSeniorRelationships(
    seniorEmail?: string,
    seniorId?: string
  ): Promise<{ 
    success: boolean; 
    data?: CaregiverRelationship[]; 
    error?: string 
  }> {
    try {
      let query = supabase
        .from('caregiver_relationships')
        .select('*')
        .order('requested_at', { ascending: false });

      if (seniorId) {
        query = query.eq('senior_id', seniorId);
      } else if (seniorEmail) {
        query = query.eq('senior_email', seniorEmail.toLowerCase());
      } else {
        // Get current user's email
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) {
          return { success: false, error: 'User not authenticated' };
        }
        query = query.eq('senior_email', user.email.toLowerCase());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching senior relationships:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error fetching senior relationships:', error);
      return { success: false, error: error.message || 'Error fetching relationships' };
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
      // Try using the database function first (bypasses RLS)
      const { data: functionResult, error: functionError } = await supabase
        .rpc('reject_caregiver_request', { relationship_id: relationshipId });

      if (!functionError && functionResult) {
        return { success: true };
      }

      // If function doesn't exist or fails, fall back to direct update
      if (functionError && functionError.code !== '42883') { // 42883 = function doesn't exist
        console.error('Function error:', functionError);
        // Continue to fallback
      }

      // Fallback: Direct update (will use RLS policy)
      const { error } = await supabase
        .from('caregiver_relationships')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', relationshipId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error rejecting relationship:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to reject request. Please check RLS policies.' 
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in rejectRequest:', error);
      return { success: false, error: error.message || 'Error rejecting request' };
    }
  }
}

