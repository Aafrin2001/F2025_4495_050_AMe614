import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Activity, ActivityStats } from '../types';
import { ActivityService } from '../lib/activityService';
import {
  IoArrowBackOutline,
  IoWalkOutline,
  IoFitnessOutline,
  IoFlameOutline,
  IoMoonOutline,
  IoAddCircleOutline,
  IoTimeOutline,
  IoStatsChartOutline,
  IoCheckmarkCircleOutline,
  IoTrashOutline,
  IoStopOutline,
  IoPlayOutline,
  IoCloseOutline
} from 'react-icons/io5';
import './ActivityPage.css';

interface ActivityPageProps {
  user: User;
  userId?: string;
}

const ActivityPage: React.FC<ActivityPageProps> = ({ user, userId }) => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activityType, setActivityType] = useState<'walk' | 'exercise' | 'stairs_climbing' | 'sleep'>('walk');
  const [notes, setNotes] = useState('');
  const [activeTimer, setActiveTimer] = useState<{
    id: string;
    type: string;
    startTime: Date;
    duration: number;
  } | null>(null);

  if (!user) {
    return (
      <div className="activity-page">
        <div className="page-content">
          <div className="empty-state">
            <p>User not found. Please log in again.</p>
          </div>
        </div>
      </div>
    );
  }

  const backPath = user.userType === 'offer' ? '/caregiver-dashboard' : '/dashboard';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) {
        console.warn('No user ID available for loading activities');
        setLoading(false);
        return;
      }

      console.log('Loading activities for user:', targetUserId);
      
      const activitiesPromise = ActivityService.getUserActivities(20, targetUserId);
      const statsPromise = ActivityService.getUserActivityStats(targetUserId);
      
      const [activitiesResult, statsResult] = await Promise.all([
        activitiesPromise,
        statsPromise
      ]);

      console.log('Activities result:', activitiesResult);
      console.log('Stats result:', statsResult);

      if (activitiesResult.success && activitiesResult.data) {
        setActivities(activitiesResult.data);
      } else {
        console.error('Failed to load activities:', activitiesResult.error);
        setActivities([]);
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      } else {
        console.error('Failed to load stats:', statsResult.error);
        setStats(null);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
      setStats(null);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  }, [user?.id, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Timer effect for active activity
  useEffect(() => {
    if (!activeTimer) return;

    const interval = setInterval(() => {
      setActiveTimer(prev => {
        if (!prev) return null;
        const now = new Date();
        const duration = Math.floor((now.getTime() - prev.startTime.getTime()) / 1000);
        return { ...prev, duration };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  const handleStartActivity = () => {
    const id = `activity-${Date.now()}`;
    setActiveTimer({
      id,
      type: activityType,
      startTime: new Date(),
      duration: 0
    });
    setShowAddForm(false);
  };

  const handleStopActivity = async () => {
    if (!activeTimer) return;

    const durationMinutes = activeTimer.duration / 60;
    const calories = ActivityService.calculateCalories(activeTimer.type, durationMinutes);
    const distance = ActivityService.calculateDistance(activeTimer.type, durationMinutes);

    try {
      const startTime = activeTimer.startTime.toISOString();
      const endTime = new Date().toISOString();
      
      const targetUserId = userId || user?.id;
      const result = await ActivityService.saveActivity({
        type: activeTimer.type,
        start_time: startTime,
        end_time: endTime,
        duration: activeTimer.duration,
        calories_burned: calories,
        distance: distance,
        notes: notes.trim() || undefined
      }, targetUserId);

      if (result.success) {
        setActiveTimer(null);
        setNotes('');
        await loadData();
      } else {
        alert('Failed to save activity: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Failed to save activity');
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      const result = await ActivityService.deleteActivity(activityId);
      if (result.success) {
        await loadData();
      } else {
        alert('Failed to delete activity: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Failed to delete activity');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'walk':
        return <IoWalkOutline className="activity-icon" />;
      case 'exercise':
        return <IoFitnessOutline className="activity-icon" />;
      case 'stairs_climbing':
        return <IoFlameOutline className="activity-icon" />;
      case 'sleep':
        return <IoMoonOutline className="activity-icon" />;
      default:
        return <IoFitnessOutline className="activity-icon" />;
    }
  };

  const getActivityName = (type: string) => {
    switch (type) {
      case 'walk':
        return 'Walking';
      case 'exercise':
        return 'Exercise';
      case 'stairs_climbing':
        return 'Stairs Climbing';
      case 'sleep':
        return 'Sleep';
      default:
        return 'Activity';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'walk':
        return '#4CAF50';
      case 'exercise':
        return '#2196F3';
      case 'stairs_climbing':
        return '#FF9800';
      case 'sleep':
        return '#9C27B0';
      default:
        return '#667eea';
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="activity-page">
        <div className="page-header">
          <button onClick={() => navigate(backPath)} className="back-button">
            <IoArrowBackOutline className="back-icon" /> Back
          </button>
          <h1>Activities</h1>
        </div>
        <div className="page-content">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading activities...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-page">
      <div className="page-header">
        <button onClick={() => navigate(backPath)} className="back-button">
          <IoArrowBackOutline className="back-icon" /> Back
        </button>
        <h1>Activities</h1>
        <button onClick={() => setShowAddForm(true)} className="add-activity-button">
          <IoAddCircleOutline className="add-icon" /> Add Activity
        </button>
      </div>

      <div className="page-content">
        {/* Active Activity Timer */}
        {activeTimer && (
          <div className="active-timer-card" style={{ borderLeftColor: getActivityColor(activeTimer.type) }}>
            <div className="timer-header">
              <div className="timer-icon" style={{ color: getActivityColor(activeTimer.type) }}>
                {getActivityIcon(activeTimer.type)}
              </div>
              <div className="timer-info">
                <h3>{getActivityName(activeTimer.type)}</h3>
                <p className="timer-duration">{formatDuration(activeTimer.duration)}</p>
              </div>
            </div>
            <button onClick={handleStopActivity} className="stop-button">
              <IoStopOutline /> Stop Activity
            </button>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="stats-container">
            <div className="stat-card">
              <IoStatsChartOutline className="stat-icon" />
              <div className="stat-content">
                <p className="stat-value">{stats.totalActivities || 0}</p>
                <p className="stat-label">Total Activities</p>
              </div>
            </div>
            <div className="stat-card">
              <IoFlameOutline className="stat-icon" />
              <div className="stat-content">
                <p className="stat-value">{Math.round(stats.totalCaloriesBurned || 0)}</p>
                <p className="stat-label">Calories Burned</p>
              </div>
            </div>
            <div className="stat-card">
              <IoTimeOutline className="stat-icon" />
              <div className="stat-content">
                <p className="stat-value">{formatDuration(stats.totalDuration || 0)}</p>
                <p className="stat-label">Total Duration</p>
              </div>
            </div>
            <div className="stat-card">
              <IoWalkOutline className="stat-icon" />
              <div className="stat-content">
                <p className="stat-value">{(stats.totalDistance || 0).toFixed(1)}</p>
                <p className="stat-label">Distance (km)</p>
              </div>
            </div>
          </div>
        )}

        {/* Activities List */}
        <div className="activities-section">
          <h2 className="section-title">Recent Activities</h2>
          {activities.length === 0 ? (
            <div className="empty-state">
              <IoFitnessOutline className="empty-icon" />
              <p>No activities recorded yet</p>
              <button onClick={() => setShowAddForm(true)} className="empty-action-button">
                <IoAddCircleOutline /> Add Your First Activity
              </button>
            </div>
          ) : (
            <div className="activities-list">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="activity-card"
                  style={{ borderLeftColor: getActivityColor(activity.type) }}
                >
                  <div className="activity-icon-wrapper" style={{ backgroundColor: `${getActivityColor(activity.type)}20` }}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="activity-content">
                    <div className="activity-header">
                      <h3>{getActivityName(activity.type)}</h3>
                      <button
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="delete-button"
                        title="Delete activity"
                      >
                        <IoTrashOutline />
                      </button>
                    </div>
                    <div className="activity-details">
                      <div className="activity-detail-item">
                        <IoTimeOutline className="detail-icon" />
                        <span>{formatDuration(activity.duration)}</span>
                      </div>
                      {activity.calories_burned > 0 && (
                        <div className="activity-detail-item">
                          <IoFlameOutline className="detail-icon" />
                          <span>{Math.round(activity.calories_burned)} cal</span>
                        </div>
                      )}
                      {activity.distance > 0 && (
                        <div className="activity-detail-item">
                          <IoWalkOutline className="detail-icon" />
                          <span>{activity.distance.toFixed(2)} km</span>
                        </div>
                      )}
                    </div>
                    {activity.notes && (
                      <p className="activity-notes">{activity.notes}</p>
                    )}
                    <p className="activity-date">{formatDate(activity.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Activity Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Start Activity</h2>
              <button onClick={() => setShowAddForm(false)} className="close-button">
                <IoCloseOutline />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Activity Type</label>
                <div className="activity-type-buttons">
                  {(['walk', 'exercise', 'stairs_climbing', 'sleep'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setActivityType(type)}
                      className={`activity-type-button ${activityType === type ? 'active' : ''}`}
                      style={{
                        borderColor: getActivityColor(type),
                        backgroundColor: activityType === type ? getActivityColor(type) : 'transparent'
                      }}
                    >
                      {getActivityIcon(type)}
                      <span>{getActivityName(type)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="notes">Notes (Optional)</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this activity..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddForm(false)} className="cancel-button">
                Cancel
              </button>
              <button onClick={handleStartActivity} className="start-button">
                <IoPlayOutline /> Start Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
