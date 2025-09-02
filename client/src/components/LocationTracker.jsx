import React, { useState, useEffect } from "react";

export default function LocationTracker() {
  const [location, setLocation] = useState({ lat: null, lon: null, accuracy: null });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    // Watch position for real-time updates
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg max-w-md mx-auto mt-10 text-center">
      <h1 className="text-2xl font-bold mb-4">📍 Live Location Tracker</h1>
      {error && <p className="text-red-500">{error}</p>}
      {location.lat ? (
        <div className="space-y-2">
          <p><strong>Latitude:</strong> {location.lat}</p>
          <p><strong>Longitude:</strong> {location.lon}</p>
          <p><strong>Accuracy:</strong> {location.accuracy} meters</p>
        </div>
      ) : (
        <p>Fetching location...</p>
      )}
    </div>
  );
}
