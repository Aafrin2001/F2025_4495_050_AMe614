import React, { useState } from 'react'
import './ActivityScreen.css'

interface ActivityScreenProps {
  onBack: () => void
  user: any
  onNavigateToWalking?: () => void
  onNavigateToStretching?: () => void
  onNavigateToBreathing?: () => void
  onNavigateToSleep?: () => void
  onNavigateToMemoryMatch?: () => void
  onNavigateToWordSearch?: () => void
  onNavigateToPuzzlePieces?: () => void
  onNavigateToNumberSequence?: () => void
}

interface Activity {
  id: string
  name: string
  description: string
  icon: string
  color: string
  category: 'physical' | 'mental' | 'wellness'
  onClick?: () => void
}

const ActivityScreen: React.FC<ActivityScreenProps> = ({
  onBack,
  onNavigateToWalking,
  onNavigateToStretching,
  onNavigateToBreathing,
  onNavigateToSleep,
  onNavigateToMemoryMatch,
  onNavigateToWordSearch,
  onNavigateToPuzzlePieces,
  onNavigateToNumberSequence,
}) => {
  const activities: Activity[] = [
    {
      id: 'walking',
      name: 'Walking Tracker',
      description: 'Track your daily walks and steps',
      icon: 'walking',
      color: '#4ECDC4',
      category: 'physical',
      onClick: onNavigateToWalking,
    },
    {
      id: 'stretching',
      name: 'Stretching',
      description: 'Guided stretching exercises',
      icon: 'stretch',
      color: '#45B7D1',
      category: 'physical',
      onClick: onNavigateToStretching,
    },
    {
      id: 'breathing',
      name: 'Breathing Exercises',
      description: 'Relaxation and mindfulness',
      icon: 'breathing',
      color: '#96CEB4',
      category: 'wellness',
      onClick: onNavigateToBreathing,
    },
    {
      id: 'sleep',
      name: 'Sleep Cycle',
      description: 'Track and improve your sleep',
      icon: 'sleep',
      color: '#DDA0DD',
      category: 'wellness',
      onClick: onNavigateToSleep,
    },
    {
      id: 'memory',
      name: 'Memory Match',
      description: 'Improve memory with card matching',
      icon: 'memory',
      color: '#E91E63',
      category: 'mental',
      onClick: onNavigateToMemoryMatch,
    },
    {
      id: 'wordsearch',
      name: 'Word Search',
      description: 'Find hidden words in puzzles',
      icon: 'wordsearch',
      color: '#3F51B5',
      category: 'mental',
      onClick: onNavigateToWordSearch,
    },
    {
      id: 'puzzle',
      name: 'Puzzle Pieces',
      description: 'Complete jigsaw puzzles',
      icon: 'puzzle',
      color: '#FF5722',
      category: 'mental',
      onClick: onNavigateToPuzzlePieces,
    },
    {
      id: 'numbers',
      name: 'Number Sequence',
      description: 'Complete number patterns',
      icon: 'numbers',
      color: '#607D8B',
      category: 'mental',
      onClick: onNavigateToNumberSequence,
    },
  ]

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'physical' | 'mental' | 'wellness'>('all')

  const filteredActivities = selectedCategory === 'all'
    ? activities
    : activities.filter(a => a.category === selectedCategory)

  const getActivityIcon = (icon: string) => {
    const icons: Record<string, JSX.Element> = {
      walking: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
        </svg>
      ),
      stretch: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
      breathing: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
      ),
      sleep: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      ),
      memory: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        </svg>
      ),
      wordsearch: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="M21 21l-4.35-4.35"></path>
        </svg>
      ),
      puzzle: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
      numbers: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="2" x2="12" y2="22"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
    }
    return icons[icon] || icons.walking
  }

  return (
    <div className="activity-screen">
      <div className="activity-header">
        <button className="back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <h1 className="activity-title">Activities & Games</h1>
      </div>

      <div className="activity-content">
        <div className="category-filters">
          <button
            className={`filter-button ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          <button
            className={`filter-button ${selectedCategory === 'physical' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('physical')}
          >
            Physical
          </button>
          <button
            className={`filter-button ${selectedCategory === 'mental' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('mental')}
          >
            Mental
          </button>
          <button
            className={`filter-button ${selectedCategory === 'wellness' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('wellness')}
          >
            Wellness
          </button>
        </div>

        <div className="activities-grid">
          {filteredActivities.map(activity => (
            <div
              key={activity.id}
              className="activity-card"
              style={{ '--activity-color': activity.color } as React.CSSProperties}
              onClick={activity.onClick}
            >
              <div className="activity-icon" style={{ color: activity.color }}>
                {getActivityIcon(activity.icon)}
              </div>
              <div className="activity-info">
                <h3 className="activity-name">{activity.name}</h3>
                <p className="activity-description">{activity.description}</p>
              </div>
              <div className="activity-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ActivityScreen

