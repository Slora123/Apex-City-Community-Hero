import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import BottomNav from '../components/BottomNav';
import * as api from '../api';
import {
  X,
  Camera,
  Compass,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Award,
  Navigation,
  Check,
  RefreshCw,
  Eye,
  AlertCircle,
  UploadCloud,
  History
} from 'lucide-react';


/* ── CUSTOM CARTOON SVG ILLUSTRATIONS (BEFORE & AFTER STATES) ─────── */

// 1. Pothole / Cracked Road Cartoon Illustration
export const PotholeIllustration = ({ repaired = false }) => (
  <svg viewBox="0 0 400 220" width="100%" height="100%" style={{ background: '#A1C78D', borderRadius: '8px' }}>
    {/* Sky & Hills */}
    <path d="M0,120 Q100,80 200,120 T400,120 L400,220 L0,220 Z" fill="#88B07D" />
    <circle cx="320" cy="50" r="30" fill="#FFFBE6" opacity="0.9" />
    <path d="M0,0 L400,0 L400,100 Q300,70 200,90 T0,80 Z" fill="#80B3FF" />
    
    {/* Road going into horizon */}
    <path d="M160,110 L240,110 L350,220 L50,220 Z" fill="#5A6268" />
    <path d="M200,110 L200,220" stroke="#FFD166" strokeWidth="4" strokeDasharray="12,12" />
    
    {/* Road Sign (Left Side) */}
    <g transform="translate(70, 110)">
      {/* Sign Post */}
      <rect x="18" y="10" width="5" height="80" fill="#7D5C43" stroke="#4D331F" strokeWidth="1.5" />
      
      {!repaired ? (
        /* Warning Sign (Exclamation Diamond) */
        <g transform="translate(20, 20) rotate(45)">
          <rect x="-20" y="-20" width="40" height="40" rx="4" fill="#FF8C00" stroke="#A84C00" strokeWidth="2" />
          <g transform="rotate(-45)">
            <rect x="-3" y="-12" width="6" height="15" rx="2" fill="#FFF" />
            <circle cx="0" cy="8" r="3" fill="#FFF" />
          </g>
        </g>
      ) : (
        /* Green Resolved Sign (Checkmark Rectangle) */
        <g transform="translate(20, 20)">
          <rect x="-25" y="-16" width="50" height="32" rx="4" fill="#2E6B2A" stroke="#1C4519" strokeWidth="2" />
          {/* White/light checkmark */}
          <path d="M-10,0 L-3,7 L12,-8" fill="none" stroke="#FFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </g>

    {!repaired ? (
      /* Pothole & Cracks (Damaged state) */
      <g>
        <ellipse cx="200" cy="180" rx="45" ry="18" fill="#2E3236" />
        <ellipse cx="198" cy="177" rx="38" ry="13" fill="#1A1C1E" />
        {/* Crack lines */}
        <path d="M160,180 L140,185 L130,182" stroke="#1A1C1E" strokeWidth="2.5" fill="none" />
        <path d="M240,180 L265,182 L275,189" stroke="#1A1C1E" strokeWidth="2.5" fill="none" />
      </g>
    ) : (
      /* Clean Paved Asphalt Patch (Repaired state) */
      <g>
        <ellipse cx="200" cy="180" rx="42" ry="16" fill="#444B50" stroke="#333" strokeWidth="1" />
        <ellipse cx="199" cy="179" rx="39" ry="14" fill="#3E4448" />
        {/* Subtle patch texture lines */}
        <path d="M185,175 Q200,170 215,175" stroke="#5A6268" strokeWidth="1.5" strokeDasharray="3,3" fill="none" />
      </g>
    )}
  </svg>
);

// 2. Ruptured Aqueduct / Water Leak Cartoon Illustration
export const WaterLeakIllustration = ({ repaired = false }) => (
  <svg viewBox="0 0 400 220" width="100%" height="100%" style={{ background: '#A1C78D', borderRadius: '8px' }}>
    {/* Sky & Background */}
    <path d="M0,0 L400,0 L400,120 Q300,90 200,100 T0,110 Z" fill="#80B3FF" />
    <path d="M0,120 Q150,90 300,130 T400,120 L400,220 L0,220 Z" fill="#88B07D" />
    
    {/* Stone Aqueduct Arch */}
    <g transform="translate(100, 70)">
      {/* Pillars */}
      <rect x="20" y="20" width="40" height="110" fill="#8E8F91" stroke="#4E4F51" strokeWidth="2" rx="4" />
      <rect x="140" y="20" width="40" height="110" fill="#8E8F91" stroke="#4E4F51" strokeWidth="2" rx="4" />
      {/* Arch Bridge Top */}
      <rect x="0" y="0" width="200" height="35" fill="#A4A5A8" stroke="#4E4F51" strokeWidth="2" rx="4" />
      <path d="M60,35 A40,40 0 0,1 140,35 Z" fill="#88B07D" stroke="#4E4F51" strokeWidth="2" />
      
      {/* Brick lines */}
      <line x1="20" y1="50" x2="60" y2="50" stroke="#4E4F51" strokeWidth="1.5" />
      <line x1="140" y1="70" x2="180" y2="70" stroke="#4E4F51" strokeWidth="1.5" />
      
      {!repaired ? (
        /* The Leak / Water Spray (Damaged state) */
        <g>
          <path d="M40,65 Q-20,90 -10,140 Q15,120 40,80 Z" fill="#4CC9F0" opacity="0.85" />
          <circle cx="-10" cy="130" r="6" fill="#FFF" opacity="0.8" />
          <circle cx="-5" cy="140" r="4" fill="#FFF" opacity="0.9" />
          <ellipse cx="30" cy="125" rx="35" ry="12" fill="#4CC9F0" opacity="0.9" />
          {/* Cracked wall lines */}
          <path d="M40,60 L32,65 L44,70" stroke="#222" strokeWidth="2.5" fill="none" />
        </g>
      ) : (
        /* Fresh Mortar Repair Patch (Repaired state) */
        <g>
          <polygon points="30,55 50,58 45,72 28,68" fill="#B3A387" stroke="#4E4F51" strokeWidth="1.5" />
          {/* Trowel marks */}
          <path d="M32,62 Q40,60 46,64" stroke="#8B7E66" strokeWidth="1" fill="none" />
        </g>
      )}
    </g>
  </svg>
);

// 3. Broken Lantern / Light Cartoon Illustration
export const BrokenLightIllustration = ({ repaired = false }) => (
  <svg viewBox="0 0 400 220" width="100%" height="100%" style={{ background: '#3D348B', borderRadius: '8px' }}>
    {/* Moon & Night Sky */}
    <circle cx="300" cy="60" r="25" fill="#FFFBE6" opacity="0.8" />
    <path d="M0,150 Q120,120 240,160 T400,150 L400,220 L0,220 Z" fill="#2E3A2F" />
    
    {/* Street Lantern Pole */}
    <g transform="translate(180, 40)">
      {/* Iron Pole */}
      <rect x="18" y="30" width="6" height="150" fill="#4A4E69" stroke="#222" strokeWidth="2" />
      {/* Hanging bracket */}
      <path d="M24,50 Q45,30 45,55 L24,55" fill="none" stroke="#4A4E69" strokeWidth="3" />
      
      {/* Lantern housing */}
      <polygon points="35,55 55,55 60,85 30,85" fill="#22223B" stroke="#222" strokeWidth="2" />
      
      {!repaired ? (
        /* Broken glass and dead bulb (Damaged state) */
        <g>
          <polygon points="37,58 53,58 57,82 33,82" fill="#F4E8C1" opacity="0.15" />
          <path d="M38,62 L48,70 L52,60" stroke="#FFF" strokeWidth="1.5" fill="none" opacity="0.6" />
          <line x1="45" y1="55" x2="45" y2="85" stroke="#111" strokeWidth="2" />
          <line x1="33" y1="75" x2="57" y2="68" stroke="#111" strokeWidth="2" />
          <circle cx="45" cy="70" r="8" fill="#444" stroke="#222" strokeWidth="1.5" />
        </g>
      ) : (
        /* Glowing yellow light source (Repaired state) */
        <g>
          {/* Radial Light Glow */}
          <circle cx="45" cy="70" r="38" fill="#FFD166" opacity="0.4" />
          <circle cx="45" cy="70" r="24" fill="#FFD166" opacity="0.6" />
          {/* Intact glass casing */}
          <polygon points="37,58 53,58 57,82 33,82" fill="#FFFBE6" opacity="0.4" />
          {/* Shining Light Bulbs */}
          <circle cx="45" cy="70" r="9" fill="#FFF" stroke="#FFD166" strokeWidth="1" />
          {/* Light Rays */}
          <line x1="45" y1="50" x2="45" y2="40" stroke="#FFD166" strokeWidth="2" />
          <line x1="45" y1="90" x2="45" y2="100" stroke="#FFD166" strokeWidth="2" />
          <line x1="25" y1="70" x2="15" y2="70" stroke="#FFD166" strokeWidth="2" />
          <line x1="65" y1="70" x2="75" y2="70" stroke="#FFD166" strokeWidth="2" />
        </g>
      )}
    </g>
  </svg>
);

export default function Missions() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hero, addXp, missions, updateMissionStatus, refreshMissions, refreshHero, missionToast, clearMissionToast } = useGame();

  // State Machine: 'list' | 'details' | 'capture_before' | 'capture_after' | 'verification' | 'success'
  const [view, setView] = useState('list');
  const [selectedMission, setSelectedMission] = useState(null);
  const [severity, setSeverity] = useState('Medium');
  const [gpsStatus, setGpsStatus] = useState('Connecting...');
  // Quest tab: 'global' | 'local'
  const [questTab, setQuestTab] = useState('local');
  // Live locality name resolved from GPS (saved in sessionStorage or fallback to hero profile)
  const [localityName, setLocalityName] = useState(() => {
    return sessionStorage.getItem('ch_current_district') || (hero && (hero.area || hero.city)) || 'Nearby';
  });

  // Fetch nearby missions + resolve current locality name from live GPS
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        refreshMissions(latitude, longitude);

        // Reverse geocode with Nominatim to get the most precise locality
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`
          );
          const data = await res.json();
          if (data?.address) {
            const a = data.address;
            // Priority: state_district > district > county > city_district > city > town > suburb > village > neighbourhood
            const name =
              a.state_district ||
              a.district ||
              a.county ||
              a.city_district ||
              a.city ||
              a.town ||
              a.suburb ||
              a.village ||
              a.neighbourhood ||
              'Nearby';
            setLocalityName(name);
            if (name && name !== 'Nearby') {
              sessionStorage.setItem('ch_current_district', name);
            }
          }
        } catch (err) {
          console.warn('Reverse geocode failed for locality name:', err);
        }
      },
      (err) => console.warn('Could not get location for mission filtering', err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [refreshMissions]);

  // Refresh missions list when user switches tabs (e.g. to Completed)
  useEffect(() => {
    refreshMissions();
  }, [questTab, refreshMissions]);


  // Track whether this mission was opened from the map's Accept flow
  const [fromMapAccept, setFromMapAccept] = useState(false);

  // Auto-open mission if navigated from map
  useEffect(() => {
    if (location.state?.openIssueId && missions.length > 0) {
      const issueToOpen = missions.find(m => m.issueId === location.state.openIssueId);
      if (issueToOpen) {
        setSelectedMission(issueToOpen);
        setSeverity(issueToOpen.severity ? issueToOpen.severity.charAt(0).toUpperCase() + issueToOpen.severity.slice(1) : 'Medium');
        setFromMapAccept(!!location.state?.startVerification);
        setView('details');
        
        // If startVerification — auto-trigger camera once details loads
        if (location.state?.startVerification) {
          setTimeout(() => {
            setView('capture_before');
            startCamera();
          }, 800);
        }

        // Clear state so it doesn't re-open on refresh or back
        window.history.replaceState({}, document.title);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, missions]);

  // Verification results
  const [resolutionStatus, setResolutionStatus] = useState('Fully Resolved');
  const [earnedXp, setEarnedXp] = useState(0);

  // Keep selectedMission in sync with the global missions list (so myVerdict/status updates after refresh propagate)
  useEffect(() => {
    if (selectedMission && view === 'details') {
      const freshMission = missions.find(m => m.id === selectedMission.id);
      if (freshMission) {
        setSelectedMission(prev => ({
          ...freshMission,
          // Preserve local overrides: if local myVerdict is set but fresh one isn't (lag), keep local
          myVerdict: freshMission.myVerdict || prev.myVerdict,
          // Take the higher count (never downgrade an optimistic increment)
          verificationCount: Math.max(freshMission.verificationCount || 0, prev.verificationCount || 0),
          status: freshMission.status === 'completed' ? 'completed' : (prev.status === 'completed' ? 'completed' : freshMission.status)
        }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missions]);


  // Poll every 4s while details are open on a mission awaiting verification
  useEffect(() => {
    if (view !== 'details' || !selectedMission) return;
    if (selectedMission.status !== 'Awaiting Community Verification') return;

    const interval = setInterval(() => {
      refreshMissions();
    }, 4000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedMission?.status, selectedMission?.id]);

  // Camera states & fallbacks
  const [cameraStream, setCameraStream] = useState(null);
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [cameraError, setCameraError] = useState(false);
  const [shutterFlash, setShutterFlash] = useState(false);

  // File upload states
  const [beforeFile, setBeforeFile] = useState(null);
  const [afterFile, setAfterFile] = useState(null);
  const [beforeFilePreview, setBeforeFilePreview] = useState(null);
  const [afterFilePreview, setAfterFilePreview] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('choice'); // 'choice' | 'camera' | 'file'

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Live GPS Tracking & Distance
  const [currentDistance, setCurrentDistance] = useState(null);

  useEffect(() => {
    let watchId;
    if (view === 'details' && selectedMission) {
      setGpsStatus('Connecting...');
      
      const updateDistance = (position) => {
        setGpsStatus('Connected');
        if (selectedMission.lat && selectedMission.lng) {
          const lat1 = position.coords.latitude;
          const lon1 = position.coords.longitude;
          const lat2 = selectedMission.lat;
          const lon2 = selectedMission.lng;
          
          // Haversine formula
          const R = 6371; // km
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
          const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          
          setCurrentDistance(dist);
        }
      };

      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(updateDistance, (err) => {
          console.warn('GPS Error:', err);
          setGpsStatus('Simulated (Offline)');
          setCurrentDistance(selectedMission.distance);
        }, { enableHighAccuracy: true });
      } else {
        setGpsStatus('Simulated (No GPS)');
        setCurrentDistance(selectedMission.distance);
      }
    }
    
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [view, selectedMission]);

  // Clean up camera stream when leaving camera views
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable, enabling simulated mockup camera.", err);
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraStream(null);
  };

  const handleOpenDetails = async (mission) => {
    try {
      if (mission.status === 'Active' && mission.aiAnalysis?.handler !== 'Authority') {
        await api.acceptMission(mission.id);
        mission.status = 'Accepted'; // Optimistic update
      }
      setSelectedMission(mission);
      if (mission.severity) {
        setSeverity(mission.severity.charAt(0).toUpperCase() + mission.severity.slice(1));
      } else {
        setSeverity('Medium');
      }
      setView('details');
      // Refresh missions so we get the latest verificationCount from DB
      refreshMissions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept mission');
    }
  };

  const handleStartVerification = async () => {
    try {
      if (selectedMission && selectedMission.status === 'Active') {
        await api.acceptMission(selectedMission.id);
        setSelectedMission(prev => ({
          ...prev,
          status: 'Accepted',
          assigneeId: hero.id
        }));
        updateMissionStatus(selectedMission.id, 'Accepted');
      }
      setView('capture_before');
      setUploadMethod('choice');
      setBeforeFile(null);
      setBeforeFilePreview(null);
      setAfterFile(null);
      setAfterFilePreview(null);
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to accept mission for verification');
    }
  };

  const handleFileSelected = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (view === 'capture_before') {
        setBeforeFile(file);
        setBeforeFilePreview(reader.result);
      } else {
        setAfterFile(file);
        setAfterFilePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const [isUploading, setIsUploading] = useState(false);

  const createDummyBlob = async () => {
    // Return a tiny 1x1 transparent png blob
    const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const res = await fetch(`data:image/png;base64,${b64}`);
    return res.blob();
  };

  const handleCapturePhoto = async () => {
    // Shutter flash animation
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 1200);

    if (view === 'capture_before') {
      setIsUploading(true);
      try {
        const photoToUpload = beforeFile || await createDummyBlob();
        await api.uploadBeforePhoto(selectedMission.id, photoToUpload);
        setBeforePhoto(true);
        setTimeout(() => {
          stopCamera();
          setView('capture_after');
          setUploadMethod('choice');
        }, 1000);
      } catch (e) {
        console.error("Before photo upload failed", e);
      }
      setIsUploading(false);
    } else if (view === 'capture_after') {
      setIsUploading(true);
      try {
        const photoToUpload = afterFile || await createDummyBlob();
        const result = await api.uploadAfterPhoto(selectedMission.id, photoToUpload);
        
        setAfterPhoto(true);
        // The backend `uploadAfterPhoto` returns { mission, comparison, pointsAwarded }
        // Let's go directly to success view and show the AI's result.
        setTimeout(() => {
          stopCamera();
          
          if (result && result.comparison) {
             const normVerdict = (result.comparison.verdict || '').toLowerCase().replace('_', ' ');
             const status = (normVerdict === 'resolved' || normVerdict === 'fully resolved') 
               ? 'Fully Resolved' 
               : (normVerdict === 'partially resolved' ? 'Partially Resolved' : 'Not Resolved');
             setResolutionStatus(status);
             setEarnedXp(result.pointsAwarded || result.comparison?.estimatedReward || selectedMission.aiAnalysis?.estimatedReward || 100);
             if (status === 'Not Resolved') {
               setView('details');
               setBeforePhoto(null);
               setAfterPhoto(null);
               setBeforeFile(null);
               setBeforeFilePreview(null);
               setAfterFile(null);
               setAfterFilePreview(null);
             } else {
               setView('success');
             }
          } else {
            // Fallback if comparison is missing
            setResolutionStatus('Fully Resolved');
            setEarnedXp(100);
            setView('success');
          }
        }, 1000);
      } catch (e) {
        console.error("After photo upload failed", e);
        setIsUploading(false);
      }
    }
  };
  // Resolution selection on the Verification Slide (Legacy / manual fallback)
  const handleSelectResolution = (status) => {
    const baseBounty = 0;
    
    setResolutionStatus(status);
    if (status === 'Fully Resolved') {
      setEarnedXp(baseBounty);
      setView('success');
    } else if (status === 'Partially Resolved') {
      setEarnedXp(Math.round(baseBounty * 0.5)); // 50% reward
      setView('success');
    } else if (status === 'Not Resolved') {
      // Return to details to recapture or cancel
      setView('details');
      setBeforePhoto(null);
      setAfterPhoto(null);
    }
  };

  const handleCompleteMission = () => {
    addXp(earnedXp);
    updateMissionStatus(selectedMission.id, 'completed');
    setView('list');
    navigate('/map');
  };

  const handleVote = async (verdict) => {
    // Optimistically update the UI immediately — hide buttons and show verdict
    setSelectedMission(prev => ({
      ...prev,
      myVerdict: verdict,
      verificationCount: (prev.verificationCount || 0) + 1  // optimistic increment
    }));

    try {
      const res = await api.verifyMission(selectedMission.backendId, verdict);
      if (res.pointsAwarded) {
        addXp(res.pointsAwarded);
      }
      // Apply backend-confirmed state
      setSelectedMission(prev => ({
        ...prev,
        status: res?.missionCompleted ? 'completed' : prev.status,
        myVerdict: verdict,
        // Use the confirmed DB count (takes priority over optimistic count)
        verificationCount: res.verificationCount ?? prev.verificationCount
      }));
      await refreshHero();
      await refreshMissions();
      // If mission got completed by this vote, remove it from the list and go back
      if (res?.missionCompleted) {
        updateMissionStatus(selectedMission.id, 'completed');
        setEarnedXp(res.pointsAwarded || 0);
        setTimeout(() => {
          setView('list');
        }, 2500); // Show the "Quest Accomplished" banner briefly, then go back
      }
    } catch (err) {
      // Error — keep the optimistic verdict so buttons stay hidden
      console.warn('Vote error (verdict kept):', err.message);
      await refreshMissions();
    }
  };


  const getIllustration = (type, repaired = false) => {
    switch (type) {
      case 'cracked_road':
        return <PotholeIllustration repaired={repaired} />;
      case 'water_leak':
        return <WaterLeakIllustration repaired={repaired} />;
      case 'broken_light':
        return <BrokenLightIllustration repaired={repaired} />;
      default:
        return <PotholeIllustration repaired={repaired} />;
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
      padding: '24px 16px 100px 16px',
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

        /* Wood panel dialog */
        .wood-panel {
          background-color: #3e2723;
          background-image: url('/panel_bg.png');
          background-size: 100% 100%;
          border: 6px double #8B5E34;
          border-radius: 16px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.8);
          padding: 28px 20px;
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        /* Stone Header Pill */
        .stone-header {
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          background: #7F7F7F;
          background-image: linear-gradient(135deg, #8A8A8A 0%, #5E5E5E 100%);
          border: 3px solid #3C3C3C;
          border-radius: 12px;
          padding: 10px 32px;
          color: #FFF;
          font-family: 'MedievalSharp', serif;
          font-size: 1.4rem;
          font-weight: 900;
          text-shadow: 2px 2px 0 #000;
          box-shadow: 0 5px 12px rgba(0,0,0,0.6);
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Parchment Quest Card */
        .parchment-card {
          background: #F4E8C1;
          border: 3px solid #5A4B3D;
          border-radius: 12px;
          color: #2D1B13;
          padding: 16px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: inset 0 0 15px rgba(139,94,52,0.2), 0 4px 8px rgba(0,0,0,0.3);
          transition: transform 0.2s;
        }
        .parchment-card:active {
          transform: scale(0.98);
        }

        /* Green medieval button */
        .medieval-btn-green {
          background: #2E6B2A;
          color: #FFF;
          font-family: 'MedievalSharp', serif;
          font-weight: bold;
          font-size: 1rem;
          text-transform: uppercase;
          border: 2px solid #1C4519;
          border-radius: 6px;
          padding: 8px 16px;
          cursor: pointer;
          box-shadow: 0 3px 0 #1C4519, 0 4px 8px rgba(0,0,0,0.4);
          transition: all 0.1s;
        }
        .medieval-btn-green:active {
          transform: translateY(2px);
          box-shadow: 0 1px 0 #1C4519;
        }

        /* Brown medieval button */
        .medieval-btn-brown {
          background: #5C4033;
          color: #F4E8C1;
          font-family: 'MedievalSharp', serif;
          font-weight: bold;
          font-size: 1rem;
          text-transform: uppercase;
          border: 2px solid #3E2D24;
          border-radius: 6px;
          padding: 8px 16px;
          cursor: pointer;
          box-shadow: 0 3px 0 #3E2D24, 0 4px 8px rgba(0,0,0,0.4);
          transition: all 0.1s;
        }
        .medieval-btn-brown:active {
          transform: translateY(2px);
          box-shadow: 0 1px 0 #3E2D24;
        }

        /* Severity Slider */
        .slider-track {
          width: 100%;
          height: 16px;
          background: #5C4033;
          border: 2.5px solid #2E2018;
          border-radius: 99px;
          position: relative;
          cursor: pointer;
          display: flex;
          align-items: center;
          margin: 10px 0;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
        }
        .slider-segments {
          position: absolute;
          inset: 0;
          display: flex;
          width: 100%;
        }
        .slider-segment {
          flex: 1;
          height: 100%;
          border-right: 2.5px solid #2E2018;
        }
        .slider-segment:last-child {
          border-right: none;
        }
        .slider-thumb {
          position: absolute;
          width: 26px;
          height: 26px;
          background: #D4AF37;
          background-image: radial-gradient(circle, #FFF2A3 0%, #D4AF37 80%);
          border: 2.5px solid #2E2018;
          border-radius: 50%;
          top: -7px;
          box-shadow: 0 3px 6px rgba(0,0,0,0.5);
          transition: left 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28);
        }

        /* Live GPS Pill */
        .gps-pill {
          background: rgba(46, 26, 10, 0.12);
          border: 2.5px solid #5A4B3D;
          border-radius: 99px;
          padding: 6px 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: bold;
          font-size: 0.95rem;
        }
        .gps-pulse {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #2E6B2A;
          box-shadow: 0 0 8px #2E6B2A;
          animation: pulse 1.6s infinite ease-in-out;
        }
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.5; }
        }

        /* Camera Viewfinder framing corners */
        .viewfinder-corner {
          position: absolute;
          width: 24px;
          height: 24px;
          border-color: #FFF;
          border-style: solid;
        }
        .vf-top-left { top: 16px; left: 16px; border-width: 4px 0 0 4px; border-top-left-radius: 6px; }
        .vf-top-right { top: 16px; right: 16px; border-width: 4px 4px 0 0; border-top-right-radius: 6px; }
        .vf-bottom-left { bottom: 16px; left: 16px; border-width: 0 0 4px 4px; border-bottom-left-radius: 6px; }
        .vf-bottom-right { bottom: 16px; right: 16px; border-width: 0 4px 4px 0; border-bottom-right-radius: 6px; }

        /* Shutter animation flash overlay */
        .shutter-flash-overlay {
          position: absolute;
          inset: 0;
          background: #FFF;
          z-index: 9999;
          opacity: 0;
          pointer-events: none;
          animation: flashAnimation 1.2s ease-out;
        }
        @keyframes flashAnimation {
          0% { opacity: 0.95; }
          10% { opacity: 0.95; }
          100% { opacity: 0; }
        }

        /* Verification Screen stacked buttons */
        .verification-action-btn {
          width: 100%;
          padding: 14px;
          font-family: 'MedievalSharp', serif;
          font-weight: 900;
          font-size: 1.25rem;
          text-transform: uppercase;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          touch-action: manipulation;
        }
        .verification-action-btn:active {
          transform: translateY(3px);
          box-shadow: none;
        }
        .verification-btn-resolved {
          background: #2E6B2A;
          color: #FFF;
          border: 3px solid #1C4519;
          box-shadow: 0 4px 0 #1C4519, 0 5px 10px rgba(0,0,0,0.5);
        }
        .verification-btn-partial {
          background: #D47A2A;
          color: #FFF;
          border: 3px solid #9C512A;
          box-shadow: 0 4px 0 #9C512A, 0 5px 10px rgba(0,0,0,0.5);
        }
        .verification-btn-not {
          background: #B53F3F;
          color: #FFF;
          border: 3px solid #7E2A2A;
          box-shadow: 0 4px 0 #7E2A2A, 0 5px 10px rgba(0,0,0,0.5);
        }
        
        /* Custom scrollbar to match the app theme */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(45, 27, 19, 0.3);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #8B5E34;
          border-radius: 4px;
          border: 1px solid #5C4033;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #A87C54;
        }
      `}</style>

      {/* ── VIEW 1: MISSION CENTER (LIST) ─────────────────────────── */}
      {view === 'list' && (
        <div className="wood-panel" style={{ marginTop: '30px' }}>
          <div className="stone-header">
            <span>Mission Center</span>
          </div>

          {/* ── MISSION ACTIVATED TOAST ── */}
          {missionToast && (
            <div
              onClick={clearMissionToast}
              style={{
                position: 'fixed',
                top: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 99999,
                background: 'linear-gradient(135deg, #2E6B2A, #1C4519)',
                border: '3px solid #D4AF37',
                borderRadius: '12px',
                padding: '14px 20px',
                maxWidth: '360px',
                width: 'calc(100% - 32px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
                animation: 'slideDown 0.3s ease-out'
              }}
            >
              <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>⚔️</span>
              <div>
                <div style={{ color: '#D4AF37', fontFamily: "'MedievalSharp', serif", fontWeight: 900, fontSize: '0.95rem', marginBottom: '4px' }}>
                  New Quest Unlocked!
                </div>
                <div style={{ color: '#F4E8C1', fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.4 }}>
                  {missionToast.title} — confirmed by 3 reporters and now active!
                </div>
              </div>
            </div>
          )}
          <style>{`@keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>

          {/* History Icon (Top Left) */}
          <button
            onClick={() => setQuestTab(prev => prev === 'completed' ? 'local' : 'completed')}
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'transparent',
              border: 'none',
              color: questTab === 'completed' ? '#D4AF37' : '#C4A484',
              cursor: 'pointer',
              outline: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s',
              zIndex: 10
            }}
            title="Past Completed Quests"
          >
            <History size={26} style={{ filter: questTab === 'completed' ? 'drop-shadow(0 0 6px #D4AF37)' : 'none' }} />
          </button>

          <button
            onClick={() => navigate('/map')}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'transparent',
              border: 'none',
              color: '#C4A484',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <X size={26} />
          </button>

          <h3 className="medieval-font" style={{
            color: '#D4AF37',
            fontSize: '1.25rem',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            margin: '15px 0 12px 0',
            textShadow: '1px 1px 0 #000'
          }}>
            {questTab === 'completed' ? '📜 Completed Quests' : 'Quest Cards'}
          </h3>

          {/* ── GLOBAL / LOCAL tabs ── */}
          {questTab !== 'completed' && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={() => setQuestTab('global')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: questTab === 'global' ? '2px solid #D4AF37' : '2px solid #5A4B3D',
                  background: questTab === 'global' ? '#5C4033' : 'transparent',
                  color: questTab === 'global' ? '#F4E8C1' : '#B3A387',
                  fontFamily: "'MedievalSharp', serif",
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                🌍 GLOBAL QUESTS
              </button>
              <button
                onClick={() => setQuestTab('local')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: questTab === 'local' ? '2px solid #D4AF37' : '2px solid #5A4B3D',
                  background: questTab === 'local' ? '#5C4033' : 'transparent',
                  color: questTab === 'local' ? '#F4E8C1' : '#B3A387',
                  fontFamily: "'MedievalSharp', serif",
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                📍 LOCAL ({localityName.toUpperCase()})
              </button>
            </div>
          )}

          <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
            {missions
              .filter(m => questTab === 'completed' ? m.status === 'completed' : m.status !== 'completed')
              .filter(m => {
                if (questTab === 'completed') {
                  // Show all completed missions
                  return true;
                }
                if (questTab === 'local') {
                  const isMyIssue = m.reporterId === hero.id;
                  const isDirtyNeighbourhood = 
                    m.category === 'Large Scale Public Waste Accumulation' || 
                    m.type === 'waste' ||
                    (m.title && m.title.toLowerCase().includes('waste')) ||
                    (m.description && m.description.toLowerCase().includes('waste'));

                  if (isDirtyNeighbourhood) {
                    // Only show dirty neighbourhood in local view if user's district is Vasai-Virar
                    const userArea = localityName.toLowerCase();
                    const userCity = (hero.city || '').toLowerCase();
                    return userArea.includes('vasai') || userArea.includes('virar') || userCity.includes('vasai') || userCity.includes('virar');
                  }
                  // Always show my other issues in my Local tab
                  if (isMyIssue) return true;

                  // Match the entire district as local (e.g. Alibag issues are local for Raigad users)
                  const userArea = localityName.toLowerCase().trim();
                  const userCity = (hero.city || '').toLowerCase().trim();
                  if (!userArea && !userCity) return true;

                  const isUserInRaigad = userArea.includes('raigad') || userCity.includes('alibag') || userArea.includes('alibag') || userCity.includes('raigad');
                  const isUserInVasai = userArea.includes('vasai') || userCity.includes('vasai') || userArea.includes('naigaon') || userCity.includes('naigaon') || userArea.includes('virar') || userCity.includes('virar');
                  const isUserInNorthGoa = userArea.includes('north goa') || userCity.includes('panaji') || userCity.includes('panjim') || userCity.includes('mapusa');
                  const isUserInSouthGoa = userArea.includes('south goa') || userCity.includes('margao') || userCity.includes('madgaon') || userCity.includes('vasco');

                  const mLoc = (m.location || '').toLowerCase();
                  const mRepArea = (m.reporterArea || '').toLowerCase();

                  const isIssueInRaigad = mLoc.includes('alibag') || mLoc.includes('raigad') || mRepArea.includes('raigad') || mRepArea.includes('alibag');
                  const isIssueInVasai = mLoc.includes('vasai') || mLoc.includes('virar') || mLoc.includes('naigaon') || mLoc.includes('umela') || mRepArea.includes('vasai') || mRepArea.includes('virar') || mRepArea.includes('naigaon') || mRepArea.includes('umela');
                  const isIssueInNorthGoa = mLoc.includes('north goa') || mLoc.includes('panaji') || mLoc.includes('panjim') || mLoc.includes('mapusa') || mLoc.includes('calangute') || mRepArea.includes('north goa');
                  const isIssueInSouthGoa = mLoc.includes('south goa') || mLoc.includes('margao') || mLoc.includes('madgaon') || mLoc.includes('vasco') || mLoc.includes('mormugao') || mRepArea.includes('south goa');

                  if (isUserInRaigad && isIssueInRaigad) return true;
                  if (isUserInVasai && isIssueInVasai) return true;
                  if (isUserInNorthGoa && isIssueInNorthGoa) return true;
                  if (isUserInSouthGoa && isIssueInSouthGoa) return true;

                  // Goa general state-wide grouping fallback
                  const isUserInGoa = userArea.includes('goa') || userCity.includes('goa');
                  const isIssueInGoa = mLoc.includes('goa') || mRepArea.includes('goa');
                  if (isUserInGoa && isIssueInGoa) return true;

                  // Fallback to basic string match (works for any city/location globally)
                  const isMatchArea = userArea && mRepArea.includes(userArea);
                  const isMatchLoc = userArea && mLoc.includes(userArea);
                  if (isMatchArea || isMatchLoc) return true;

                  // Distance-based local fallback (within 10mi radius)
                  if (m.distance !== undefined && m.distance !== null && m.distance <= 10) return true;

                  return false;
                }
                return true;
              })
              .map(m => (
                <div key={m.id} className="parchment-card">
                  {m.status === 'completed' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <div style={{ width: '48px', height: '42px', borderRadius: '4px', overflow: 'hidden', border: '1.5px solid #5A4B3D', background: '#e0d6b8' }}>
                        {m.photoUrl ? (
                          <img src={m.photoUrl} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          getIllustration(m.type, false)
                        )}
                      </div>
                      <span style={{ fontSize: '1rem', color: '#2E6B2A', fontWeight: 'bold' }}>➜</span>
                      <div style={{ width: '48px', height: '42px', borderRadius: '4px', overflow: 'hidden', border: '1.5px solid #2E6B2A', background: '#e0d6b8' }}>
                        {m.afterPhotoUrl ? (
                          <img src={m.afterPhotoUrl} alt="After" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          getIllustration(m.type, true)
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ width: '72px', height: '64px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, border: '2px solid #5A4B3D' }}>
                      {getIllustration(m.type, false)}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 className="medieval-font" style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.aiAnalysis?.missionTitle || m.title}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: '#5C4A38', fontWeight: 600, marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span>Distance: {(m.distance != null ? m.distance : 2.5).toFixed(2)}mi</span>
                      <span>Severity: {m.aiAnalysis?.severity || (m.severity ? m.severity.charAt(0).toUpperCase() + m.severity.slice(1) : 'Medium')}</span>
                      {m.aiAnalysis?.recommendedAuthority && (
                        <span style={{ fontSize: '0.75rem', color: '#8B5E34' }}>Authority: {m.aiAnalysis.recommendedAuthority}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#2E6B2A', fontWeight: 800, marginTop: '6px' }}>
                      <Award size={14} />
                      <span>Reward: {m.aiAnalysis?.estimatedReward || 0} XP</span>
                    </div>

                    {/* Reporter confirmation progress — visible while pending */}
                    {m.status === 'Pending Verification' && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          {[1, 2, 3].map(n => (
                            <div
                              key={n}
                              style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: n <= (m.reporter_count || 1) ? '#D4AF37' : '#5A4B3D',
                                border: '1.5px solid #3E2D24',
                                boxShadow: n <= (m.reporter_count || 1) ? '0 0 6px #D4AF37' : 'none',
                                transition: 'all 0.3s'
                              }}
                            />
                          ))}
                          <span style={{ fontSize: '0.7rem', color: '#8B5E34', fontWeight: 700 }}>
                            {m.reporter_count || 1}/3 confirmed — {3 - (m.reporter_count || 1)} more to unlock
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenDetails(m)}
                    className={m.status === 'completed' ? 'medieval-btn-brown' : (m.aiAnalysis?.handler === 'Authority' ? 'medieval-btn-brown' : 'medieval-btn-green')}
                    style={{
                      flexShrink: 0,
                      ...(m.status === 'Pending Verification' ? { opacity: 0.55, cursor: 'default', background: '#5C4033', border: '2px solid #3E2D24' } : {})
                    }}
                    disabled={m.status === 'Pending Verification'}
                    title={m.status === 'Pending Verification' ? 'Needs 3 reports to unlock' : ''}
                  >
                    {m.status === 'Pending Verification' ? '🔒' : (m.status === 'completed' ? 'View' : (m.aiAnalysis?.handler === 'Authority' ? 'View' : 'Accept'))}
                  </button>
                </div>
              ))}

            {missions.filter(m => {
              if (questTab === 'completed') return m.status === 'completed';
              if (m.status === 'completed') return false;
              if (questTab === 'local') return m.distance == null || m.distance <= 10;
              return true;
            }).length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#B3A387', fontStyle: 'italic' }}>
                {questTab === 'completed' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                    <span>No completed quests found yet. Set forth and solve anomalies!</span>
                    <button
                      onClick={() => setQuestTab('local')}
                      className="medieval-btn-green"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      View Active Quests
                    </button>
                  </div>
                ) : questTab === 'local' ? (
                  `No quests near ${localityName} right now. Return to the Map to report new anomalies.`
                ) : (
                  'All petitions resolved! Return to the Map to report new anomalies.'
                )}
              </div>
            )}
          </div>


        </div>
      )}

      {/* ── VIEW 2: MISSION DETAILS SCREEN ────────────────────────── */}
      {view === 'details' && selectedMission && (
        <div className="wood-panel" style={{ marginTop: '30px', padding: '24px 18px 0 18px' }}>
          <div className="stone-header">
            <span>Mission Details Screen</span>
          </div>

          <button
            onClick={() => setView('list')}
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

          <div style={{
            background: '#F4E8C1',
            borderRadius: '10px 10px 0 0',
            color: '#2D1B13',
            padding: '16px 16px 24px 16px',
            boxShadow: 'inset 0 0 15px rgba(139,94,52,0.2)'
          }}>
            <h3 className="medieval-font" style={{
              fontSize: '1.4rem',
              fontWeight: 900,
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: '10px 0 16px 0',
              color: '#3C2D24'
            }}>
              {selectedMission.title.toUpperCase()}
            </h3>

            {selectedMission.status === 'Awaiting Community Verification' ? (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <div style={{ flex: 1, height: '120px', borderRadius: '8px', overflow: 'hidden', border: '3px solid #5C4033', position: 'relative' }}>
                  <div style={{ background: '#5C4033', color: '#F4E8C1', textAlign: 'center', fontSize: '0.7rem', padding: '2px 0' }}>BEFORE</div>
                  {selectedMission.photoUrl ? (
                    <>
                      <img 
                        src={selectedMission.photoUrl} 
                        alt="Before" 
                        style={{ width: '100%', height: 'calc(100% - 18px)', objectFit: 'cover' }} 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fb = e.target.parentElement.querySelector('.before-fallback');
                          if (fb) fb.style.display = 'block';
                        }}
                      />
                      <div className="before-fallback" style={{ display: 'none', width: '100%', height: 'calc(100% - 18px)' }}>
                        {getIllustration(selectedMission.type, false)}
                      </div>
                    </>
                  ) : (
                    <div style={{ width: '100%', height: 'calc(100% - 18px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0d6b8' }}>
                      {getIllustration(selectedMission.type, false)}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, height: '120px', borderRadius: '8px', overflow: 'hidden', border: '3px solid #5C4033', position: 'relative' }}>
                  <div style={{ background: '#5C4033', color: '#F4E8C1', textAlign: 'center', fontSize: '0.7rem', padding: '2px 0' }}>AFTER</div>
                  {selectedMission.afterPhotoUrl ? (
                    <>
                      <img 
                        src={selectedMission.afterPhotoUrl} 
                        alt="After" 
                        style={{ width: '100%', height: 'calc(100% - 18px)', objectFit: 'cover' }} 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fb = e.target.parentElement.querySelector('.after-fallback');
                          if (fb) fb.style.display = 'block';
                        }}
                      />
                      <div className="after-fallback" style={{ display: 'none', width: '100%', height: 'calc(100% - 18px)' }}>
                        {getIllustration(selectedMission.type, true)}
                      </div>
                    </>
                  ) : (
                    <div style={{ width: '100%', height: 'calc(100% - 18px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0d6b8' }}>
                      {getIllustration(selectedMission.type, true)}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ width: '100%', height: '180px', borderRadius: '8px', overflow: 'hidden', border: '3px solid #5C4033', boxShadow: '0 4px 8px rgba(0,0,0,0.3)', marginBottom: '16px', position: 'relative', background: '#2D1B13' }}>
                {selectedMission.photoUrl ? (
                  <>
                    <img 
                      src={selectedMission.photoUrl} 
                      alt="Issue" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fb = e.target.parentElement.querySelector('.main-fallback');
                        if (fb) fb.style.display = 'block';
                      }}
                    />
                    <div className="main-fallback" style={{ display: 'none', width: '100%', height: '100%' }}>
                      {getIllustration(selectedMission.type, false)}
                    </div>
                  </>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5E34' }}>
                    {getIllustration(selectedMission.type, false)}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', fontWeight: 600, padding: '0 4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(45, 27, 19, 0.2)', paddingBottom: '6px' }}>
                <span>Problem Solving Reward</span>
                <span style={{ color: '#2E6B2A', fontWeight: 'bold' }}>
                  +{selectedMission.aiAnalysis?.estimatedReward || 0} XP
                </span>
              </div>
              
              {selectedMission.aiAnalysis && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px dashed rgba(45, 27, 19, 0.2)', paddingBottom: '8px' }}>
                    <span style={{ color: '#8B5E34', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estimated Impact</span>
                    <span style={{ color: '#2D1B13', fontSize: '0.85rem', fontWeight: 500, lineHeight: '1.35', textAlign: 'left' }}>
                      {selectedMission.aiAnalysis.impact || 'Unknown'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(45, 27, 19, 0.2)', paddingBottom: '6px', gap: '12px' }}>
                    <span style={{ flexShrink: 0 }}>Recommended Authority</span>
                    <span style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '0.85rem', color: '#2D1B13' }}>
                      {selectedMission.aiAnalysis.recommendedAuthority || 'Local Council'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(45, 27, 19, 0.2)', paddingBottom: '6px' }}>
                    <span>AI Confidence</span>
                    <span style={{ color: '#2E6B2A', fontWeight: 'bold' }}>{Math.round((selectedMission.aiAnalysis.confidence || 0.8) * 100)}%</span>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(45, 27, 19, 0.2)', paddingBottom: '6px' }}>
                <span>Community Reports</span>
                <span>{selectedMission.reporter_count || 1}</span>
              </div>

              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Severity Meter</span>
                  <span style={{
                    color: severity === 'High' ? '#B53F3F' : severity === 'Medium' ? '#9C512A' : '#5D8A46',
                    fontWeight: 900,
                    fontSize: '0.95rem'
                  }}>
                    {severity}
                  </span>
                </div>

                <div className="slider-track" onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = clickX / rect.width;
                  if (ratio < 0.33) setSeverity('Low');
                  else if (ratio < 0.66) setSeverity('Medium');
                  else setSeverity('High');
                }}>
                  <div className="slider-segments">
                    <div className="slider-segment" />
                    <div className="slider-segment" />
                    <div className="slider-segment" />
                  </div>
                  <div
                    className="slider-thumb"
                    style={{
                      left: severity === 'High' ? 'calc(83.33% - 13px)' : severity === 'Medium' ? 'calc(50% - 13px)' : 'calc(16.66% - 13px)'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span>GPS Location</span>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                  <div className="gps-pill" style={{ marginBottom: '4px' }}>
                    {gpsStatus === 'Connected' && <div className="gps-pulse" />}
                    <span style={{ color: gpsStatus === 'Connected' ? '#2E6B2A' : '#8B5E34' }}>
                      {gpsStatus}
                    </span>
                  </div>
                  {selectedMission.lat && selectedMission.lng && (
                    <span style={{ fontSize: '0.65rem', color: '#8B5E34' }}>
                      {Number(selectedMission.lat).toFixed(5)}, {Number(selectedMission.lng).toFixed(5)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: '#2D1B13',
            margin: '0 -20px -28px -20px',
            padding: '16px 20px 24px 20px',
            borderRadius: '0 0 10px 10px',
            borderTop: '3.5px solid #5C4033',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {selectedMission?.status === 'completed' || selectedMission?.status === 'resolved' ? (
              <div style={{ textAlign: 'center', color: '#5D8A46', fontSize: '1rem', fontWeight: 'bold', display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 0' }}>
                <span>✨ QUEST ACCOMPLISHED!</span>
                <span style={{ fontSize: '0.8rem', color: '#F4E8C1', fontWeight: 'normal' }}>
                  This issue has been fully resolved and verified by the community.
                </span>
              </div>
            ) : selectedMission?.status === 'Awaiting Community Verification' ? (
              hero?.id === selectedMission.assigneeId ? (
                <div style={{ textAlign: 'center', color: '#D4AF37', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Awaiting community verification...</span>
                  <span style={{ fontSize: '0.78rem', color: '#C4A484', fontWeight: 'normal' }}>2 local heroes must confirm this repair.</span>
                </div>
              ) : selectedMission.myVerdict ? (
                <div style={{ textAlign: 'center', color: '#F4E8C1', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', flexDirection: 'column', gap: '6px', padding: '4px 0' }}>
                  <span>You marked this repair as:</span>
                  <span style={{
                    color: selectedMission.myVerdict === 'Fully Resolved' ? '#5D8A46' : selectedMission.myVerdict === 'Partially Resolved' ? '#9C512A' : '#B53F3F',
                    textTransform: 'uppercase',
                    fontSize: '1rem',
                    letterSpacing: '0.5px'
                  }}>
                    {selectedMission.myVerdict === 'Fully Resolved' ? '✅ Resolved' : selectedMission.myVerdict === 'Partially Resolved' ? '⚠ Partially Resolved' : '❌ Not Resolved'}
                  </span>
                </div>
              ) : (() => {
                const verArea = localityName.toLowerCase().trim();
                const verCity = (hero.city || '').toLowerCase().trim();
                const mLoc = (selectedMission.location || '').toLowerCase();
                const mRepArea = (selectedMission.reporterArea || '').toLowerCase();

                const isUserInRaigad = verArea.includes('raigad') || verCity.includes('alibag') || verArea.includes('alibag') || verCity.includes('raigad');
                const isUserInVasai = verArea.includes('vasai') || verCity.includes('vasai') || verArea.includes('naigaon') || verCity.includes('naigaon') || verArea.includes('virar') || verCity.includes('virar');
                const isUserInNorthGoa = verArea.includes('north goa') || verCity.includes('panaji') || verCity.includes('panjim') || verCity.includes('mapusa');
                const isUserInSouthGoa = verArea.includes('south goa') || verCity.includes('margao') || verCity.includes('madgaon') || verCity.includes('vasco');

                const isIssueInRaigad = mLoc.includes('alibag') || mLoc.includes('raigad') || mRepArea.includes('raigad') || mRepArea.includes('alibag');
                const isIssueInVasai = mLoc.includes('vasai') || mLoc.includes('virar') || mLoc.includes('naigaon') || mLoc.includes('umela') || mRepArea.includes('vasai') || mRepArea.includes('virar') || mRepArea.includes('naigaon') || mRepArea.includes('umela');
                const isIssueInNorthGoa = mLoc.includes('north goa') || mLoc.includes('panaji') || mLoc.includes('panjim') || mLoc.includes('mapusa') || mLoc.includes('calangute') || mRepArea.includes('north goa');
                const isIssueInSouthGoa = mLoc.includes('south goa') || mLoc.includes('margao') || mLoc.includes('madgaon') || mLoc.includes('vasco') || mLoc.includes('mormugao') || mRepArea.includes('south goa');

                let matchesLocation = false;
                if (isUserInRaigad && isIssueInRaigad) matchesLocation = true;
                else if (isUserInVasai && isIssueInVasai) matchesLocation = true;
                else if (isUserInNorthGoa && isIssueInNorthGoa) matchesLocation = true;
                else if (isUserInSouthGoa && isIssueInSouthGoa) matchesLocation = true;
                else if ((verArea.includes('goa') || verCity.includes('goa')) && (mLoc.includes('goa') || mRepArea.includes('goa'))) matchesLocation = true;
                else if (verArea && (mRepArea.includes(verArea) || mLoc.includes(verArea))) matchesLocation = true;

                if (!matchesLocation) {
                  return (
                    <div style={{ textAlign: 'center', color: '#B53F3F', fontSize: '0.85rem', fontWeight: 'bold', padding: '6px 0' }}>
                      Only heroes from this district/location are allowed to verify this mission.
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ textAlign: 'center', color: '#F4E8C1', fontSize: '0.85rem', marginBottom: '4px' }}>
                      Verify this repair to earn XP! <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>({Math.min(selectedMission?.verificationCount || 0, 2)}/2 verified)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleVote('Fully Resolved')} className="medieval-btn-green" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}>
                        ✅ Resolved
                      </button>
                      <button onClick={() => handleVote('Partially Resolved')} className="medieval-btn-brown" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}>
                        ⚠ Partial
                      </button>
                      <button onClick={() => handleVote('Not Resolved')} className="medieval-btn-brown" style={{ flex: 1, padding: '8px', fontSize: '0.8rem', background: 'linear-gradient(to bottom, #8C2A2A, #5A1212)' }}>
                        ❌ Not Resolved
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div style={{ display: 'flex', gap: '10px', width: '100%', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  {/* Only show Navigate if NOT opened via map-accept flow AND NOT an Authority-only issue */}
                  {!fromMapAccept && selectedMission?.aiAnalysis?.handler !== 'Authority' && (
                    <button
                      onClick={() => navigate('/map')}
                      className="medieval-btn-brown"
                      style={{ flex: 1, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Navigation size={15} />
                      <span>Navigate</span>
                    </button>
                  )}
                  {currentDistance != null && currentDistance > 0.15 && !fromMapAccept ? (
                    <div style={{ flex: 1, textAlign: 'center', color: '#B53F3F', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      Move closer to solve. ({Math.round(currentDistance * 1000)}m away)
                    </div>
                  ) : (
                    <button
                      onClick={handleStartVerification}
                      className="medieval-btn-green"
                      style={{ flex: 1, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Shield size={15} />
                      <span>{selectedMission?.aiAnalysis?.handler === 'Authority' ? 'Help Anyway' : 'Solve'}</span>
                    </button>
                  )}
                </div>
                {selectedMission?.aiAnalysis?.handler === 'Authority' && (
                  <div style={{ textAlign: 'center', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4px 0' }}>
                    <span>Reported to {selectedMission.aiAnalysis.department}</span>
                    <span style={{ fontSize: '0.7rem', color: '#B3A387' }}>Awaiting Municipal Action, but community can help!</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VIEWS 3 & 4: CAMERA CAPTURE (BEFORE & AFTER) ──────────────── */}
      {(view === 'capture_before' || view === 'capture_after') && (
        <div className="wood-panel" style={{
          marginTop: '30px',
          padding: '24px 18px 24px 18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box',
          fontFamily: "'MedievalSharp', serif",
          position: 'relative'
        }}>
          {/* Shutter flash overlay effect */}
          {shutterFlash && <div className="shutter-flash-overlay" style={{ borderRadius: '12px' }} />}

          {/* Carved stone title header */}
          <div className="stone-header">
            <span>{view === 'capture_before' ? 'Capture BEFORE Photo' : 'Capture AFTER Photo'}</span>
          </div>

          {/* Close button top-right */}
          <button
            onClick={() => {
              stopCamera();
              setView('details');
            }}
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

          {/* Viewfinder Bounding Area */}
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '20px 0',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '360px',
              aspectRatio: '1',
              border: '3px solid #5C4033',
              borderRadius: '8px',
              position: 'relative',
              overflow: 'hidden',
              background: '#2D1B13',
              boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
            }}>
              {uploadMethod === 'choice' && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  height: '100%',
                  padding: '24px',
                  boxSizing: 'border-box'
                }}>
                  <Shield size={36} color="#D4AF37" style={{ marginBottom: '4px' }} />
                  <div style={{ color: '#F4E8C1', fontSize: '0.95rem', fontWeight: 900, textAlign: 'center', fontFamily: "'MedievalSharp', serif", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Choose Verification
                  </div>
                  <button
                    onClick={async () => {
                      setUploadMethod('camera');
                      await startCamera();
                    }}
                    className="medieval-btn-green"
                    style={{ width: '100%', padding: '10px', fontSize: '0.82rem', fontFamily: "'MedievalSharp', serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Camera size={16} /> Live Camera
                  </button>
                  <button
                    onClick={() => setUploadMethod('file')}
                    className="medieval-btn-brown"
                    style={{ width: '100%', padding: '10px', fontSize: '0.82rem', fontFamily: "'MedievalSharp', serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <UploadCloud size={16} /> Upload Photo
                  </button>
                </div>
              )}

              {uploadMethod === 'camera' && (
                !cameraError && cameraStream ? (
                  <video
                    ref={(el) => {
                      videoRef.current = el;
                      if (el && cameraStream && el.srcObject !== cameraStream) {
                        el.srcObject = cameraStream;
                      }
                    }}
                    autoPlay
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <div style={{ width: '100%', height: '100%' }}>
                      {selectedMission && getIllustration(selectedMission.type, view === 'capture_after')}
                    </div>

                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(45, 27, 19, 0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFF',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      textAlign: 'center',
                      padding: '20px',
                      textShadow: '2px 2px 4px #000'
                    }}>
                      <span>[ Simulated Viewfinder ]<br />Click shutter below to capture</span>
                    </div>
                  </div>
                )
              )}

              {uploadMethod === 'file' && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      handleFileSelected(file);
                    }
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    padding: '20px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    border: '2px dashed #7A4A22',
                    margin: '12px',
                    borderRadius: '8px',
                    background: 'rgba(92, 64, 51, 0.15)',
                    position: 'relative'
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) handleFileSelected(file);
                    }}
                  />
                  {(view === 'capture_before' ? beforeFilePreview : afterFilePreview) ? (
                    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: '4px' }}>
                      <img src={view === 'capture_before' ? beforeFilePreview : afterFilePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(0,0,0,0.7)',
                        color: '#F4E8C1',
                        fontSize: '0.75rem',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: '1px solid #7A4A22',
                        whiteSpace: 'nowrap'
                      }}>
                        Click to change photo
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud size={40} color="#D4AF37" style={{ marginBottom: '8px' }} />
                      <span style={{ color: '#F4E8C1', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center' }}>
                        Drag & Drop Photo Here
                      </span>
                      <span style={{ color: '#A89880', fontSize: '0.7rem', marginTop: '4px', textAlign: 'center' }}>
                        or click to browse archives
                      </span>
                    </>
                  )}
                </div>
              )}

              {uploadMethod === 'camera' && (
                <button
                  onClick={startCamera}
                  style={{
                    position: 'absolute',
                    top: '18px',
                    left: '18px',
                    background: 'rgba(30, 16, 6, 0.9)',
                    border: '1.5px solid #7A4A22',
                    borderRadius: '6px',
                    color: '#F4E8C1',
                    fontSize: '0.7rem',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    zIndex: 20,
                    fontFamily: "'MedievalSharp', serif",
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                  }}
                  title="Reset Camera"
                >
                  <RefreshCw size={12} /> Reset
                </button>
              )}
              <div className="viewfinder-corner vf-top-left" />
              <div className="viewfinder-corner vf-top-right" />
              <div className="viewfinder-corner vf-bottom-left" />
              <div className="viewfinder-corner vf-bottom-right" />
            </div>
          </div>

          {/* Shutter Button Footer */}
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '10px'
          }}>
            <span style={{ fontSize: '0.85rem', color: '#5A4B3D', letterSpacing: '0.5px', fontWeight: 'bold' }}>
              {isUploading ? 'Uploading to Guild Archives...' : (view === 'capture_before' ? 'Capture the damaged anomaly' : 'Capture the resolved issue')}
            </span>

            {uploadMethod === 'choice' ? (
              <div style={{ color: '#8B7355', fontSize: '0.78rem', fontStyle: 'italic', height: '54px', display: 'flex', alignItems: 'center' }}>
                Select a verification method above
              </div>
            ) : uploadMethod === 'file' ? (
              <button
                onClick={handleCapturePhoto}
                disabled={isUploading || !(view === 'capture_before' ? beforeFile : afterFile)}
                className="medieval-btn-green"
                style={{ width: '220px', padding: '12px 20px', fontSize: '0.9rem', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', fontFamily: "'MedievalSharp', serif", fontWeight: 700 }}
              >
                {isUploading ? <><RefreshCw className="spin" size={16} style={{ marginRight: '8px' }} /> Processing…</> : 'Proceed with Photo'}
              </button>
            ) : (
              <button
                onClick={handleCapturePhoto}
                disabled={isUploading}
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: isUploading ? '#666' : '#FFF',
                  border: '6px solid #4A4E69',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  outline: 'none',
                  transition: 'transform 0.1s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                className="shutter-btn"
                onMouseDown={(e) => !isUploading && (e.currentTarget.style.transform = 'scale(0.92)')}
                onMouseUp={(e) => !isUploading && (e.currentTarget.style.transform = 'scale(1)')}
              >
                {isUploading && <RefreshCw className="spin" size={24} color="#FFF" />}
              </button>
            )}

            {uploadMethod !== 'choice' && (
              <button
                onClick={() => {
                  stopCamera();
                  setUploadMethod('choice');
                  setBeforeFile(null);
                  setBeforeFilePreview(null);
                  setAfterFile(null);
                  setAfterFilePreview(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#8B5E34',
                  textDecoration: 'underline',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  fontFamily: "'MedievalSharp', serif",
                  fontWeight: 'bold',
                  marginTop: '6px',
                  outline: 'none'
                }}
              >
                Change Verification Method
              </button>
            )}

            <style>
              {`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
              `}
            </style>
          </div>
        </div>
      )}

      {/* ── NEW VIEW 5: VERIFICATION SLIDE ────────────────────────── */}
      {view === 'verification' && selectedMission && (
        <div className="wood-panel" style={{ marginTop: '30px', padding: '24px 16px 20px 16px' }}>
          {/* Carved stone title header */}
          <div className="stone-header">
            <span>Verification</span>
          </div>

          {/* Close button top-right */}
          <button
            onClick={() => setView('details')}
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

          {/* Before / After side-by-side photo comparison */}
          <div style={{
            display: 'flex',
            gap: '12px',
            width: '100%',
            marginBottom: '20px',
            marginTop: '10px'
          }}>
            {/* Before Photo Card */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="medieval-font" style={{ fontSize: '1.05rem', fontWeight: 900, color: '#D4AF37', marginBottom: '6px', textShadow: '1px 1px 0 #000' }}>
                Before
              </span>
              <div style={{
                width: '100%',
                aspectRatio: '0.95',
                background: '#F4E8C1',
                border: '3px solid #5A4B3D',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {getIllustration(selectedMission.type, false)}
              </div>
            </div>

            {/* After Photo Card */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="medieval-font" style={{ fontSize: '1.05rem', fontWeight: 900, color: '#D4AF37', marginBottom: '6px', textShadow: '1px 1px 0 #000' }}>
                After
              </span>
              <div style={{
                width: '100%',
                aspectRatio: '0.95',
                background: '#F4E8C1',
                border: '3px solid #5A4B3D',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {getIllustration(selectedMission.type, true)}
              </div>
            </div>
          </div>

          {/* Stacked Medieval Verification Buttons */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', padding: '0 4px' }}>
            {/* 1. Fully Resolved Button */}
            <button
              onClick={() => handleSelectResolution('Fully Resolved')}
              className="verification-action-btn verification-btn-resolved"
            >
              Fully Resolved
            </button>

            {/* 2. Partially Resolved Button */}
            <button
              onClick={() => handleSelectResolution('Partially Resolved')}
              className="verification-action-btn verification-btn-partial"
            >
              Partially Resolved
            </button>

            {/* 3. Not Resolved Button */}
            <button
              onClick={() => handleSelectResolution('Not Resolved')}
              className="verification-action-btn verification-btn-not"
            >
              Not Resolved
            </button>
          </div>
        </div>
      )}

      {/* ── VIEW 6: VICTORY / SUCCESS OVERLAY ─────────────────────── */}
      {view === 'success' && selectedMission && (
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
            boxSizing: 'border-box',
            fontFamily: "'MedievalSharp', serif"
          }}>
            {/* Victory Badge */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: resolutionStatus === 'Fully Resolved' ? '#2E6B2A' : '#D47A2A',
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

            {/* Title */}
            <h2 style={{ fontSize: '1.8rem', color: '#2E2018', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Quest Accomplished!
            </h2>

            {/* Subtitle / Status indicator */}
            <div style={{
              fontSize: '1rem',
              fontWeight: 900,
              color: resolutionStatus === 'Fully Resolved' ? '#2E6B2A' : '#9C512A',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Verification Status: {resolutionStatus}
            </div>

            {/* Description */}
            <p style={{ fontSize: '0.95rem', color: '#3C2D24', margin: 0, lineHeight: '1.5', fontWeight: 600 }}>
              {resolutionStatus === 'Fully Resolved'
                ? "Outstanding work, Guild Member! The anomaly has been fully repaired. The scrolls have been permanently archived."
                : "Good effort! The anomaly has been partially addressed. Artisans will monitor the remaining issues."}
            </p>

            {/* XP Award Pill */}
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
              <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2E6B2A' }}>
                +{earnedXp} XP
              </span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#3C2D24', textTransform: 'uppercase' }}>Civic Bounty Awarded</div>
                <div style={{ fontSize: '0.75rem', color: '#5C4A38' }}>Ledger updated with experiences!</div>
              </div>
            </div>

            {/* Return button */}
            <button
              onClick={handleCompleteMission}
              style={{
                width: '100%',
                background: '#2E6B2A',
                border: '2px solid #1c4519',
                borderRadius: '8px',
                color: '#FFF',
                fontWeight: 'bold',
                padding: '14px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
                marginTop: '12px'
              }}
            >
              Return to Map
            </button>
          </div>
        </div>
      )}

      {/* ── HIDDEN FILE & VIDEO INPUTS FOR THE CAMERA VIEWS ──────── */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            handleCapturePhoto();
          }
        }}
        accept="image/*"
        style={{ display: 'none' }}
      />

      <input
        type="file"
        ref={videoInputRef}
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            handleCapturePhoto();
          }
        }}
        accept="video/*"
        capture="environment"
        style={{ display: 'none' }}
      />

      {(view === 'list' || view === 'details') && <BottomNav />}

    </div>
  );
}