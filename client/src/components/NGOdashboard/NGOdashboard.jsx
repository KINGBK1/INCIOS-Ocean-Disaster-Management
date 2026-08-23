import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet";
import { 
  Building, 
  MapPin, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle,
  Bell,
  Users,
  Truck,
  Phone,
  Mail,
  Globe,
  BarChart3,
  Settings,
  RefreshCw
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// NGO location icon
const ngoIcon = L.divIcon({
  className: "custom-ngo-marker",
  html: `<div style="width: 30px; height: 30px; background: #10b981; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const NGODashboard = () => {
  const [ngoData, setNgoData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(6);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/ngo/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard data');

      const data = await response.json();
      setNgoData(data.ngo);
      setAlerts(data.alerts);
      setStats(data.stats);

      // Center map on NGO location
      if (data.ngo.coordinates) {
        setMapCenter([data.ngo.coordinates.lat, data.ngo.coordinates.lng]);
        setMapZoom(10);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/ngo/alerts/${alertId}/acknowledge`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const getZoneStyle = (type) => {
    switch (type) {
      case "danger":
        return { color: "red", fillColor: "red", fillOpacity: 0.4, weight: 3 };
      case "warning":
        return { color: "orange", fillColor: "orange", fillOpacity: 0.4, weight: 2 };
      default:
        return { color: "gray", fillColor: "gray", fillOpacity: 0.2, weight: 1 };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-lg text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!ngoData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-700">Unable to load NGO data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-4 rounded-full">
              <Building className="text-emerald-600" size={32} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800">{ngoData.organizationName}</h1>
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <Mail size={16} /> {ngoData.email}
              </p>
            </div>
            <button 
              onClick={fetchDashboardData}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Alerts</p>
              <p className="text-3xl font-bold text-gray-800">{stats?.totalAlerts || 0}</p>
            </div>
            <Bell className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-3xl font-bold text-orange-600">{stats?.pendingAlerts || 0}</p>
            </div>
            <AlertTriangle className="text-orange-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Acknowledged</p>
              <p className="text-3xl font-bold text-green-600">{stats?.acknowledgedAlerts || 0}</p>
            </div>
            <CheckCircle className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Danger Zones</p>
              <p className="text-3xl font-bold text-red-600">{stats?.dangerAlerts || 0}</p>
            </div>
            <ShieldAlert className="text-red-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Warning Zones</p>
              <p className="text-3xl font-bold text-orange-500">{stats?.warningAlerts || 0}</p>
            </div>
            <AlertTriangle className="text-orange-500" size={32} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Globe size={24} />
            Alert Zones Map
          </h2>
          <div style={{ height: "500px", borderRadius: "8px", overflow: "hidden" }}>
            <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
              {/* NGO Location */}
              {ngoData.coordinates && (
                <Marker position={[ngoData.coordinates.lat, ngoData.coordinates.lng]} icon={ngoIcon}>
                  <Popup>
                    <div className="p-2">
                      <h4 className="font-bold">{ngoData.organizationName}</h4>
                      <p className="text-sm">Your Location</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Service Radius */}
              {ngoData.coordinates && (
                <Circle
                  center={[ngoData.coordinates.lat, ngoData.coordinates.lng]}
                  radius={ngoData.serviceRadius}
                  pathOptions={{ color: "#10b981", fillOpacity: 0.1, dashArray: "5,5" }}
                />
              )}

              {/* Alert Zones */}
              {alerts.map((alert, index) => 
                alert.zoneId && alert.zoneId.lat && alert.zoneId.lng ? (
                  <Circle
                    key={index}
                    center={[alert.zoneId.lat, alert.zoneId.lng]}
                    radius={alert.zoneId.radius || 5000}
                    pathOptions={getZoneStyle(alert.alertType)}
                  >
                    <Popup>
                      <div>
                        <h4 className="font-bold">{alert.alertType.toUpperCase()} Zone</h4>
                        <p className="text-sm">{alert.zoneId.label}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(alert.receivedAt).toLocaleString()}
                        </p>
                      </div>
                    </Popup>
                  </Circle>
                ) : null
              )}
            </MapContainer>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Bell size={24} />
            Recent Alerts
          </h2>
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No alerts received yet</p>
            ) : (
              alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`border-l-4 p-4 rounded-r-lg ${
                    alert.alertType === 'danger' ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50'
                  } ${alert.acknowledged ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {alert.alertType === 'danger' ? (
                        <ShieldAlert className="text-red-600" size={20} />
                      ) : (
                        <AlertTriangle className="text-orange-600" size={20} />
                      )}
                      <h4 className="font-bold text-gray-800">
                        {alert.alertType.toUpperCase()} Alert
                      </h4>
                    </div>
                    {alert.acknowledged && (
                      <CheckCircle className="text-green-600" size={20} />
                    )}
                  </div>
                  {alert.zoneId && (
                    <p className="text-sm text-gray-700 mb-2">{alert.zoneId.label}</p>
                  )}
                  <p className="text-xs text-gray-600 mb-2">
                    {new Date(alert.receivedAt).toLocaleString()}
                  </p>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert._id)}
                      className="text-sm bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700 transition"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Resources Section */}
      <div className="max-w-7xl mx-auto mt-6 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 size={24} />
          Available Resources
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Users className="mx-auto mb-2 text-blue-600" size={32} />
            <p className="text-2xl font-bold text-gray-800">{ngoData.resources?.volunteers || 0}</p>
            <p className="text-sm text-gray-600">Volunteers</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Truck className="mx-auto mb-2 text-green-600" size={32} />
            <p className="text-2xl font-bold text-gray-800">{ngoData.resources?.vehicles || 0}</p>
            <p className="text-sm text-gray-600">Vehicles</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-4xl mb-2 flex justify-center"><Activity size={40} style={{ color: '#1e40af' }} /></div>
            <p className="text-sm font-bold text-gray-800">
              {ngoData.resources?.medicalSupplies ? 'Available' : 'N/A'}
            </p>
            <p className="text-sm text-gray-600">Medical</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-4xl mb-2 flex justify-center"><Coffee size={40} style={{ color: '#1e40af' }} /></div>
            <p className="text-sm font-bold text-gray-800">
              {ngoData.resources?.foodSupplies ? 'Available' : 'N/A'}
            </p>
            <p className="text-sm text-gray-600">Food</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-4xl mb-2 flex justify-center"><Home size={40} style={{ color: '#1e40af' }} /></div>
            <p className="text-2xl font-bold text-gray-800">{ngoData.resources?.shelterCapacity || 0}</p>
            <p className="text-sm text-gray-600">Shelter</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NGODashboard;