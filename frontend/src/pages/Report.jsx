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
  { id: 'cracked_road', category: '🛣️ Roads', severity: 'High', priority: 'Urgent', location: '125 Main St', mapX: 220, mapY: 50 },
  { id: 'water_leak', category: '💧 Water', severity: 'High', priority: 'Urgent', location: '42 Fountain Plaza', mapX: 120, mapY: 30 },
  { id: 'broken_light', category: '💡 Electricity', severity: 'High', priority: 'Urgent', location: '88 Blacksmith Lane', mapX: 310, mapY: 70 },
  { id: 'waste', category: '🗑️ Waste Management', severity: 'High', priority: 'Urgent', location: 'East District Alley', mapX: 180, mapY: 80 },
  { id: 'infrastructure', category: '🏗️ Public Infrastructure', severity: 'High', priority: 'Urgent', location: 'Central Bridge', mapX: 200, mapY: 100 },
  { id: 'environment', category: '🌳 Environment', severity: 'Medium', priority: 'Moderate', location: 'City Park', mapX: 90, mapY: 150 },
  { id: 'traffic_safety', category: '🚦 Traffic & Safety', severity: 'High', priority: 'Urgent', location: 'Main Intersection', mapX: 150, mapY: 180 },
  { id: 'public_safety', category: '🚨 Public Safety', severity: 'Critical', priority: 'Critical', location: 'Downtown', mapX: 250, mapY: 120 }
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
  const [locationStatus, setLocationStatus] = useState('Locating...');
  const [testingMode, setTestingMode] = useState(false);

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
              const parts = data.display_name.split(',').map(p => p.trim());
              const preciseAddress = parts.slice(0, 3).join(', ');
              setAddress(preciseAddress || data.display_name);
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
  const [selectedFile, setSelectedFile] = useState(null);

  // UI States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [submitError, setSubmitError] = useState('');

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [submitDetails, setSubmitDetails] = useState(null);

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
    if (fileInputRef.current) {
      fileInputRef.current.value = null; // Clear to allow selecting the same file again
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setIsAnalyzing(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        setTimeout(() => {
          setSketchUrl(event.target.result);
          setIsUploaded(true);
          setIsVideo(false);
          setIsAnalyzing(false);
        }, 1200); // simulated analysis time
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoClick = () => {
    if (videoInputRef.current) {
      videoInputRef.current.value = null; // Clear to allow selecting the same file again
      videoInputRef.current.click();
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsUploaded(true);
        setIsVideo(true);
        setSketchUrl(URL.createObjectURL(file));
        setIsAnalyzing(false);
      }, 1500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!selectedFile) {
      setSubmitError('Please upload a photo of the anomaly so our AI can verify and categorize it!');
      return;
    }

    setIsSubmitting(true);
    setSubmitPhase('wax');

    setTimeout(() => setSubmitPhase('stamp'), 800);
    setTimeout(() => setSubmitPhase('falcon'), 1600);

    try {
      const reported = {
        title: 'Civic Issue Report',
        type: currentIssue.id,
        location: address || 'Unknown Coordinates',
        description: `Reported civic issue at ${address || 'this location'}.`,
        severity: currentIssue.severity.toLowerCase(),
        lat: coords.lat,
        lng: coords.lng,
        category: currentIssue.category,
      };

      // Run API call and animation delay in parallel
      const apiPromise = reportIssue(reported, selectedFile);
      const delayPromise = new Promise(resolve => setTimeout(resolve, 2800));
      
      const [result] = await Promise.all([apiPromise, delayPromise]);
      
      const points = result?.pointsAwarded || 0;
      setEarnedPoints(points);

      // Use Gemini's detected issue type as the category display name
      const aiData = result?.issue?.aiAnalysis;
      setSubmitDetails({
        severity: aiData?.severity || result?.issue?.severity || reported.severity,
        reportOrder: result?.reportOrder || 1,
        aiAnalysis: aiData,
        // Show Gemini's exact detected type, not the frontend hardcoded category
        category: aiData?.type || result?.issue?.category || 'Civic Issue'
      });
      
      setIsSubmitting(false);
      setSubmitPhase('');
      setShowSuccess(true);
    } catch (err) {
      console.error('Failed to submit report', err);
      const errorMsg = err.message || 'Failed to submit report';
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitPhase('');
        // Check if this is an invalid image rejection from AI
        const isInvalidImage = errorMsg.toLowerCase().includes('valid civic issue') ||
          errorMsg.toLowerCase().includes('does not appear') ||
          errorMsg.toLowerCase().includes('not a civic');
        setSubmitError(
          isInvalidImage
            ? '🚫 Our AI Oracle could not verify this as a civic issue. Please upload a clear photo of an actual public problem (pothole, garbage, broken streetlight, etc.).'
            : `Could not file your petition: ${errorMsg}`
        );
      }, 2800);
    }
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

      {/* ── ERROR BANNER ─────────────────────────────────────────── */}
      {submitError && (
        <div style={{
          width: '100%',
          maxWidth: '500px',
          background: 'rgba(181, 63, 63, 0.92)',
          border: '2px solid #B53F3F',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          boxSizing: 'border-box',
          marginTop: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
        }}>
          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontFamily: "'MedievalSharp', serif", fontWeight: 'bold', color: '#FFF', fontSize: '0.9rem', marginBottom: '4px' }}>
              Petition Denied by Oracle
            </div>
            <div style={{ color: '#FFD0D0', fontSize: '0.82rem', lineHeight: '1.4' }}>
              {submitError}
            </div>
          </div>
          <button
            onClick={() => setSubmitError('')}
            style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '1.1rem', marginLeft: 'auto', flexShrink: 0, padding: '0 4px' }}
          >✕</button>
        </div>
      )}

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

            {/* AI Analysis Panel */}
            {submitDetails?.aiAnalysis && (
              <div style={{
                width: '100%',
                background: '#4A3B32',
                borderRadius: '8px',
                padding: '12px',
                color: '#F5E6C4',
                textAlign: 'left',
                boxSizing: 'border-box',
                border: '1px solid #2D1B13'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#D4AF37', fontWeight: 900 }}>AI Oracle Analysis</span>
                  <div style={{
                    background: '#2E6B2A',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}>
                    {Math.round((submitDetails.aiAnalysis.confidence || 0.8) * 100)}% Confidence
                  </div>
                </div>

                {/* Prominent issue type badge */}
                <div style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid #D4AF37',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '0.65rem', color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Detected Issue:</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#F5E6C4' }}>
                    {submitDetails.aiAnalysis.type || submitDetails.category || 'Civic Issue'}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', marginBottom: '8px', lineHeight: '1.4', color: '#C4A484', fontStyle: 'italic' }}>
                  {submitDetails.aiAnalysis.sceneDescription || submitDetails.aiAnalysis.summary || 'Anomaly detected.'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                  <div><strong>Severity:</strong> {submitDetails.aiAnalysis.severity}</div>
                  <div><strong>Priority:</strong> {submitDetails.aiAnalysis.priority}</div>
                  <div><strong>Authority:</strong> {submitDetails.aiAnalysis.recommendedAuthority}</div>
                  <div><strong>Safety:</strong> {submitDetails.aiAnalysis.safetyLevel || 'Caution'}</div>
                </div>
                {submitDetails.aiAnalysis.citizenAdvice && (
                  <div style={{ marginTop: '8px', fontSize: '0.8rem', fontStyle: 'italic', color: '#C4A484' }}>
                    "{submitDetails.aiAnalysis.citizenAdvice}"
                  </div>
                )}
              </div>
            )}

            {!submitDetails?.aiAnalysis && (
              <p style={{ fontSize: '0.95rem', color: '#3C2D24', margin: 0, lineHeight: '1.5', fontWeight: 600 }}>
                <br/><br/>
                <strong>Issue Type:</strong> {submitDetails?.category || 'Civic Anomaly'}<br/>
                <strong>Issue Severity:</strong> {submitDetails?.severity ? submitDetails.severity.charAt(0).toUpperCase() + submitDetails.severity.slice(1) : 'Medium'}<br/>
                <strong>Reporter Status:</strong> {submitDetails?.reportOrder === 1 ? '1st (First Reporter!)' : submitDetails?.reportOrder + (submitDetails?.reportOrder===2?'nd':submitDetails?.reportOrder===3?'rd':'th') + ' Reporter'}
              </p>
            )}

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
              <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2E6B2A' }}>+{earnedPoints} XP</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#3C2D24', textTransform: 'uppercase' }}>Civic Bounty Awarded</div>
                <div style={{ fontSize: '0.75rem', color: '#5C4A38' }}>Ledger updated with experiences!</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '10px' }}>
              <button
                onClick={() => {
                  setShowSuccess(false);
                  setSelectedFile(null);
                  setSketchUrl(null);
                  setIsUploaded(false);
                  setIsVideo(false);
                }}
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
