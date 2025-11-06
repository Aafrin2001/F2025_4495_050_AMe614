import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../utils/icons';
import { healthMetricsService } from '../lib/healthMetrics';
import { HealthMetricInput, HealthMetricsSummary, User } from '../types';
import { useFontSize } from '../contexts/FontSizeContext';
import './HealthMonitoringScreen.css';

interface HealthMonitoringScreenProps {
  user: User | null;
}

interface VitalSign {
  id: string;
  name: string;
  metric_type: 'blood_pressure' | 'heart_rate' | 'body_temperature' | 'weight' | 'blood_sugar' | 'oxygen_level';
  value: string;
  unit: string;
  icon: string;
  color: string;
  lastUpdated?: string;
}

const HealthMonitoringScreen: React.FC<HealthMonitoringScreenProps> = ({ user }) => {
  const navigate = useNavigate();
  const { getFontSize } = useFontSize();
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([
    { id: '1', name: 'Blood Pressure', metric_type: 'blood_pressure', value: '--/--', unit: 'mmHg', icon: 'heart-outline', color: '#FF6B6B' },
    { id: '2', name: 'Heart Rate', metric_type: 'heart_rate', value: '--', unit: 'bpm', icon: 'heart-outline', color: '#4ECDC4' },
    { id: '3', name: 'Body Temperature', metric_type: 'body_temperature', value: '--', unit: '°F', icon: 'heart-outline', color: '#45B7D1' },
    { id: '4', name: 'Weight', metric_type: 'weight', value: '--', unit: 'lbs', icon: 'heart-outline', color: '#96CEB4' },
    { id: '5', name: 'Blood Sugar', metric_type: 'blood_sugar', value: '--', unit: 'mg/dL', icon: 'heart-outline', color: '#FFEAA7' },
    { id: '6', name: 'Oxygen Level', metric_type: 'oxygen_level', value: '--', unit: '%', icon: 'heart-outline', color: '#DDA0DD' },
  ]);
  const [selectedVital, setSelectedVital] = useState<VitalSign | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddReading, setShowAddReading] = useState(false);
  const [newReading, setNewReading] = useState<HealthMetricInput>({
    metric_type: 'heart_rate',
    value: 0,
    unit: 'bpm',
    notes: ''
  });

  useEffect(() => {
    if (user?.id) {
      loadLatestMetrics();
    }
  }, [user?.id]);

  const loadLatestMetrics = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data: summary, error } = await healthMetricsService.getLatestMetrics(user.id);
      if (error) {
        console.error('Error loading metrics:', error);
        return;
      }
      if (summary) {
        updateVitalSignsWithData(summary);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateVitalSignsWithData = (summary: HealthMetricsSummary) => {
    setVitalSigns(prevVitals =>
      prevVitals.map(vital => {
        const metric = summary[vital.metric_type];
        if (metric) {
          let displayValue = '';
          if (vital.metric_type === 'blood_pressure' && metric.systolic && metric.diastolic) {
            displayValue = `${metric.systolic}/${metric.diastolic}`;
          } else {
            displayValue = metric.value.toString();
          }
          return {
            ...vital,
            value: displayValue,
            lastUpdated: new Date(metric.recorded_at).toLocaleDateString()
          };
        }
        return vital;
      })
    );
  };

  const handleVitalPress = (vital: VitalSign) => {
    setSelectedVital(vital);
    setNewReading({
      metric_type: vital.metric_type,
      value: 0,
      unit: vital.unit,
      notes: ''
    });
  };

  const handleSaveMetric = async () => {
    if (!selectedVital || !user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await healthMetricsService.saveMetric(user.id, newReading);
      if (error) {
        alert(error.message || 'Failed to save metric');
        return;
      }
      if (data) {
        alert('Health metric saved successfully!');
        setSelectedVital(null);
        loadLatestMetrics();
      }
    } catch (error) {
      alert('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fontSizeStyles = {
    headerTitle: { fontSize: getFontSize(24) },
    sectionTitle: { fontSize: getFontSize(18) },
    vitalName: { fontSize: getFontSize(16) },
    vitalValue: { fontSize: getFontSize(20) },
  };

  return (
    <div className="health-container">
      <div className="health-header">
        <button onClick={() => navigate('/main')} className="health-back-button">
          <Icon name="arrow-back" size={24} />
        </button>
        <div className="health-header-title" style={fontSizeStyles.headerTitle}>Health Monitoring</div>
        <div className="health-header-spacer"></div>
      </div>

      <div className="health-content">
        <div className="health-summary-card">
          <div className="health-summary-title" style={fontSizeStyles.sectionTitle}>Health Summary</div>
          <div className="health-summary-stats">
            <div className="health-stat-item">
              <div className="health-stat-number">{vitalSigns.filter(v => v.value !== '--' && v.value !== '--/--').length}</div>
              <div className="health-stat-label">Metrics Tracked</div>
            </div>
          </div>
        </div>

        <div className="health-vitals-grid">
          {vitalSigns.map(vital => (
            <button
              key={vital.id}
              className="health-vital-card"
              onClick={() => handleVitalPress(vital)}
              style={{ borderLeftColor: vital.color }}
            >
              <Icon name={vital.icon} size={32} color={vital.color} />
              <div className="health-vital-name" style={fontSizeStyles.vitalName}>{vital.name}</div>
              <div className="health-vital-value" style={fontSizeStyles.vitalValue}>
                {vital.value} <span className="health-vital-unit">{vital.unit}</span>
              </div>
              {vital.lastUpdated && (
                <div className="health-vital-updated">Updated: {vital.lastUpdated}</div>
              )}
            </button>
          ))}
        </div>

        <button
          className="health-add-reading-button"
          onClick={() => setShowAddReading(true)}
        >
          <Icon name="add" size={24} />
          <span>Add New Reading</span>
        </button>
      </div>

      {/* Input Modal */}
      {selectedVital && (
        <div className="health-modal-overlay" onClick={() => setSelectedVital(null)}>
          <div className="health-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="health-modal-header">
              <div className="health-modal-title">Record {selectedVital.name}</div>
              <button onClick={() => setSelectedVital(null)} className="health-modal-close">
                <Icon name="close" size={24} />
              </button>
            </div>

            {selectedVital.metric_type === 'blood_pressure' ? (
              <div className="health-modal-form">
                <div className="health-form-group">
                  <label>Systolic (Top Number)</label>
                  <input
                    type="number"
                    placeholder="120"
                    value={newReading.systolic || ''}
                    onChange={(e) => setNewReading({ ...newReading, systolic: parseInt(e.target.value) || 0 })}
                    className="health-modal-input"
                  />
                </div>
                <div className="health-form-group">
                  <label>Diastolic (Bottom Number)</label>
                  <input
                    type="number"
                    placeholder="80"
                    value={newReading.diastolic || ''}
                    onChange={(e) => setNewReading({ ...newReading, diastolic: parseInt(e.target.value) || 0 })}
                    className="health-modal-input"
                  />
                </div>
              </div>
            ) : (
              <div className="health-modal-form">
                <div className="health-form-group">
                  <label>Value</label>
                  <input
                    type="number"
                    placeholder="Enter value"
                    value={newReading.value || ''}
                    onChange={(e) => setNewReading({ ...newReading, value: parseFloat(e.target.value) || 0 })}
                    className="health-modal-input"
                  />
                </div>
              </div>
            )}

            <div className="health-modal-form">
              <div className="health-form-group">
                <label>Notes (Optional)</label>
                <textarea
                  placeholder="Add any notes..."
                  value={newReading.notes || ''}
                  onChange={(e) => setNewReading({ ...newReading, notes: e.target.value })}
                  className="health-modal-textarea"
                  rows={3}
                />
              </div>
            </div>

            <div className="health-modal-buttons">
              <button onClick={() => setSelectedVital(null)} className="health-modal-button health-modal-cancel">
                Cancel
              </button>
              <button onClick={handleSaveMetric} className="health-modal-button health-modal-save" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthMonitoringScreen;

