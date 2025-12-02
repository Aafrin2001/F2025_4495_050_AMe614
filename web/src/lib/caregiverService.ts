import { supabase } from './supabase';
import { CaregiverRelationship } from '../types';

export class CaregiverService {
  /**
   * Find senior user by email
   */
  static async findSeniorByEmail(seniorEmail: string): Promise<{ success: boolean; seniorId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', seniorEmail.trim().toLowerCase())
        .single();

      if (error || !data) {
        return { success: false, error: 'Senior user not found with this email' };
      }

      return { success: true, seniorId: data.id };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error finding senior user' };
    }
  }

  /**
   * Request caregiver access
   */
  static async requestAccess(
    seniorEmail: string,
    caregiverId: string,
    caregiverEmail: string
  ): Promise<{
    success: boolean;
    relationshipId?: string;
    verificationCode?: string;
    error?: string;
  }> {
    try {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
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
        return { success: false, error: error.message };
      }

      return {
        success: true,
        relationshipId: data.id,
        verificationCode,
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error creating access request' };
    }
  }

  /**
   * Get senior user ID for a caregiver
   */
  static async getSeniorUserId(caregiverId: string): Promise<{
    success: boolean;
    seniorUserId?: string;
    seniorEmail?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('caregiver_relationships')
        .select('senior_id, senior_email')
        .eq('caregiver_id', caregiverId)
        .eq('status', 'approved')
        .single();

      if (error || !data) {
        return { success: false, error: 'No approved relationship found' };
      }

      return {
        success: true,
        seniorUserId: data.senior_id,
        seniorEmail: data.senior_email,
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error fetching relationship' };
    }
  }

  /**
   * Verify access (check if already approved)
   */
  static async verifyAccess(
    caregiverId: string,
    seniorEmail: string
  ): Promise<{
    success: boolean;
    relationship?: CaregiverRelationship;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('caregiver_relationships')
        .select('*')
        .eq('caregiver_id', caregiverId)
        .eq('senior_email', seniorEmail.trim().toLowerCase())
        .single();

      if (error || !data) {
        return { success: false, error: 'Relationship not found' };
      }

      return {
        success: true,
        relationship: data as CaregiverRelationship,
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error verifying access' };
    }
  }

  /**
   * Approve caregiver request
   */
  static async approveRequest(
    relationshipId: string,
    verificationCode: string,
    seniorId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('caregiver_relationships')
        .update({
          status: 'approved',
          senior_id: seniorId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', relationshipId)
        .eq('verification_code', verificationCode)
        .eq('status', 'pending');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error approving request' };
    }
  }

  /**
   * Reject caregiver request
   */
  static async rejectRequest(relationshipId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('caregiver_relationships')
        .update({ status: 'rejected' })
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
   * Get pending requests for a senior
   */
  static async getPendingRequests(seniorEmail: string): Promise<{
    success: boolean;
    requests?: CaregiverRelationship[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('caregiver_relationships')
        .select('*')
        .eq('senior_email', seniorEmail.trim().toLowerCase())
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        requests: data as CaregiverRelationship[],
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error fetching pending requests' };
    }
  }
}

