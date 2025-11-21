import React, { useState, useEffect } from 'react'
import './ActivityScreen.css'
import { Activity, ActivityInput, ActivityStats, User } from '../types'
import { ActivityService } from '../lib/activityService'
import { format, formatDistanceToNow, startOfWeek, startOfMonth, endOfWeek, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns'

interface ActivityScreenProps {
  onBack: () => void
  user: User | null
}

const ActivityScreen: React.FC<ActivityScreenProps> = ({ onBack, user }) => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [activityType, setActivityType] = useState<'walk' | 'exercise' | 'stairs_climbing' | 'sleep'>('walk')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [notes, setNotes] = useState('')
  const [sleepQuality, setSleepQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('good')

  // Load activities and stats on mount
  useEffect(() => {
    if (user?.id) {
      loadActivities()
      loadStats()
    }
  }, [user?.id])

  const loadActivities = async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    setError(null)
    try {
      const result = await ActivityService.getUserActivities(50, user.id)
      
      if (!result.success) {
        setError(result.error || 'Failed to load activities')
        return
      }

      if (result.data) {
        setActivities(result.data)
        setLastSyncTime(new Date())
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    if (!user?.id) return
    
    try {
      const result = await ActivityService.getUserActivityStats(user.id)
      
      if (!result.success) {
        console.error('Failed to load stats:', result.error)
        return
      }

      if (result.data) {
        setStats(result.data)
      }
    } catch (err: any) {
      console.error('Error loading stats:', err)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([loadActivities(), loadStats()])
    setIsRefreshing(false)
  }

  const handleAddActivity = async () => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    const duration = parseFloat(durationMinutes)
    if (!durationMinutes || isNaN(duration) || duration <= 0) {
      setError('Please enter a valid duration in minutes')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const durationSeconds = Math.round(duration * 60)
      const calories = ActivityService.calculateCalories(activityType, duration)
      const distance = ActivityService.calculateDistance(activityType, duration)

      const startTime = new Date().toISOString()
      const endTime = new Date(Date.now() + durationSeconds * 1000).toISOString()

      const activityData = {
        type: activityType,
        start_time: startTime,
        end_time: endTime,
        duration: durationSeconds,
        calories_burned: calories,
        distance: distance,
        notes: notes.trim() || undefined,
        sleep_quality: activityType === 'sleep' ? sleepQuality : undefined,
      }

      const result = await ActivityService.saveActivity(activityData, user.id)

      if (!result.success) {
        setError(result.error || 'Failed to save activity')
        setIsSubmitting(false)
        return
      }

      // Reload activities and stats
      await Promise.all([loadActivities(), loadStats()])
      
      // Reset form
      setShowAddModal(false)
      setActivityType('walk')
      setDurationMinutes('')
      setNotes('')
      setSleepQuality('good')
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) {
      return
    }

    try {
      const result = await ActivityService.deleteActivity(activityId)
      
      if (!result.success) {
        setError(result.error || 'Failed to delete activity')
        return
      }

      // Reload activities and stats
      await Promise.all([loadActivities(), loadStats()])
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    }
  }

  const getActivityIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      walk: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
        </svg>
      ),
      exercise: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      ),
      stairs_climbing: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="18 3 21 3 21 6 18 6"></polyline>
          <polyline points="3 18 3 21 6 21 6 18"></polyline>
          <polyline points="21 18 21 21 18 21 18 18"></polyline>
          <polyline points="6 3 6 6 3 6 3 3"></polyline>
        </svg>
      ),
      sleep: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      ),
    }
    return icons[type] || icons.walk
  }

  const getActivityColor = (type: string): string => {
    const colors: Record<string, string> = {
      walk: '#4ECDC4',
      exercise: '#45B7D1',
      stairs_climbing: '#FF6B6B',
      sleep: '#DDA0DD',
    }
    return colors[type] || '#667eea'
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return format(date, 'MMM d, yyyy h:mm a')
  }

  // Calculate weekly and monthly summaries
  const getWeeklyData = () => {
    if (!activities.length) return []
    
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
    
    return weekDays.map(day => {
      const dayActivities = activities.filter(activity => {
        const activityDate = new Date(activity.created_at)
        return isWithinInterval(activityDate, { start: day, end: new Date(day.getTime() + 24 * 60 * 60 * 1000) })
      })
      
      const totalSteps = dayActivities
        .filter(a => a.type === 'walk')
        .reduce((sum, a) => sum + Math.round(a.distance * 1250), 0) // Approximate steps from distance
      
      const totalCalories = dayActivities.reduce((sum, a) => sum + a.calories_burned, 0)
      
      return {
        day: format(day, 'EEE'),
        date: day,
        steps: totalSteps,
        calories: Math.round(totalCalories),
        activities: dayActivities.length,
      }
    })
  }

  const getMonthlyData = () => {
    if (!activities.length) return []
    
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
    
    // Group by week
    const weeks: Array<{ week: number; steps: number; calories: number; activities: number }> = []
    let currentWeek = 1
    let weekSteps = 0
    let weekCalories = 0
    let weekActivities = 0
    
    monthDays.forEach((day, index) => {
      const dayActivities = activities.filter(activity => {
        const activityDate = new Date(activity.created_at)
        return isWithinInterval(activityDate, { start: day, end: new Date(day.getTime() + 24 * 60 * 60 * 1000) })
      })
      
      const daySteps = dayActivities
        .filter(a => a.type === 'walk')
        .reduce((sum, a) => sum + Math.round(a.distance * 1250), 0)
      
      const dayCalories = dayActivities.reduce((sum, a) => sum + a.calories_burned, 0)
      
      weekSteps += daySteps
      weekCalories += dayCalories
      weekActivities += dayActivities.length
      
      // End of week or end of month
      if (day.getDay() === 0 || index === monthDays.length - 1) {
        weeks.push({
          week: currentWeek,
          steps: weekSteps,
          calories: Math.round(weekCalories),
          activities: weekActivities,
        })
        currentWeek++
        weekSteps = 0
        weekCalories = 0
        weekActivities = 0
      }
    })
    
    return weeks
  }

  const weeklyData = getWeeklyData()
  const monthlyData = getMonthlyData()
  const maxWeeklySteps = Math.max(...weeklyData.map(d => d.steps), 1)
  const maxMonthlyCalories = Math.max(...monthlyData.map(d => d.calories), 1)

  return (
    <div className="activity-screen">
      <div className="activity-header">
        <button className="back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <h1 className="activity-title">Activities</h1>
        <div className="header-actions">
          <button 
            className="refresh-button" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh data"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className={isRefreshing ? 'spinning' : ''}
            >
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      {lastSyncTime && (
        <div className="sync-timestamp">
          Last synced: {format(lastSyncTime, 'PPp')} ({formatDistanceToNow(lastSyncTime, { addSuffix: true })})
        </div>
      )}

      <div className="activity-content">
        {isLoading && !stats ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading activities...</p>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            {stats && (
              <div className="stats-container">
                <h2 className="stats-title">Your Activity Summary</h2>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-number">{stats.totalActivities}</div>
                    <div className="stat-label">Total Activities</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{ActivityService.formatDuration(stats.totalDuration)}</div>
                    <div className="stat-label">Total Time</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{Math.round(stats.totalCaloriesBurned)}</div>
                    <div className="stat-label">Calories Burned</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.totalDistance.toFixed(1)}</div>
                    <div className="stat-label">Distance (km)</div>
                  </div>
                </div>
              </div>
            )}

            {/* Weekly Summary Chart */}
            {weeklyData.length > 0 && (
              <div className="chart-container">
                <h2 className="chart-title">This Week's Steps</h2>
                <div className="chart-bars">
                  {weeklyData.map((day, index) => (
                    <div key={index} className="chart-bar-wrapper">
                      <div className="chart-bar-container">
                        <div 
                          className="chart-bar"
                          style={{ 
                            height: `${(day.steps / maxWeeklySteps) * 100}%`,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          }}
                        ></div>
                      </div>
                      <div className="chart-label">{day.day}</div>
                      <div className="chart-value">{day.steps.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Summary */}
            {monthlyData.length > 0 && (
              <div className="chart-container">
                <h2 className="chart-title">This Month's Calories</h2>
                <div className="chart-bars">
                  {monthlyData.map((week, index) => (
                    <div key={index} className="chart-bar-wrapper">
                      <div className="chart-bar-container">
                        <div 
                          className="chart-bar"
                          style={{ 
                            height: `${(week.calories / maxMonthlyCalories) * 100}%`,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          }}
                        ></div>
                      </div>
                      <div className="chart-label">Week {week.week}</div>
                      <div className="chart-value">{week.calories}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Activity Button */}
            <button 
              className="add-activity-button"
              onClick={() => setShowAddModal(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Activity
            </button>

            {/* Activities List */}
            <div className="activities-container">
              <h2 className="activities-title">Recent Activities</h2>
              {activities.length === 0 ? (
                <div className="empty-container">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                  <p className="empty-text">No activities yet</p>
                  <p className="empty-subtext">Start tracking your activities to see them here</p>
                </div>
              ) : (
                <div className="activities-list">
                  {activities.map((activity) => (
                    <div key={activity.id} className="activity-card">
                      <div className="activity-header-card">
                        <div className="activity-type-container" style={{ color: getActivityColor(activity.type) }}>
                          {getActivityIcon(activity.type)}
                          <span className="activity-type-text">
                            {activity.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <button 
                          className="delete-button"
                          onClick={() => handleDeleteActivity(activity.id)}
                          title="Delete activity"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                      
                      <div className="activity-stats">
                        <div className="activity-stat">
                          <div className="activity-stat-value">{ActivityService.formatDuration(activity.duration)}</div>
                          <div className="activity-stat-label">Duration</div>
                        </div>
                        <div className="activity-stat">
                          <div className="activity-stat-value">{Math.round(activity.calories_burned)}</div>
                          <div className="activity-stat-label">Calories</div>
                        </div>
                        <div className="activity-stat">
                          <div className="activity-stat-value">{activity.distance.toFixed(2)}</div>
                          <div className="activity-stat-label">Distance (km)</div>
                        </div>
                      </div>
                      
                      {activity.type === 'sleep' && activity.sleep_quality && (
                        <div className="sleep-quality-display">
                          <span className="sleep-quality-label">Sleep Quality:</span>
                          <span className="sleep-quality-value" style={{ color: getActivityColor(activity.type) }}>
                            {activity.sleep_quality.charAt(0).toUpperCase() + activity.sleep_quality.slice(1)}
                          </span>
                        </div>
                      )}
                      
                      <div className="activity-date">{formatDate(activity.created_at)}</div>
                      {activity.notes && (
                        <div className="activity-notes">{activity.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Activity Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => { 
          setShowAddModal(false)
          setError(null)
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Activity</h2>
              <button 
                className="modal-close" 
                onClick={() => { 
                  setShowAddModal(false)
                  setError(null)
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="modal-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label>Activity Type</label>
                <select
                  value={activityType}
                  onChange={e => setActivityType(e.target.value as any)}
                  disabled={isSubmitting}
                  className="form-select"
                >
                  <option value="walk">Walk</option>
                  <option value="exercise">Exercise</option>
                  <option value="stairs_climbing">Stairs Climbing</option>
                  <option value="sleep">Sleep</option>
                </select>
              </div>

              <div className="form-group">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(e.target.value)}
                  placeholder="Enter duration in minutes"
                  min="1"
                  step="0.1"
                  disabled={isSubmitting}
                />
              </div>

              {activityType === 'sleep' && (
                <div className="form-group">
                  <label>Sleep Quality</label>
                  <select
                    value={sleepQuality}
                    onChange={e => setSleepQuality(e.target.value as any)}
                    disabled={isSubmitting}
                    className="form-select"
                  >
                    <option value="poor">Poor</option>
                    <option value="fair">Fair</option>
                    <option value="good">Good</option>
                    <option value="excellent">Excellent</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add any notes about this activity..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => { 
                  setShowAddModal(false)
                  setError(null)
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleAddActivity}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-small"></span>
                    Saving...
                  </>
                ) : (
                  'Save Activity'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ActivityScreen
