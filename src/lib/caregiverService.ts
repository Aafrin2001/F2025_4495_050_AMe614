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
   * If a rejected relationship exists, it will be updated to pending
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
      // First, check if a relationship already exists (pending, approved, or rejected)
      const { data: existingRelationship, error: checkError } = await supabase
        .from('caregiver_relationships')
        .select('id, status')
        .eq('caregiver_id', caregiverId)
        .eq('senior_email', seniorEmail.trim().toLowerCase())
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is fine
        console.error('Error checking existing relationship:', checkError);
      }

      // Generate a verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // If a relationship exists
      if (existingRelationship) {
        // If it's already pending or approved, don't allow a new request
        if (existingRelationship.status === 'pending') {
          return {
            success: false,
            error: 'A request for this senior is already pending. Please wait for approval.'
          };
        }

        if (existingRelationship.status === 'approved') {
          return {
            success: false,
            error: 'You already have approved access to this senior account.'
          };
        }

        // If it's rejected, update it to pending with a new verification code
        if (existingRelationship.status === 'rejected') {
          // Try to update - if RLS blocks it, we'll get an error
          const { data, error } = await supabase
            .from('caregiver_relationships')
            .update({
              status: 'pending',
              verification_code: verificationCode,
              requested_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              senior_id: null, // Clear senior_id if it was set
              approved_at: null, // Clear approved_at
            })
            .eq('id', existingRelationship.id)
            .eq('caregiver_id', caregiverId) // Ensure we're updating our own relationship
            .select();

          if (error) {
            console.error('Error updating rejected relationship:', error);
            // If RLS blocks the update, try using upsert instead
            // Delete the old one and create a new one
            const { error: deleteError } = await supabase
              .from('caregiver_relationships')
              .delete()
              .eq('id', existingRelationship.id)
              .eq('caregiver_id', caregiverId);

            if (deleteError) {
              return { 
                success: false, 
                error: 'Unable to resubmit request. Please contact support.' 
              };
            }

            // Now insert a new one
            const { data: newData, error: insertError } = await supabase
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

            if (insertError) {
              return { success: false, error: insertError.message };
            }

            return {
              success: true,
              relationshipId: newData.id,
              verificationCode
            };
          }

          if (!data || data.length === 0) {
            // Update didn't return any rows, try delete + insert approach
            const { error: deleteError } = await supabase
              .from('caregiver_relationships')
              .delete()
              .eq('id', existingRelationship.id)
              .eq('caregiver_id', caregiverId);

            if (deleteError) {
              return { 
                success: false, 
                error: 'Unable to resubmit request. Please contact support.' 
              };
            }

            const { data: newData, error: insertError } = await supabase
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

            if (insertError) {
              return { success: false, error: insertError.message };
            }

            return {
              success: true,
              relationshipId: newData.id,
              verificationCode
            };
          }

          return {
            success: true,
            relationshipId: data[0]?.id || existingRelationship.id,
            verificationCode
          };
        }
      }

      // No existing relationship, create a new one
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
        
        // Check if relationship already exists (shouldn't happen now, but as fallback)
        if (error.code === '23505') {
          // Try to update if it's rejected
          const { data: existing } = await supabase
            .from('caregiver_relationships')
            .select('id, status')
            .eq('caregiver_id', caregiverId)
            .eq('senior_email', seniorEmail.trim().toLowerCase())
            .maybeSingle();

          if (existing && existing.status === 'rejected') {
            // Update rejected to pending
            const { data: updated, error: updateError } = await supabase
              .from('caregiver_relationships')
              .update({
                status: 'pending',
                verification_code: verificationCode,
                requested_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                senior_id: null,
                approved_at: null,
              })
              .eq('id', existing.id)
              .select()
              .single();

            if (updateError) {
              return { success: false, error: updateError.message };
            }

            return {
              success: true,
              relationshipId: updated.id,
              verificationCode
            };
          }

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
   * Uses a database function to bypass RLS issues
   */
  static async rejectRequest(relationshipId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First, verify the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

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
        .eq('id', relationshipId);

      if (error) {
        console.error('Error rejecting relationship:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to reject request. Please run the SQL fix in Supabase.' 
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in rejectRequest:', error);
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

  /**
   * Get all caregiver relationships (for admin/viewing purposes)
   * @param status - Optional: filter by status ('pending', 'approved', 'rejected')
   * @param userId - Optional: filter by caregiver_id or senior_id
   */
  static async getAllRelationships(
    status?: 'pending' | 'approved' | 'rejected',
    userId?: string
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

      // Filter by status if provided
      if (status) {
        query = query.eq('status', status);
      }

      // Filter by user ID if provided (check both caregiver_id and senior_id)
      if (userId) {
        query = query.or(`caregiver_id.eq.${userId},senior_id.eq.${userId}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching relationships:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error fetching relationships:', error);
      return { success: false, error: error.message || 'Error fetching relationships' };
    }
  }

  /**
   * Get relationships for a specific senior (by email or ID)
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
        query = query.eq('senior_email', seniorEmail.toLowerCase().trim());
      } else {
        return { success: false, error: 'Either seniorEmail or seniorId must be provided' };
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
   * Get relationships for a specific caregiver
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
}
