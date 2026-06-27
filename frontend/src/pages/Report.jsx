import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import BottomNav from '../components/BottomNav';
import {
  Camera,
  Video,
  Home,
  Map,
  CheckSquare,
  Scroll,
  Trophy,
  CheckCircle,
  Clock,
  X,
  Activity,
  MapPin
} from 'lucide-react';

/* ── NAV ITEMS ───────────────────────────────────────────── */
const NAV_ITEMS = [
  { Icon: Home, label: 'Home', path: '/dashboard' },
  { Icon: Map, label: 'Map', path: '/map' },
  { Icon: CheckSquare, label: 'Mission', path: '/missions' },
  { Icon: Scroll, label: 'Report', path: '/report' },
  { Icon: Activity, label: 'Impact', path: '/impact' },
  { Icon: MapPin, label: 'Heatmap', path: '/heatmap' },
  { Icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
];

/* ── CLASS MAPS & DATA ───────────────────────────────────── */
const ISSUES = [
  {
    id: 'cracked_road',
    category: 'Pothole',
    severity: 'High',
    priority: 'Urgent',
    location: '125 Main St',
    mapX: 220,
    mapY: 50,
  },
  {
    id: 'water_leak',
    category: 'Ruptured Aqueduct',
    severity: 'Medium',
    priority: 'Moderate',
    location: '42 Fountain Plaza',
    mapX: 120,
    mapY: 30,
  },
  {
    id: 'broken_light',
    category: 'Darksome Lantern',
    severity: 'High',
    priority: 'Urgent',
    location: '88 Blacksmith Lane',
    mapX: 310,
    mapY: 70,
  },
  {
    id: 'other',
    category: 'Mysterious Blight',
    severity: 'Low',
    priority: 'Low',
    location: 'Whispering Woods Borders',
    mapX: 180,
    mapY: 80,
  }
];

export default function Report() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addXp, missions, reportIssue } = useGame();

  // Selected Anomaly Index (cycles through ISSUES on tap)
  const [issueIndex, setIssueIndex] = useState(0);
  const currentIssue = ISSUES[issueIndex];

  // Geolocation & Address States
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState({ lat: 40.7128, lng: -74.0060 }); // Default NYC fallback
  const [hasLocation, setHasLocation] = useState(false);

  // Ask for geolocation and reverse geocode when page starts, with IP fallback
  useEffect(() => {
    const fetchIPLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data && data.latitude && data.longitude) {
          const lat = data.latitude;
          const lng = data.longitude;
          setCoords({ lat, lng });
          setHasLocation(true);

          const city = data.city || '';
          const region = data.region || '';
          const country = data.country_name || '';
          const cleanAddress = [city, region, country].filter(Boolean).join(', ');
          setAddress(cleanAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } else {
          setAddress('Coordinates Unknown');
        }
      } catch (err) {
        console.error("IP Geolocation fallback failed:", err);
        setAddress('Coordinates Unknown');
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lng: longitude });
          setHasLocation(true);

          try {
            // Fetch clean address from OpenStreetMap's Nominatim reverse geocoder
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            if (data && data.display_name) {
              const addr = data.address;
              const street = addr.road || addr.suburb || addr.pedestrian || '';
              const city = addr.city || addr.town || addr.village || '';
              const country = addr.country || '';
              const cleanAddress = [street, city, country].filter(Boolean).join(', ');
              setAddress(cleanAddress || data.display_name);
            } else {
              setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
            }
          } catch (err) {
            console.error("Error reverse geocoding, using coords:", err);
            setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          }
        },
        (error) => {
          console.warn("Native geolocation failed or blocked. Fetching IP fallback...", error);
          fetchIPLocation();
        },
        { timeout: 6000, enableHighAccuracy: true }
      );
    } else {
      fetchIPLocation();
    }
  }, []);

  // States
  const [isUploaded, setIsUploaded] = useState(true); // default true to match reference immediately
  const [isVideo, setIsVideo] = useState(false);
  const [sketchUrl, setSketchUrl] = useState(null);

  // UI States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Cycle issue type to allow interactive testing
  const handleCycleIssue = () => {
    setIssueIndex(prev => (prev + 1) % ISSUES.length);
  };

  // Toggle severity
  const handleCycleSeverity = (e) => {
    e.stopPropagation();
    // Cycle: High -> Medium -> Low
    const severities = ['High', 'Medium', 'Low'];
    const priorities = ['Urgent', 'Moderate', 'Low'];
    const nextIdx = (severities.indexOf(currentIssue.severity) + 1) % severities.length;
    currentIssue.severity = severities[nextIdx];
    currentIssue.priority = priorities[nextIdx];
    setIssueIndex(prev => prev); // force re-render
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsAnalyzing(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        setTimeout(() => {
          setSketchUrl(event.target.result);
          setIsUploaded(true);
          setIsVideo(false);
          setIsAnalyzing(false);
          // Randomly change issue type for dynamic feel
          setIssueIndex(Math.floor(Math.random() * ISSUES.length));
        }, 1200); // simulated analysis time
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoClick = () => {
    if (videoInputRef.current) videoInputRef.current.click();
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsUploaded(true);
        setIsVideo(true);
        setSketchUrl(URL.createObjectURL(file));
        setIsAnalyzing(false);
        setIssueIndex(Math.floor(Math.random() * ISSUES.length));
      }, 1500);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    setSubmitPhase('wax');

    setTimeout(() => {
      setSubmitPhase('stamp');
    }, 800);

    setTimeout(() => {
      setSubmitPhase('falcon');
    }, 1600);

    setTimeout(() => {
      // Report issue to global state using user's real location
      const reported = {
        title: `${currentIssue.category} Incident`,
        type: currentIssue.id,
        location: address || 'Unknown Coordinates',
        description: `Magical AI vision detected a ${currentIssue.category} with ${currentIssue.severity} severity.`,
        severity: currentIssue.severity.toLowerCase(),
      };

      reportIssue(reported);
      addXp(150); // Award 150 XP

      setIsSubmitting(false);
      setSubmitPhase('');
      setShowSuccess(true);
    }, 2800);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#2D1B13',
      backgroundImage: "url('/map_bg.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      padding: '24px 16px 120px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      color: '#F4E8C1',
      boxSizing: 'border-box'
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap');
        
        .medieval-font {
          font-family: 'MedievalSharp', serif;
        }

        /* Scroll Styling */
        /* Scroll Styling */
        .scroll-wrapper {
          width: 100%;
          max-width: 500px;
          aspect-ratio: 0.65; /* Made taller to fit the map */
          position: relative;
          background-image: url('/report.png'); /* Using high-res AI cutout */
          background-size: 100% 100%;
          background-repeat: no-repeat;
          background-position: center;
          margin-bottom: 20px;
          font-family: 'MedievalSharp', serif;
        }

        /* Absolutely positioned inner elements */
        .scroll-title {
          position: absolute;
          top: 6%;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 1.6rem;
          font-weight: 900;
          letter-spacing: 0.5px;
          color: #111;
          margin: 0;
        }

        .scroll-upload-btn {
          position: absolute;
          top: 16.5%;
          left: 20.0%;
          width: 30.0%;
          height: 31.5%;
        }

        .scroll-video-btn {
          position: absolute;
          top: 16.5%;
          left: 51%;
          width: 30.0%;
          height: 31.5%;
        }

        .scroll-location-container {
          position: absolute;
          top: 51.5%;
          left: 24.5%;
          right: 24.5%;
          display: flex;
          flex-direction: column;
        }

        .scroll-location-label {
          color: #111;
          font-weight: 900;
          font-size: 0.95rem;
          margin-bottom: 2px;
          text-align: left;
        }

        .scroll-location-display {
          width: 100%;
          padding: 6px 10px;
          font-family: 'MedievalSharp', serif;
          font-weight: bold;
          font-size: 0.95rem;
          color: #3e2723;
          background: rgba(255, 255, 255, 0.4);
          border: 2px solid #5a4b3d;
          border-radius: 6px;
          box-sizing: border-box;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .scroll-map-container {
          position: absolute;
          top: 64%;
          left: 15.5%;
          right: 15.5%;
          height: 19.5%;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid #5a4b3d;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
        }

        /* Submit Button Overlay on the bottom roll */
        .scroll-submit-btn {
          position: absolute;
          bottom: 3.5%;
          left: 10%;
          right: 10%;
          height: 8%;
          background: transparent;
          border: none;
          color: #111;
          font-family: 'MedievalSharp', serif;
          font-size: 1.3rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          outline: none;
          transition: transform 0.1s;
        }
        .scroll-submit-btn:active {
          transform: scale(0.98);
        }

        /* Media Button Styles */
        .media-btn {
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #111;
          font-family: 'MedievalSharp', serif;
          font-weight: bold;
          font-size: 1.25rem;
        }
        .media-btn:hover {
          transform: translateY(-2px) scale(1.02);
        }
        .media-btn:active {
          transform: translateY(0) scale(0.98);
        }

        /* Map Pin Pulse */
        @keyframes mapPulse {
          0% { transform: scale(0.9); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 0.8; }
          100% { transform: scale(0.9); opacity: 0.4; }
        }
        .map-pulse-circle {
          animation: mapPulse 2s infinite ease-in-out;
        }
      `}</style>

      {/* ── THE PARCHMENT SCROLL WRAPPER ───────────────────────── */}
      <div className="scroll-wrapper">

        {/* Title inside scroll */}
        <h2 className="scroll-title">
          Report Issue
        </h2>

        {/* Media Buttons matching the drawn boxes */}
        <div className="scroll-upload-btn">
          <button type="button" className="media-btn" onClick={handleUploadClick}>
            <Camera size={56} strokeWidth={2.5} color="#4A3B32" />
            <span>Upload</span>
          </button>
        </div>

        <div className="scroll-video-btn">
          <button type="button" className="media-btn" onClick={handleVideoClick}>
            <Video size={56} strokeWidth={2.5} color="#4A3B32" />
            <span>Video</span>
          </button>
        </div>

        {/* Hidden File Picker */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />

        {/* Hidden Video Picker */}
        <input
          type="file"
          ref={videoInputRef}
          onChange={handleVideoChange}
          accept="video/*"
          capture="environment"
          style={{ display: 'none' }}
        />

        {/* User Location Display */}
        <div className="scroll-location-container">
          <label className="scroll-location-label">Location</label>
          <div className="scroll-location-display" title={address || 'Detecting location...'}>
            {address || 'Detecting location...'}
          </div>
        </div>

        {/* Live Map view embedding OpenStreetMap iframe centered at user coordinates */}
        <div className="scroll-map-container">
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight="0"
            marginWidth="0"
            src={
              hasLocation
                ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.003}%2C${coords.lat - 0.002}%2C${coords.lng + 0.003}%2C${coords.lat + 0.002}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`
                : `https://www.openstreetmap.org/export/embed.html?bbox=-74.009%2C40.7118%2C-74.003%2C40.7138&layer=mapnik&marker=40.7128%2C-74.0060`
            }
            style={{ border: 'none', filter: 'sepia(0.2) hue-rotate(5deg) contrast(1.05)' }}
          />
        </div>

        {/* Bottom Roller / Submit Button */}
        <button type="button" className="scroll-submit-btn" onClick={handleSubmit}>
          SUBMIT REPORT
        </button>

      </div>

      {/* ── SUBMITTING ANIMATION OVERLAY ────────────────────────── */}
      {isSubmitting && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 6, 4, 0.94)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          fontFamily: "'MedievalSharp', serif",
          color: '#F4E8C1',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: '#2D1B13',
            border: '4px solid var(--panel-border)',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 15px 40px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px'
          }}>
            <div style={{
              position: 'relative',
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                border: '4px dashed #D4AF37',
                borderRadius: '50%',
                animation: 'spin 4s linear infinite',
              }} />
              <Scroll size={36} color="#D4AF37" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {submitPhase === 'wax' && (
                <>
                  <h3 style={{ fontSize: '1.4rem', color: '#D4AF37', margin: 0 }}>Melting Sealing Wax</h3>
                  <p style={{ fontSize: '0.9rem', color: '#B3A387', margin: 0 }}>Preparing the Royal Guild stamp...</p>
                </>
              )}
              {submitPhase === 'stamp' && (
                <>
                  <h3 style={{ fontSize: '1.4rem', color: '#D4AF37', margin: 0 }}>Stamping Citizen's Crest</h3>
                  <p style={{ fontSize: '0.9rem', color: '#B3A387', margin: 0 }}>Securing the integrity of the scroll...</p>
                </>
              )}
              {submitPhase === 'falcon' && (
                <>
                  <h3 style={{ fontSize: '1.4rem', color: '#D4AF37', margin: 0 }}>Carrier Falcon Dispatched</h3>
                  <p style={{ fontSize: '0.9rem', color: '#B3A387', margin: 0 }}>Winged messenger flying to the guild archives...</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS MODAL OVERLAY ────────────────────────────────── */}
      {showSuccess && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 6, 4, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            background: '#F5E6C4',
            border: '6px double #5C4033',
            borderRadius: '12px',
            color: '#3e2723',
            padding: '40px 32px',
            boxShadow: '0 15px 40px rgba(0,0,0,0.8), inset 0 0 45px rgba(139,94,52,0.18)',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#B53F3F',
              border: '2px double #D4AF37',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
              transform: 'rotate(-5deg)'
            }}>
              <CheckCircle size={32} />
            </div>

            <h2 className="medieval-font" style={{ fontSize: '1.8rem', color: '#2E2018', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Petition Dispatched!
            </h2>

            <p style={{ fontSize: '0.95rem', color: '#3C2D24', margin: 0, lineHeight: '1.5', fontWeight: 600 }}>
              The Guild has received your scroll. Artisans have been dispatched to investigate and repair the anomaly at the coordinates.
            </p>

            <div style={{
              background: 'rgba(46, 26, 10, 0.08)',
              border: '2px dashed #4A3B32',
              borderRadius: '10px',
              padding: '12px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxSizing: 'border-box'
            }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2E6B2A' }}>+0 XP</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#3C2D24', textTransform: 'uppercase' }}>Civic Bounty Awarded</div>
                <div style={{ fontSize: '0.75rem', color: '#5C4A38' }}>Ledger updated with experiences!</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '10px' }}>
              <button
                onClick={() => setShowSuccess(false)}
                className="medieval-font"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '2px solid #4A3B32',
                  borderRadius: '8px',
                  color: '#3C2D24',
                  fontWeight: 'bold',
                  padding: '12px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Draft Another
              </button>
              <button
                onClick={() => navigate('/map')}
                className="medieval-font"
                style={{
                  flex: 1,
                  background: '#2E6B2A',
                  border: '2px solid #1c4519',
                  borderRadius: '8px',
                  color: '#FFF',
                  fontWeight: 'bold',
                  padding: '12px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
                }}
              >
                Return to Map
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />

    </div>
  );
}
