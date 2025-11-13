import React from 'react'
import './HomePage.css'

interface HomePageProps {
  onSignIn: () => void
  onStartTrial: () => void
}

const HomePage: React.FC<HomePageProps> = ({ onSignIn, onStartTrial }) => {
  return (
    <div className="homepage">
      {/* Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <div className="logo">
              <span className="logo-text">EAi</span>
            </div>
            <ul className="nav-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#testimonials">Testimonials</a></li>
              <li><a href="#resources">Resources</a></li>
            </ul>
            <div className="nav-actions">
              <button className="btn-secondary" onClick={onSignIn}>Sign In</button>
              <button className="btn-primary" onClick={onStartTrial}>Start Free Trial</button>
            </div>
            <button className="mobile-menu-toggle" aria-label="Toggle menu">
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="gradient-overlay"></div>
          <div className="hero-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span>Trusted by thousands of seniors and caregivers</span>
            </div>
            <h1 className="hero-title">
              Your Health Companion,<br />
              <span className="gradient-text">Always Here</span>
            </h1>
            <p className="hero-subtitle">
              Personalized healthcare support designed for seniors. Monitor your health, manage medications,
              stay active, and connect with caregivers—all in one beautiful, easy-to-use app.
            </p>
            <div className="hero-actions">
              <button className="btn-primary btn-large" onClick={onStartTrial}>Start Free Trial</button>
              <button className="btn-outline btn-large">Watch Demo</button>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">50K+</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">4.9★</div>
                <div className="stat-label">App Rating</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">AI Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="trust-badges">
        <div className="container">
          <div className="badges-grid">
            <div className="badge-item">
              <div className="badge-icon">🔒</div>
              <div className="badge-text">HIPAA Compliant</div>
            </div>
            <div className="badge-item">
              <div className="badge-icon">🛡️</div>
              <div className="badge-text">Bank-Level Security</div>
            </div>
            <div className="badge-item">
              <div className="badge-icon">✅</div>
              <div className="badge-text">FDA Approved</div>
            </div>
            <div className="badge-item">
              <div className="badge-icon">🌐</div>
              <div className="badge-text">Available Worldwide</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Everything You Need for Better Health</h2>
            <p className="section-subtitle">
              Comprehensive healthcare management tools designed with seniors in mind
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
              <h3 className="feature-title">Health Monitoring</h3>
              <p className="feature-description">
                Track vital signs, symptoms, and health metrics with intuitive visualizations.
                Share data securely with your healthcare providers.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                </svg>
              </div>
              <h3 className="feature-title">Medication Management</h3>
              <p className="feature-description">
                Never miss a dose with smart reminders, medication tracking, and refill alerts.
                Keep your entire medication list organized and accessible.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <h3 className="feature-title">Activity Tracking</h3>
              <p className="feature-description">
                Monitor walking, exercise, sleep, and daily activities. Set goals and celebrate
                achievements with detailed progress reports.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h3 className="feature-title">AI Health Assistant</h3>
              <p className="feature-description">
                Get instant answers to health questions, medication information, and wellness tips.
                Available 24/7 via text or voice chat.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="feature-title">Caregiver Connection</h3>
              <p className="feature-description">
                Securely share health information with family members and caregivers.
                Keep everyone informed and connected.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <h3 className="feature-title">Memory Games</h3>
              <p className="feature-description">
                Keep your mind sharp with engaging brain games including puzzles, word searches,
                memory matching, and number sequences.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h3 className="feature-title">Wellness Activities</h3>
              <p className="feature-description">
                Guided breathing exercises, stretching routines, and sleep cycle tracking
                to support your overall wellness journey.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <h3 className="feature-title">Personalized Dashboard</h3>
              <p className="feature-description">
                Your health at a glance with customizable views, quick access to important
                information, and intuitive navigation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Simple, Secure, Supportive</h2>
            <p className="section-subtitle">
              Get started in minutes with our easy setup process
            </p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3 className="step-title">Download & Sign Up</h3>
              <p className="step-description">
                Download the EAi app from the App Store or Google Play.
                Create your account in less than 2 minutes.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">02</div>
              <h3 className="step-title">Set Up Your Profile</h3>
              <p className="step-description">
                Add your health information, medications, and preferences.
                Everything is encrypted and secure.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">03</div>
              <h3 className="step-title">Connect Caregivers</h3>
              <p className="step-description">
                Invite family members or caregivers to view your health data.
                Control what they can see and when.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">04</div>
              <h3 className="step-title">Start Your Journey</h3>
              <p className="step-description">
                Begin tracking your health, managing medications, and engaging
                with activities. Your AI companion is ready to help.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="testimonials">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Loved by Seniors and Caregivers</h2>
            <p className="section-subtitle">
              See what our community is saying about EAi
            </p>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-rating">★★★★★</div>
              <p className="testimonial-text">
                "EAi has transformed how I manage my health. The medication reminders are a lifesaver,
                and I love being able to share my progress with my daughter. It's so easy to use!"
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">MR</div>
                <div className="author-info">
                  <div className="author-name">Margaret Roberts</div>
                  <div className="author-role">EAi User, Age 78</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-rating">★★★★★</div>
              <p className="testimonial-text">
                "As a caregiver, EAi gives me peace of mind. I can check on my mother's health
                anytime, and the alerts help me stay on top of her medication schedule. It's invaluable."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">JS</div>
                <div className="author-info">
                  <div className="author-name">James Smith</div>
                  <div className="author-role">Caregiver</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-rating">★★★★★</div>
              <p className="testimonial-text">
                "The AI assistant is incredibly helpful. I can ask questions about my medications
                or get health tips anytime. The memory games are fun too—I play them every day!"
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">EW</div>
                <div className="author-info">
                  <div className="author-name">Evelyn Williams</div>
                  <div className="author-role">EAi User, Age 82</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Take Control of Your Health?</h2>
            <p className="cta-subtitle">
              Join thousands of seniors who trust EAi for their healthcare management
            </p>
            <div className="cta-actions">
              <button className="btn-primary btn-large" onClick={onStartTrial}>Start Free Trial</button>
              <button className="btn-outline btn-large">Schedule a Demo</button>
            </div>
            <p className="cta-note">No credit card required • Free 30-day trial • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <span className="logo-text">EAi</span>
              </div>
              <p className="footer-tagline">Your Health Companion, Always Here</p>
              <div className="social-links">
                <a href="#" aria-label="Facebook">📘</a>
                <a href="#" aria-label="Twitter">🐦</a>
                <a href="#" aria-label="LinkedIn">💼</a>
                <a href="#" aria-label="Instagram">📷</a>
              </div>
            </div>
            <div className="footer-section">
              <h4 className="footer-heading">Product</h4>
              <ul className="footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><a href="#">Pricing</a></li>
                <li><a href="#">Security</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4 className="footer-heading">Resources</h4>
              <ul className="footer-links">
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Guides</a></li>
                <li><a href="#">Community</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4 className="footer-heading">Company</h4>
              <ul className="footer-links">
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 EAi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
