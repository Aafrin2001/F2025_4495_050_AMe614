import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../utils/icons';
import { MedicationService } from '../lib/medicationService';
import { Medication, MedicationInput, MedicationScheduleItem, MedicationStats, User } from '../types';
import { useFontSize } from '../contexts/FontSizeContext';
import './MedicationScreen.css';

interface MedicationScreenProps {
  user: User | null;
}

const MedicationScreen: React.FC<MedicationScreenProps> = ({ user }) => {
  const navigate = useNavigate();
  const { getFontSize } = useFontSize();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [stats, setStats] = useState<MedicationStats | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<MedicationScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [formData, setFormData] = useState<MedicationInput>({
    name: '',
    dosage: '',
    type: 'pill',
    frequency: '',
    time: [],
    instruction: '',
    doctor: '',
    pharmacy: '',
    refill_date: '',
    side_effects: '',
    is_active: true,
    is_daily: true,
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
      const interval = setInterval(() => {
        if (user) {
          loadTodaySchedule();
          loadStats();
        }
      }, 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadMedications(), loadStats(), loadTodaySchedule()]);
    setLoading(false);
  };

  const loadMedications = async () => {
    const { success, data, error } = await MedicationService.getUserMedications();
    if (success && data) {
      setMedications(data);
    } else {
      alert(error || 'Failed to load medications');
    }
  };

  const loadStats = async () => {
    const { success, data, error } = await MedicationService.getMedicationStats();
    if (success && data) {
      setStats(data);
    }
  };

  const loadTodaySchedule = async () => {
    const { success, data, error } = await MedicationService.getTodaySchedule();
    if (success && data) {
      setTodaySchedule(data);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', dosage: '', type: 'pill', frequency: '', time: [], instruction: '',
      doctor: '', pharmacy: '', refill_date: '', side_effects: '', is_active: true, is_daily: true,
    });
    setFormErrors([]);
  };

  const handleAddMedication = async () => {
    const validation = MedicationService.validateMedicationInput(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }
    setFormErrors([]);
    if (!user) {
      alert('User not authenticated.');
      return;
    }
    const medicationToSave: MedicationInput = {
      ...formData,
      time: formData.is_daily ? formData.time : [],
      refill_date: formData.refill_date || undefined,
      instruction: formData.instruction?.trim() || undefined,
      doctor: formData.doctor?.trim() || undefined,
      pharmacy: formData.pharmacy?.trim() || undefined,
      side_effects: formData.side_effects?.trim() || undefined,
    };
    let result;
    if (editingMedication) {
      result = await MedicationService.updateMedication(editingMedication.id, medicationToSave);
    } else {
      result = await MedicationService.saveMedication(medicationToSave);
    }
    if (result.success) {
      alert(`Medication ${editingMedication ? 'updated' : 'added'} successfully!`);
      setShowAddEditModal(false);
      setEditingMedication(null);
      resetForm();
      loadData();
    } else {
      alert(result.error || `Failed to ${editingMedication ? 'update' : 'add'} medication.`);
    }
  };

  const handleEditMedication = (medication: Medication) => {
    setEditingMedication(medication);
    setFormData({
      name: medication.name, dosage: medication.dosage, type: medication.type,
      frequency: medication.frequency, time: medication.time,
      instruction: medication.instruction || '', doctor: medication.doctor || '',
      pharmacy: medication.pharmacy || '', refill_date: medication.refill_date || '',
      side_effects: medication.side_effects || '', is_active: medication.is_active,
      is_daily: medication.is_daily,
    });
    setFormErrors([]);
    setShowAddEditModal(true);
  };

  const handleDeleteMedication = (medicationId: string) => {
    if (confirm('Are you sure you want to delete this medication?')) {
      MedicationService.deleteMedication(medicationId).then(({ success, error }) => {
        if (success) {
          alert('Medication deleted successfully!');
          loadData();
        } else {
          alert(error || 'Failed to delete medication.');
        }
      });
    }
  };

  const addTimeSlot = () => {
    setEditingTimeIndex(null);
    setShowTimePicker(true);
  };

  const removeTimeSlot = (index: number) => {
    setFormData({ ...formData, time: formData.time.filter((_, i) => i !== index) });
  };

  const fontSizeStyles = {
    headerTitle: { fontSize: getFontSize(24) },
    sectionTitle: { fontSize: getFontSize(18) },
  };

  if (loading) {
    return (
      <div className="medication-container">
        <div className="medication-loading">
          <div className="medication-spinner"></div>
          <div>Loading medications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="medication-container">
      <div className="medication-header">
        <button onClick={() => navigate('/main')} className="medication-back-button">
          <Icon name="arrow-back" size={24} />
        </button>
        <div className="medication-header-title" style={fontSizeStyles.headerTitle}>Medications</div>
      </div>

      <div className="medication-content">
        <div className="medication-stats-container">
          <div className="medication-section-title" style={fontSizeStyles.sectionTitle}>Overview</div>
          <div className="medication-stats-grid">
            <div className="medication-stat-card">
              <div className="medication-stat-value">{stats?.totalMedications || 0}</div>
              <div className="medication-stat-label">Total Drugs</div>
            </div>
            <div className="medication-stat-card">
              <div className="medication-stat-value">{stats?.activeDailyMedications || 0}</div>
              <div className="medication-stat-label">Daily Drugs</div>
            </div>
            <div className="medication-stat-card">
              <div className="medication-stat-value">{stats?.activePrnMedications || 0}</div>
              <div className="medication-stat-label">PRN Drugs</div>
            </div>
            <div className="medication-stat-card">
              <div className="medication-stat-value">{stats?.totalReminders || 0}</div>
              <div className="medication-stat-label">Reminders</div>
            </div>
          </div>
        </div>

        <button
          className="medication-add-button"
          onClick={() => {
            resetForm();
            setShowAddEditModal(true);
          }}
        >
          <Icon name="add" size={24} />
          <span>Add Medication</span>
        </button>

        <div className="medication-medications-container">
          <div className="medication-section-title" style={fontSizeStyles.sectionTitle}>All Medications</div>
          {medications.length === 0 ? (
            <div className="medication-empty">
              <Icon name="medical-outline" size={48} color="rgba(255, 255, 255, 0.5)" />
              <div>No medications added yet</div>
            </div>
          ) : (
            medications.map(medication => (
              <div key={medication.id} className="medication-card">
                <div className="medication-card-header">
                  <div className="medication-card-info">
                    <div className="medication-name">{medication.name}</div>
                    <div className="medication-dosage">{medication.dosage}</div>
                    <div className="medication-frequency">{medication.frequency}</div>
                  </div>
                  <div className="medication-card-actions">
                    <button onClick={() => handleEditMedication(medication)} className="medication-edit-button">
                      <Icon name="pencil" size={16} color="#4CAF50" />
                    </button>
                    <button onClick={() => handleDeleteMedication(medication.id)} className="medication-delete-button">
                      <Icon name="trash-outline" size={16} color="#FF6B6B" />
                    </button>
                  </div>
                </div>
                {medication.is_daily && medication.time.length > 0 && (
                  <div className="medication-times">
                    <div className="medication-times-label">Times:</div>
                    <div className="medication-times-container">
                      {medication.time.map((time, index) => (
                        <div key={index} className="medication-time-chip">
                          {MedicationService.formatTime(time)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddEditModal && (
        <div className="medication-modal-overlay" onClick={() => setShowAddEditModal(false)}>
          <div className="medication-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="medication-modal-header">
              <div className="medication-modal-title">
                {editingMedication ? 'Edit Medication' : 'Add New Medication'}
              </div>
              <button onClick={() => setShowAddEditModal(false)} className="medication-modal-close">
                <Icon name="close" size={24} />
              </button>
            </div>

            <div className="medication-modal-form-content">
              {formErrors.length > 0 && (
                <div className="medication-error-container">
                  {formErrors.map((error, index) => (
                    <div key={index} className="medication-error-text">• {error}</div>
                  ))}
                </div>
              )}

              <div className="medication-form-group">
                <label>Medication Name *</label>
                <input
                  className="medication-modal-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Metformin"
                />
              </div>

              <div className="medication-form-group">
                <label>Dosage *</label>
                <input
                  className="medication-modal-input"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="e.g., 500mg"
                />
              </div>

              <div className="medication-form-group">
                <label>Frequency *</label>
                <input
                  className="medication-modal-input"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  placeholder="e.g., Twice daily"
                />
              </div>

              {formData.is_daily && (
                <div className="medication-form-group">
                  <label>Times *</label>
                  <div className="medication-times-input-container">
                    {formData.time.map((time, index) => (
                      <div key={index} className="medication-time-input-row">
                        <button
                          className="medication-time-input-button"
                          onClick={() => {
                            setEditingTimeIndex(index);
                            setShowTimePicker(true);
                          }}
                        >
                          <span>{MedicationService.formatTime(time)}</span>
                          <Icon name="time-outline" size={16} />
                        </button>
                        <button
                          className="medication-remove-time-button"
                          onClick={() => removeTimeSlot(index)}
                        >
                          <Icon name="close" size={16} color="#FF6B6B" />
                        </button>
                      </div>
                    ))}
                    <button className="medication-add-time-button" onClick={addTimeSlot}>
                      <Icon name="add" size={16} color="#4CAF50" />
                      <span>Add Time</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="medication-modal-buttons">
                <button onClick={() => setShowAddEditModal(false)} className="medication-modal-button medication-modal-cancel">
                  Cancel
                </button>
                <button onClick={handleAddMedication} className="medication-modal-button medication-modal-save">
                  {editingMedication ? 'Update' : 'Add'} Medication
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <div className="medication-modal-overlay" onClick={() => setShowTimePicker(false)}>
          <div className="medication-picker-content" onClick={(e) => e.stopPropagation()}>
            <div className="medication-picker-header">
              <div className="medication-picker-title">Select Time</div>
              <button onClick={() => setShowTimePicker(false)} className="medication-modal-close">
                <Icon name="close" size={24} />
              </button>
            </div>
            <div className="medication-picker-options">
              {Array.from({ length: 24 }, (_, hour) => 
                Array.from({ length: 4 }, (_, minuteIndex) => {
                  const minute = minuteIndex * 15;
                  const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                  return (
                    <button
                      key={timeString}
                      className="medication-picker-option"
                      onClick={() => {
                        if (editingTimeIndex !== null) {
                          const newTimes = [...formData.time];
                          newTimes[editingTimeIndex] = timeString;
                          setFormData({ ...formData, time: newTimes });
                        } else {
                          setFormData({ ...formData, time: [...formData.time, timeString] });
                        }
                        setShowTimePicker(false);
                        setEditingTimeIndex(null);
                      }}
                    >
                      {MedicationService.formatTime(timeString)}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationScreen;

