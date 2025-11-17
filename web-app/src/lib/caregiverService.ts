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
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) {
        // Fallback: try querying profiles table if it exists
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', seniorEmail.trim().toLowerCase())
          .maybeSingle();
        
        if (profileData) {
          return { success: true, userId: profileData.id };
        }
        return { success: false, error: 'Could not find user' };
      }

      const user = data.users.find(u => u.email?.toLowerCase() === seniorEmail.trim().toLowerCase());
      if (user) {
        return { success: true, userId: user.id };
      }
      return { success: false, error: 'User not found' };
    } catch (error: any) {
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
}

