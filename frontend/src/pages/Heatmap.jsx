import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import {
  MapPin,
  X,
  Clock,
  Sparkles,
  RefreshCw,
  Filter
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { getHeatmapData, getHeatmapInsights } from '../api';

export default function Heatmap() {
  const navigate = useNavigate();
  const { hero } = useGame();
  
  const city = hero.city || 'Vasai';

  const [heatmapData, setHeatmapData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);
  
  const [selectedTypes, setSelectedTypes] = useState({
    'Pothole': true,
    'Water Leakage': true,
    'Garbage': true,
    'Streetlights': true,
    'Infrastructure': true
  });
  
  const [timeFilter, setTimeFilter] = useState('all'); // 'today', 'week', 'month', 'all'
  const [mapInstance, setMapInstance] = useState(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  
  const mapRef = useRef(null);
  const heatmapLayerRef = useRef(null);
  const markersRef = useRef([]);

  // Fetch heatmap data and insights
  const fetchData = async () => {
    setLoadingData(true);
    setLoadingInsights(true);
    try {
      const data = await getHeatmapData(city);
      setHeatmapData(data);
    } catch (err) {
      console.error('Error fetching heatmap data:', err);
    } finally {
      setLoadingData(false);
    }

    try {
      const insightsData = await getHeatmapInsights(city);
      setInsights(insightsData.insights || []);
    } catch (err) {
      console.error('Error fetching insights:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [city]);

  // Load Google Maps Script
  useEffect(() => {
    const loadScript = () => {
      if (window.google && window.google.maps) {
        setGoogleLoaded(true);
        return;
      }
      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => setGoogleLoaded(true));
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?v=3.58&libraries=visualization`;
      script.async = true;
      script.defer = true;
      script.onload = () => setGoogleLoaded(true);
      document.head.appendChild(script);
    };
    loadScript();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!googleLoaded || !mapRef.current || mapInstance) return;

    // Predefined coordinate lookup for instant, rate-limit-proof centering
    const CITY_COORDS = {
      'alibag': { lat: 18.652369, lng: 72.879486 },
      'alibagh': { lat: 18.652369, lng: 72.879486 },
      'vasai': { lat: 19.3460, lng: 72.8337 },
      'vasai-virar': { lat: 19.3460, lng: 72.8337 },
      'mumbai': { lat: 19.0760, lng: 72.8777 },
      'demo city': { lat: 28.6139, lng: 77.2090 }
    };

    const lowerCity = city.toLowerCase().trim();
    let mapCenter = { lat: 19.3460, lng: 72.8337 }; // default to Vasai

    if (CITY_COORDS[lowerCity]) {
      mapCenter = CITY_COORDS[lowerCity];
    }

    const mapStyle = [
      { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
      { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
      { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
      {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
      },
      {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
      },
      {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{ "color": "#263c3f" }]
      },
      {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#6b9a76" }]
      },
      {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{ "color": "#38414e" }]
      },
      {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#212a37" }]
      },
      {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#9ca5b3" }]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [{ "color": "#746855" }]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#1f282d" }]
      },
      {
        "featureType": "road.highway",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#f3d19c" }]
      },
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#17263c" }]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#515c6d" }]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#17263c" }]
      }
    ];

    const map = new window.google.maps.Map(mapRef.current, {
      center: mapCenter,
      zoom: 14,
      styles: mapStyle,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    setMapInstance(map);

    // Fallback geocoding if not in pre-defined lookup
    if (!CITY_COORDS[lowerCity]) {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            map.setCenter({ lat, lng });
          }
        })
        .catch(err => console.warn('Nominatim geocode failed', err));
    }
  }, [googleLoaded, city]);

  // Update Heatmap Layer and Markers when data or filters change
  useEffect(() => {
    if (!mapInstance || !googleLoaded) return;

    // Filter data
    const filtered = heatmapData.filter(issue => {
      // Type filter
      if (!selectedTypes[issue.type]) return false;
      
      // Time filter
      if (timeFilter !== 'all') {
        const createdDate = new Date(issue.created_at);
        const now = new Date();
        const diffTime = Math.abs(now - createdDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (timeFilter === 'today' && diffDays > 1) return false;
        if (timeFilter === 'week' && diffDays > 7) return false;
        if (timeFilter === 'month' && diffDays > 30) return false;
      }
      
      return true;
    });

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Map intensity calculations
    const getSeverityScore = (sev) => {
      const s = (sev || 'medium').toLowerCase();
      if (s === 'critical') return 5;
      if (s === 'high') return 3;
      if (s === 'medium') return 2;
      if (s === 'low') return 1;
      return 2;
    };

    // Prepare heatmap points
    const points = filtered.map(issue => {
      const severityScore = getSeverityScore(issue.severity);
      const weight = (issue.reports * 2) + severityScore;
      return {
        location: new window.google.maps.LatLng(issue.lat, issue.lng),
        weight: weight
      };
    });

    // Update heatmap layer
    let heatmapSuccess = false;
    try {
      if (window.google && window.google.maps && window.google.maps.visualization && window.google.maps.visualization.HeatmapLayer) {
        if (heatmapLayerRef.current) {
          heatmapLayerRef.current.setData(points);
        } else {
          heatmapLayerRef.current = new window.google.maps.visualization.HeatmapLayer({
            data: points,
            map: mapInstance,
            radius: 35
          });
        }
        heatmapSuccess = true;
      }
    } catch (e) {
      console.warn("Google Maps native HeatmapLayer is unavailable, using circles fallback:", e.message);
    }

    // Add markers for individual hotspots
    const colors = {
      'Pothole': '#FF0000',
      'Water Leakage': '#0088FF',
      'Garbage': '#00CC44',
      'Streetlights': '#FFCC00',
      'Infrastructure': '#CC00FF'
    };

    filtered.forEach(issue => {
      const color = colors[issue.type] || '#FFF';
      const severityScore = getSeverityScore(issue.severity);
      const weight = (issue.reports * 2) + severityScore;

      // Render large translucent circles representing hotspots if Google Heatmap layer is deprecated/unloaded
      if (!heatmapSuccess) {
        const circle = new window.google.maps.Circle({
          strokeWeight: 0,
          fillColor: color,
          fillOpacity: 0.15 + Math.min(0.2, weight / 50),
          map: mapInstance,
          center: { lat: issue.lat, lng: issue.lng },
          radius: 80 + (weight * 6)
        });
        markersRef.current.push(circle);
      }

      const marker = new window.google.maps.Marker({
        position: { lat: issue.lat, lng: issue.lng },
        map: mapInstance,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 6 + (weight / 5),
          fillColor: color,
          fillOpacity: 0.8,
          strokeColor: '#FFFFFF',
          strokeWeight: 1.5
        },
        title: `${issue.type} - Severity: ${issue.severity}`
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="color: #2D1B13; font-family: sans-serif; padding: 4px; font-size: 13px;">
            <b style="font-size: 14px; text-transform: uppercase;">${issue.type} Hotspot</b><br/>
            <hr style="margin: 4px 0; border: none; border-top: 1px solid #CCC;"/>
            Severity: <b>${issue.severity}</b><br/>
            Citizen Reports: <b>${issue.reports}</b><br/>
            Heat Weight: <b>${weight}</b>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstance, marker);
      });

      markersRef.current.push(marker);
    });

  }, [heatmapData, selectedTypes, timeFilter, mapInstance, googleLoaded]);

  const toggleType = (type) => {
    setSelectedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));

    // Find first issue of this type in the active city and center the map on it
    const matches = heatmapData.filter(issue => issue.type === type);
    if (matches.length > 0 && mapInstance) {
      const target = matches[0];
      mapInstance.panTo({ lat: target.lat, lng: target.lng });
      mapInstance.setZoom(16);
    }
  };

  const getPillColor = (type) => {
    const colors = {
      'Pothole': '#E53E3E',
      'Water Leakage': '#3182CE',
      'Garbage': '#38A169',
      'Streetlights': '#D69E2E',
      'Infrastructure': '#805AD5'
    };
    return colors[type] || '#5C4033';
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#2D1B13',
      backgroundImage: "url('/map_bg.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      padding: '24px 16px 110px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      fontFamily: "'Inter', sans-serif",
      color: '#F4E8C1',
      boxSizing: 'border-box'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap');
        
        .medieval-font {
          font-family: 'MedievalSharp', serif;
        }

        .wood-panel {
          background-color: #3e2723;
          background-image: url('/panel_bg.png');
          background-size: 100% 100%;
          border: 6px double #8B5E34;
          border-radius: 16px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.85);
          padding: 28px 20px 24px 20px;
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .stone-header {
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          background: #7F7F7F;
          background-image: linear-gradient(135deg, #8A8A8A 0%, #5E5E5E 100%);
          border: 3px solid #3C3C3C;
          border-radius: 12px;
          padding: 10px 24px;
          color: #FFF;
          font-family: 'MedievalSharp', serif;
          font-size: 1.25rem;
          font-weight: 900;
          text-shadow: 2px 2px 0 #000;
          box-shadow: 0 5px 12px rgba(0,0,0,0.6);
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 10;
        }

        .parchment-container {
          background: #F4E8C1;
          border: 3px solid #5A4B3D;
          border-radius: 12px;
          color: #2D1B13;
          padding: 12px 10px;
          box-shadow: inset 0 0 15px rgba(139,94,52,0.25), 0 4px 8px rgba(0,0,0,0.3);
          max-height: 540px;
          overflow-y: auto;
        }

        /* Custom brown scrollbar matching the app theme */
        .parchment-container::-webkit-scrollbar {
          width: 8px;
        }
        .parchment-container::-webkit-scrollbar-track {
          background: rgba(45, 27, 19, 0.12);
          border-radius: 4px;
        }
        .parchment-container::-webkit-scrollbar-thumb {
          background: #8B5E34;
          border-radius: 4px;
          border: 1.5px solid #5C4033;
        }
        .parchment-container::-webkit-scrollbar-thumb:hover {
          background: #A87C54;
        }

        .filter-pill {
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 0.68rem;
          font-weight: 800;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
          user-select: none;
        }

        .time-tab {
          flex: 1;
          background: #EEDC82;
          border: 1.5px solid #8B5E34;
          color: #5C4033;
          font-weight: bold;
          font-size: 0.75rem;
          padding: 6px 0;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }
        .time-tab--active {
          background: #8B5E34;
          color: #F4E8C1;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.4);
        }
        .time-tab:first-child { border-radius: 6px 0 0 6px; }
        .time-tab:last-child { border-radius: 0 6px 6px 0; }
        
        .insight-card {
          background: #EEDC82;
          border: 1.5px solid rgba(139,94,52,0.25);
          border-left: 5px solid #6B46C1;
          border-radius: 6px;
          padding: 10px 12px;
          font-size: 0.82rem;
          line-height: 1.45;
          color: #2D1B13;
          font-style: italic;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>

      <div className="wood-panel" style={{ marginTop: '24px' }}>
        <div className="stone-header">
          <MapPin size={18} strokeWidth={2.5} />
          <span className="medieval-font">District Heatmap</span>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'transparent',
            border: 'none',
            color: '#C4A484',
            cursor: 'pointer',
            outline: 'none',
            zIndex: 10
          }}
        >
          <X size={26} />
        </button>

        <div className="parchment-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2.5px solid #5A4B3D', paddingBottom: '6px', flexShrink: 0 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#5A4B3D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Realtime Anomaly Densities ({city})
            </span>
            <button 
              onClick={fetchData} 
              style={{ background: 'transparent', border: 'none', color: '#5A4B3D', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', fontWeight: 'bold' }}
            >
              <RefreshCw size={10} className={loadingData ? 'spin' : ''} /> Refresh
            </button>
          </div>

          {/* GOOGLE MAP LAYER */}
          <div style={{ position: 'relative', width: '100%', height: '210px', background: '#242f3e', borderRadius: '10px', overflow: 'hidden', border: '3.5px double #8B5E34', flexShrink: 0 }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }}>
              {!googleLoaded && (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#B3A387', fontSize: '0.85rem' }}>
                  Loading Google Maps...
                </div>
              )}
            </div>
          </div>

          {/* CATEGORY FILTERS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#5A4B3D', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={11} /> Filter By Category
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {Array.from(new Set(heatmapData.map(issue => issue.type))).map(type => {
                const active = selectedTypes[type];
                const activeColor = getPillColor(type);
                const displayLabels = {
                  'Pothole': 'Potholes',
                  'Water Leakage': 'Water Leakage',
                  'Garbage': 'Garbage',
                  'Streetlights': 'Streetlights',
                  'Infrastructure': 'Infrastructure'
                };
                return (
                  <div
                    key={type}
                    onClick={() => toggleType(type)}
                    className="filter-pill"
                    style={{
                      backgroundColor: active ? activeColor : 'rgba(90, 75, 61, 0.15)',
                      color: active ? '#FFF' : '#5A4B3D',
                      borderColor: active ? activeColor : 'rgba(90, 75, 61, 0.3)'
                    }}
                  >
                    <span>{type === 'Pothole' ? '🔴' : type === 'Water Leakage' ? '🔵' : type === 'Garbage' ? '🟢' : type === 'Streetlights' ? '🟡' : '🟣'}</span>
                    <span>{displayLabels[type] || type}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TIME TABS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#5A4B3D', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={11} /> Time Horizon
            </div>
            <div style={{ display: 'flex', width: '100%' }}>
              {[
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'all', label: 'All Time' }
              ].map(tab => (
                <div
                  key={tab.id}
                  onClick={() => setTimeFilter(tab.id)}
                  className={`time-tab ${timeFilter === tab.id ? 'time-tab--active' : ''}`}
                >
                  {tab.label}
                </div>
              ))}
            </div>
          </div>

          {/* AI PREDICTION INSIGHTS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '2px dashed rgba(90, 75, 61, 0.3)', paddingTop: '10px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#6B46C1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={13} fill="#6B46C1" /> AI Predictive Insights
              </div>
            </div>

            {loadingInsights ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ height: '35px', background: 'rgba(90, 75, 61, 0.1)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                <div style={{ height: '35px', background: 'rgba(90, 75, 61, 0.1)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
              </div>
            ) : insights.length === 0 ? (
              <span style={{ fontStyle: 'italic', fontSize: '0.78rem', color: '#5C4A38' }}>No predictive insights compiled yet.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {insights.map((insight, idx) => (
                  <div key={idx} className="insight-card">
                    {insight}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ALERTS SUMMARY FOOTER */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.85rem',
          fontWeight: 700,
          borderTop: '2.5px solid #5C4033',
          paddingTop: '12px'
        }}>
          <span>Hotspots Monitored: {loadingData ? '...' : heatmapData.length}</span>
          <span style={{ color: '#ECC94B', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={16} />
            <span>Updates: Realtime</span>
          </span>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
