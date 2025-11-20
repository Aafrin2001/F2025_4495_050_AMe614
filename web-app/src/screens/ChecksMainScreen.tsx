import React, { useState } from 'react'
import './ChecksMainScreen.css'

interface ChecksMainScreenProps {
  onBack?: () => void
}

const ChecksMainScreen: React.FC<ChecksMainScreenProps> = ({ onBack }) => {
  const [inputValue, setInputValue] = useState('')
  const [checkboxState, setCheckboxState] = useState(false)
  const [selectedOption, setSelectedOption] = useState('option1')
  const [counter, setCounter] = useState(0)

  return (
    <div className="checks-main-screen">
      <div className="container">
        {/* Header */}
        <header className="checks-header">
          <h1 className="checks-title">Checks Main Screen</h1>
          <p className="checks-subtitle">Test Components and UI Elements</p>
          {onBack && (
            <button className="btn-back" onClick={onBack}>
              ← Back
            </button>
          )}
        </header>

        {/* Test Components Grid */}
        <div className="test-components-grid">
          {/* Button Components */}
          <section className="test-section">
            <h2 className="section-title">Button Components</h2>
            <div className="button-group">
              <button className="btn-test btn-primary">Primary Button</button>
              <button className="btn-test btn-secondary">Secondary Button</button>
              <button className="btn-test btn-success">Success Button</button>
              <button className="btn-test btn-warning">Warning Button</button>
              <button className="btn-test btn-danger">Danger Button</button>
              <button className="btn-test btn-info">Info Button</button>
            </div>
          </section>

          {/* Card Components */}
          <section className="test-section">
            <h2 className="section-title">Card Components</h2>
            <div className="cards-grid">
              <div className="test-card">
                <div className="card-icon">📋</div>
                <h3 className="card-title">Test Card 1</h3>
                <p className="card-description">
                  This is a test card component with an icon, title, and description.
                </p>
                <button className="card-button">Learn More</button>
              </div>
              <div className="test-card">
                <div className="card-icon">✅</div>
                <h3 className="card-title">Test Card 2</h3>
                <p className="card-description">
                  Another test card to demonstrate the card component styling.
                </p>
                <button className="card-button">View Details</button>
              </div>
              <div className="test-card">
                <div className="card-icon">🔍</div>
                <h3 className="card-title">Test Card 3</h3>
                <p className="card-description">
                  A third card showing different content and layout options.
                </p>
                <button className="card-button">Explore</button>
              </div>
            </div>
          </section>

          {/* Form Components */}
          <section className="test-section">
            <h2 className="section-title">Form Components</h2>
            <div className="form-container">
              <div className="form-group">
                <label htmlFor="test-input" className="form-label">
                  Text Input
                </label>
                <input
                  type="text"
                  id="test-input"
                  className="form-input"
                  placeholder="Enter some text..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <p className="form-hint">Current value: {inputValue || '(empty)'}</p>
              </div>

              <div className="form-group">
                <label htmlFor="test-textarea" className="form-label">
                  Textarea
                </label>
                <textarea
                  id="test-textarea"
                  className="form-textarea"
                  placeholder="Enter multiple lines of text..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Checkbox</label>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="test-checkbox"
                    className="form-checkbox"
                    checked={checkboxState}
                    onChange={(e) => setCheckboxState(e.target.checked)}
                  />
                  <label htmlFor="test-checkbox" className="checkbox-label">
                    Check this box
                  </label>
                </div>
                <p className="form-hint">Checked: {checkboxState ? 'Yes' : 'No'}</p>
              </div>

              <div className="form-group">
                <label className="form-label">Radio Buttons</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="test-radio"
                      value="option1"
                      checked={selectedOption === 'option1'}
                      onChange={(e) => setSelectedOption(e.target.value)}
                    />
                    Option 1
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="test-radio"
                      value="option2"
                      checked={selectedOption === 'option2'}
                      onChange={(e) => setSelectedOption(e.target.value)}
                    />
                    Option 2
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="test-radio"
                      value="option3"
                      checked={selectedOption === 'option3'}
                      onChange={(e) => setSelectedOption(e.target.value)}
                    />
                    Option 3
                  </label>
                </div>
                <p className="form-hint">Selected: {selectedOption}</p>
              </div>

              <div className="form-group">
                <label htmlFor="test-select" className="form-label">
                  Select Dropdown
                </label>
                <select
                  id="test-select"
                  className="form-select"
                  value={selectedOption}
                  onChange={(e) => setSelectedOption(e.target.value)}
                >
                  <option value="option1">Option 1</option>
                  <option value="option2">Option 2</option>
                  <option value="option3">Option 3</option>
                </select>
              </div>
            </div>
          </section>

          {/* Interactive Components */}
          <section className="test-section">
            <h2 className="section-title">Interactive Components</h2>
            <div className="interactive-container">
              <div className="counter-widget">
                <h3 className="widget-title">Counter Widget</h3>
                <div className="counter-display">{counter}</div>
                <div className="counter-buttons">
                  <button
                    className="btn-counter btn-decrement"
                    onClick={() => setCounter(counter - 1)}
                  >
                    −
                  </button>
                  <button
                    className="btn-counter btn-reset"
                    onClick={() => setCounter(0)}
                  >
                    Reset
                  </button>
                  <button
                    className="btn-counter btn-increment"
                    onClick={() => setCounter(counter + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="alert-widget">
                <h3 className="widget-title">Alert Messages</h3>
                <div className="alert alert-success">
                  ✅ This is a success alert message
                </div>
                <div className="alert alert-warning">
                  ⚠️ This is a warning alert message
                </div>
                <div className="alert alert-danger">
                  ❌ This is a danger alert message
                </div>
                <div className="alert alert-info">
                  ℹ️ This is an info alert message
                </div>
              </div>
            </div>
          </section>

          {/* Badge Components */}
          <section className="test-section">
            <h2 className="section-title">Badge Components</h2>
            <div className="badges-container">
              <span className="badge badge-primary">Primary</span>
              <span className="badge badge-secondary">Secondary</span>
              <span className="badge badge-success">Success</span>
              <span className="badge badge-warning">Warning</span>
              <span className="badge badge-danger">Danger</span>
              <span className="badge badge-info">Info</span>
              <span className="badge badge-large">Large Badge</span>
            </div>
          </section>

          {/* Progress Components */}
          <section className="test-section">
            <h2 className="section-title">Progress Components</h2>
            <div className="progress-container">
              <div className="progress-item">
                <label className="progress-label">Progress Bar 1 (25%)</label>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '25%' }}></div>
                </div>
              </div>
              <div className="progress-item">
                <label className="progress-label">Progress Bar 2 (50%)</label>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '50%' }}></div>
                </div>
              </div>
              <div className="progress-item">
                <label className="progress-label">Progress Bar 3 (75%)</label>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div className="progress-item">
                <label className="progress-label">Progress Bar 4 (100%)</label>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default ChecksMainScreen

