import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  MapPin, 
  Filter,
  Search,
  ChevronDown,
  Activity,
  TrendingUp,
  Waves,
  Cloud,
  Zap,
  Shield,
  ExternalLink,
  Download,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import './Alerts.css';
import UserDashboardNavbar from '../Dashboard/Navbar/UserDashboardNav';
import Footer from '../Footer/Footer';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const navigate = useNavigate();

  // Helper function to extract field value from various possible field names
  const getFieldValue = (alert, fieldNames, defaultValue = '') => {
    for (const field of fieldNames) {
      if (alert[field] !== undefined && alert[field] !== null && alert[field] !== '') {
        return alert[field];
      }
    }
    return defaultValue;
  };

  // Get alert icon based on type
  const getAlertIcon = (alertType) => {
    const type = alertType?.toUpperCase() || '';
    if (type.includes('WAVE') || type.includes('TSUNAMI')) return <Waves className="alert-type-icon" />;
    if (type.includes('STORM') || type.includes('CYCLONE')) return <Cloud className="alert-type-icon" />;
    if (type.includes('SURGE')) return <Zap className="alert-type-icon" />;
    return <AlertTriangle className="alert-type-icon" />;
  };

  // Get severity level for earthquake/tsunami alerts
  const getSeverityLevel = (alert) => {
    // For earthquake data, use magnitude to determine severity
    if (alert.MAGNITUDE) {
      if (alert.MAGNITUDE >= 7.0) return 'high';
      if (alert.MAGNITUDE >= 6.0) return 'medium';
      if (alert.MAGNITUDE >= 5.0) return 'low';
      return 'info';
    }
    
    // Fallback for other alert types
    const type = alert.Alert?.toUpperCase() || '';
    const color = alert.Color?.toUpperCase() || '';
    
    if (color === 'RED' || type.includes('TSUNAMI') || type.includes('CYCLONE')) return 'high';
    if (color === 'ORANGE' || type.includes('STORM')) return 'medium';
    if (color === 'YELLOW' || type.includes('WAVE')) return 'low';
    return 'info';
  };

  // Get severity badge
  const getSeverityBadge = (severity) => {
    const severityConfig = {
      high: { label: 'High Risk', class: 'severity-high', icon: '🚨' },
      medium: { label: 'Medium Risk', class: 'severity-medium', icon: '⚠️' },
      low: { label: 'Low Risk', class: 'severity-low', icon: '⚡' },
      info: { label: 'Information', class: 'severity-info', icon: 'ℹ️' }
    };
    return severityConfig[severity] || severityConfig.info;
  };

  // Enhanced loading progress
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 15;
      });
    }, 100);

    const completeLoading = setTimeout(() => {
      setLoadingProgress(100);
      clearInterval(progressInterval);
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completeLoading);
    };
  }, []);

  // Fetch user data
  const fetchUser = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        console.log('No token found for alerts page');
        return;
      }
      
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/status`,
        {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        
        let userData;
        if (data.success && data.user) {
          userData = data.user;
        } else if (data.user) {
          userData = data.user;
        } else {
          userData = data;
        }
        
        const normalizedUser = {
          name: userData.name || userData.username || 'Anonymous User',
          email: userData.email || 'No email provided',
          id: userData.id || userData._id || 'unknown',
          avatar: userData.avatar || userData.picture || null,
          role: userData.role || 'user'
        };
        
        setUser(normalizedUser);
      }
    } catch (err) {
      console.error("Error fetching user for alerts:", err);
      setUser({
        name: "Demo User",
        email: "demo@varuna.gov.in",
        id: "demo-user",
        avatar: null
      });
    }
  };

  // Fetch past 90 days alerts
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching alerts from:', `${import.meta.env.VITE_BACKEND_URL}/api/alerts/past90daysalerts`);
      
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/alerts/past90daysalerts?t=${Date.now()}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 RAW BACKEND RESPONSE:', data);
      console.log('📊 Response type:', typeof data, 'Is array:', Array.isArray(data));
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('🌍 Backend returned', data.length, 'total alerts');
        console.log('📝 Alert regions:', data.map(a => a.REGIONNAME));
        console.log('🔍 First alert full structure:', data[0]);
        console.log('🗂️ Alert fields:', Object.keys(data[0]));
      }
      
      // Handle different response structures
      let alertsData = [];
      if (data.alerts && Array.isArray(data.alerts)) {
        alertsData = data.alerts;
      } else if (Array.isArray(data)) {
        alertsData = data;
      } else if (data.data && Array.isArray(data.data)) {
        alertsData = data.data;
      }

      console.log(`Total alerts received: ${alertsData.length}`);
      
      // BHAI NO FILTERING NEEDED - BACKEND ALREADY RETURNS INDIA ONLY!
      console.log('🇮🇳 BHAI BACKEND ALREADY FILTERED - TAKING ALL DATA AS INDIA ONLY!');
      const indiaRelevantAlerts = alertsData; // Use all data from backend
      
      console.log(`🇮🇳 FILTERING COMPLETE: ${indiaRelevantAlerts.length} India-relevant alerts found`);
      
      // NO DATE FILTERING - Show ALL India alerts from database
      console.log(`📅 Showing ALL India alerts from database (no date restrictions)`);
      console.log('👍 Final accepted alerts:', indiaRelevantAlerts.map(a => a.REGIONNAME));
      console.log('Sample alert:', indiaRelevantAlerts[0]);

      // Process and enrich alerts data
      const processedAlerts = indiaRelevantAlerts.map((alert, index) => ({
        ...alert,
        id: alert.EVID || alert.id || alert.OBJECTID || alert._id || index,
        severity: getSeverityLevel(alert),
        timestamp: alert.ORIGINTIME || alert['Issue Date'] || alert.issueDate || alert.fetched_at || new Date().toISOString(),
        location: alert.REGIONNAME || alert.STATE && alert.District ? `${alert.District}, ${alert.STATE}` : 
                 alert.STATE || alert.District || 'Unknown Location'
      })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setAlerts(processedAlerts);
      setFilteredAlerts(processedAlerts);
      
      console.log(`Successfully loaded ${processedAlerts.length} alerts`);
      
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError(`Failed to fetch alerts: ${err.message}`);
      setAlerts([]);
      setFilteredAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search alerts
  useEffect(() => {
    let filtered = [...alerts];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(alert => {
        const eventInfo = alert.detail_data?.[0]?.event_info?.[0] || {};
        return (
          alert.REGIONNAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alert.EVID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          eventInfo.bulletinTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          eventInfo.evaluation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          eventInfo.Location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alert.Alert?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alert.STATE?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alert.District?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alert.Message?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(alert => {
        const eventInfo = alert.detail_data?.[0]?.event_info?.[0] || {};
        const type = alert.Alert?.toUpperCase() || eventInfo.bulletinTitle?.toUpperCase() || '';
        const regionName = alert.REGIONNAME?.toUpperCase() || '';
        
        switch (filterType) {
          case 'wave': 
            return type.includes('WAVE') || type.includes('TSUNAMI') || 
                   eventInfo.evaluation?.toUpperCase().includes('TSUNAMI');
          case 'storm': 
            return type.includes('STORM') || type.includes('CYCLONE');
          case 'surge': 
            return type.includes('SURGE');
          case 'earthquake':
            return type.includes('EARTHQUAKE') || alert.MAGNITUDE !== undefined;
          default: return true;
        }
      });
    }

    // Apply severity filter
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === filterSeverity);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'severity':
          const severityOrder = { high: 0, medium: 1, low: 2, info: 3 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        case 'location':
          return (a.location || '').localeCompare(b.location || '');
        default: // date
          return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });

    setFilteredAlerts(filtered);
  }, [alerts, searchTerm, filterType, filterSeverity, sortBy]);

  // Initial data fetch
  useEffect(() => {
    fetchUser();
    
    const loadingTimer = setTimeout(() => {
      fetchAlerts();
    }, 1500);

    return () => clearTimeout(loadingTimer);
  }, []);

  const refreshAlerts = () => {
    setLoadingProgress(0);
    fetchAlerts();
  };

  // Get stats
  const stats = {
    total: alerts.length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
    recent: alerts.filter(a => {
      const alertDate = new Date(a.timestamp || a.ORIGINTIME || '1970-01-01');
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return alertDate >= sevenDaysAgo;
    }).length
  };

  return (
    <div className="alerts-container">
      <UserDashboardNavbar user={user} />
      
      {/* Loading Screen */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <h2 className="loading-title">Loading Alerts</h2>
            <div className="loading-progress">
              <div 
                className="loading-progress-bar" 
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="loading-text">
              {loadingProgress < 30 ? 'Connecting to INCOIS alert systems...' : 
               loadingProgress < 70 ? 'Fetching India-relevant threats...' : 
               loadingProgress < 95 ? 'Processing all available data...' : 'Almost ready!'}
            </p>
          </div>
        </div>
      )}

      <div className="alerts-main-content">
    

        {/* Statistics Dashboard */}
        <section className="stats-dashboard">
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon">
                <Activity />
              </div>
              <div className="stat-info">
                <span className="stat-number">{stats.total}</span>
                <span className="stat-label">Total Alerts</span>
              </div>
            </div>
            <div className="stat-card high">
              <div className="stat-icon">
                <AlertTriangle />
              </div>
              <div className="stat-info">
                <span className="stat-number">{stats.high}</span>
                <span className="stat-label">High Risk</span>
              </div>
            </div>
            <div className="stat-card medium">
              <div className="stat-icon">
                <TrendingUp />
              </div>
              <div className="stat-info">
                <span className="stat-number">{stats.medium}</span>
                <span className="stat-label">Medium Risk</span>
              </div>
            </div>
            <div className="stat-card recent">
              <div className="stat-icon">
                <Clock />
              </div>
              <div className="stat-info">
                <span className="stat-number">{stats.recent}</span>
                <span className="stat-label">Recent (7 days)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Controls Section */}
        <section className="controls-section">
          <div className="search-bar">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search all India-specific alerts by region, evaluation, or threat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-controls">
            <div className="filter-group">
              <label>Type:</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="earthquake">Earthquake</option>
                <option value="wave">Wave & Tsunami</option>
                <option value="storm">Storm & Cyclone</option>
                <option value="surge">Storm Surge</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Severity:</label>
              <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
                <option value="all">All Severities</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
                <option value="info">Information</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="date">Latest First</option>
                <option value="severity">Severity</option>
                <option value="location">Location</option>
              </select>
            </div>
          </div>
        </section>

        {/* Error State */}
        {error && (
          <div className="error-state">
            <AlertTriangle className="error-icon" />
            <h3>Unable to Load Alerts</h3>
            <p>{error}</p>
            <button onClick={refreshAlerts} className="retry-btn">
              <RefreshCw className="retry-icon" />
              Try Again
            </button>
          </div>
        )}

        {/* Alerts Grid */}
        <section className="alerts-grid">
          {!loading && !error && filteredAlerts.length === 0 ? (
            <div className="no-alerts">
              <Shield className="no-alerts-icon" />
              <h3>No India-Specific Threats Found</h3>
              <p>
                {searchTerm || filterType !== 'all' || filterSeverity !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No earthquake or tsunami threats to India detected in available data. This is good news!'}
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert, index) => {
              const severity = getSeverityBadge(alert.severity);
              
              // Extract alert fields for earthquake/tsunami bulletins
              const eventInfo = alert.detail_data?.[0]?.event_info?.[0] || {};
              
              const alertType = eventInfo.bulletinTitle || 
                               `${alert.MAGNITUDE ? `M${alert.MAGNITUDE}` : ''} Earthquake${alert.REGIONNAME ? ` - ${alert.REGIONNAME}` : ''}`;
              
              const alertLocation = alert.REGIONNAME || eventInfo.Location || 
                                   getFieldValue(alert, ['STATE', 'District', 'state', 'district', 'area', 'region', 'place'], 'Unknown Location');
              
              const alertMessage = eventInfo.evaluation || eventInfo.advice || 
                                  getFieldValue(alert, ['Message', 'message', 'description', 'details'], '');
              
              const issueDate = eventInfo.EQDate && eventInfo.EQTime ? 
                               `${eventInfo.EQDate} ${eventInfo.EQTime}` : 
                               alert.ORIGINTIME || 
                               getFieldValue(alert, ['Issue Date', 'issueDate', 'date', 'timestamp'], 'Not specified');
              
              const colorCode = alert.MAGNITUDE >= 7.0 ? 'Red' : 
                               alert.MAGNITUDE >= 6.0 ? 'Orange' : 
                               alert.MAGNITUDE >= 5.0 ? 'Yellow' : 'Blue';
              
              const alertId = alert.EVID || alert._id || 
                             getFieldValue(alert, ['OBJECTID', 'id'], '');
              
              return (
                <article key={alert.id || index} className="alert-card">
                  {/* Alert Header */}
                  <header className="alert-header">
                    <div className="alert-type">
                      {getAlertIcon(alertType)}
                      <span className="alert-type-name">{alertType}</span>
                    </div>
                    <div className="alert-severity">
                      <span className={`severity-badge ${severity.class}`}>
                        {severity.icon} {severity.label}
                      </span>
                    </div>
                  </header>

                  {/* Alert Content */}
                  <div className="alert-content">
                    {/* Location */}
                    <div className="alert-location">
                      <MapPin className="location-icon" />
                      <span>{alertLocation}</span>
                    </div>

                    {/* Message */}
                    {alertMessage && (
                      <div className="alert-message">
                        <p>{alertMessage}</p>
                      </div>
                    )}

                    {/* Details */}
                    <div className="alert-details">
                      <div className="detail-item">
                        <Calendar className="detail-icon" />
                        <span>Event Time: {issueDate}</span>
                      </div>
                      
                      {alert.MAGNITUDE && (
                        <div className="detail-item">
                          <Activity className="detail-icon" />
                          <span>Magnitude: {alert.MAGNITUDE} M</span>
                        </div>
                      )}
                      
                      {alert.DEPTH && (
                        <div className="detail-item">
                          <MapPin className="detail-icon" />
                          <span>Depth: {alert.DEPTH} km</span>
                        </div>
                      )}
                      
                      {colorCode && (
                        <div className="detail-item">
                          <div 
                            className="color-indicator" 
                            style={{ 
                              backgroundColor: (colorCode === 'Yellow' || colorCode === 'yellow') ? '#FFD700' : 
                                              (colorCode === 'Orange' || colorCode === 'orange') ? '#FFA500' :
                                              (colorCode === 'Red' || colorCode === 'red') ? '#FF0000' : 
                                              (colorCode === 'Green' || colorCode === 'green') ? '#008000' : '#0000FF'
                            }}
                          ></div>
                          <span>Threat Level: {colorCode}</span>
                        </div>
                      )}

                      {alertId && (
                        <div className="detail-item">
                          <Shield className="detail-icon" />
                          <span>Event ID: {alertId}</span>
                        </div>
                      )}
                      
                      {eventInfo.bulletinNumber && (
                        <div className="detail-item">
                          <Shield className="detail-icon" />
                          <span>Bulletin #{eventInfo.bulletinNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Alert Actions */}
                  <footer className="alert-actions">
                    <div className="alert-timestamp">
                      <Clock className="timestamp-icon" />
                      <span>{new Date(alert.timestamp).toLocaleDateString()}</span>
                    </div>
                  </footer>
                </article>
              );
            })
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Alerts;