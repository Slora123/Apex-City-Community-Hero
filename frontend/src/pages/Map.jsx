import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import BottomNav from '../components/BottomNav';
import { Navigation, MapPin, CheckCircle, Loader, X } from 'lucide-react';

// Haversine distance in metres
function haversineMetres(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ARRIVAL_THRESHOLD_M = 150; // metres

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function MapPage() {
  const navigate = useNavigate();
  const { hero } = useGame();

  // Accepted mission state
  const [acceptedMission, setAcceptedMission] = useState(null); // { issueId, issueData }
  const [distanceM, setDistanceM] = useState(null);             // metres to issue
  const [arrived, setArrived] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  const [desktopUnlocked, setDesktopUnlocked] = useState(false); // fallback for desktop
  const watchIdRef = useRef(null);
  const desktopTimerRef = useRef(null);

  // Listen for ACCEPT_MISSION from the 3D map iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'ACCEPT_MISSION') {
        const { issueId, issueData } = event.data;
        setAcceptedMission({ issueId, issueData });
        setArrived(false);
        setDistanceM(null);
        setGpsError(false);
        setDesktopUnlocked(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Start GPS watching when a mission is accepted
  useEffect(() => {
    if (!acceptedMission) {
      // Clean up
      if (watchIdRef.current != null) navigator.geolocation?.clearWatch(watchIdRef.current);
      if (desktopTimerRef.current) clearTimeout(desktopTimerRef.current);
      return;
    }

    const issue = acceptedMission.issueData;
    const targetLat = issue?.lat;
    const targetLng = issue?.lng;

    if (!targetLat || !targetLng) {
      // No GPS coords on issue — auto-arrive after 5s
      desktopTimerRef.current = setTimeout(() => setArrived(true), 5000);
      setGpsError(true);
      return;
    }

    if (!navigator.geolocation) {
      // No geolocation API — desktop fallback after 10s
      desktopTimerRef.current = setTimeout(() => { setDesktopUnlocked(true); setArrived(true); }, 10000);
      setGpsError(true);
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const dist = haversineMetres(
          pos.coords.latitude, pos.coords.longitude,
          parseFloat(targetLat), parseFloat(targetLng)
        );
        setDistanceM(Math.round(dist));
        if (dist <= ARRIVAL_THRESHOLD_M) setArrived(true);
      },
      (err) => {
        console.warn('GPS error:', err);
        setGpsError(true);
        // Desktop fallback
        desktopTimerRef.current = setTimeout(() => { setDesktopUnlocked(true); setArrived(true); }, 10000);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (desktopTimerRef.current) clearTimeout(desktopTimerRef.current);
    };
  }, [acceptedMission]);

  const handleStartMission = useCallback(() => {
    if (!acceptedMission) return;
    navigate('/missions', {
      state: {
        openIssueId: acceptedMission.issueId,
        startVerification: true
      }
    });
    setAcceptedMission(null);
  }, [acceptedMission, navigate]);

  const handleDismiss = () => {
    if (watchIdRef.current != null) navigator.geolocation?.clearWatch(watchIdRef.current);
    if (desktopTimerRef.current) clearTimeout(desktopTimerRef.current);
    setAcceptedMission(null);
  };

  const avatarUrl = hero?.avatar || 'male';
  let cleanAvatar = 'male';
  if (avatarUrl === 'female' || avatarUrl.includes('avtar2') || avatarUrl.includes('female')) {
    cleanAvatar = 'female';
  }
  const iframeSrc = `/map.html?avatar=${encodeURIComponent(cleanAvatar)}`;

  const ai = acceptedMission?.issueData?.aiAnalysis || {};
  const issueTitle = ai.missionTitle || acceptedMission?.issueData?.title || 'Civic Mission';
  const issueType  = ai.type || acceptedMission?.issueData?.type || 'Issue';
  const issueReward = ai.estimatedReward || 50;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', background: '#0A0604', fontFamily: 'Inter, sans-serif' }}>
      {/* 3D Toon City Map Iframe */}
      <iframe
        src={iframeSrc}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title="Cobblestone — A Toon City Walk"
        allow="pointer-lock"
        allowFullScreen
      />

      {/* ── Mission Accepted — GPS Arrival Gate Modal ────────── */}
      {acceptedMission && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-end',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            width: '100%',
            background: 'linear-gradient(160deg, #2D1B13 0%, #3e2723 100%)',
            borderTop: '3px solid #8B5E34',
            borderRadius: '20px 20px 0 0',
            padding: '24px 20px 40px 20px',
            boxShadow: '0 -12px 40px rgba(0,0,0,0.8)',
            fontFamily: "'Georgia', serif",
            color: '#F4E8C1',
            boxSizing: 'border-box',
          }}>
            {/* Close */}
            <button
              onClick={handleDismiss}
              style={{ position: 'absolute', top: 16, right: 18, background: 'transparent', border: 'none', color: '#8B5E34', cursor: 'pointer', padding: 0 }}
            >
              <X size={22} />
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, #3A7A35, #2E6B2A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #1C4519', flexShrink: 0
              }}>
                <CheckCircle size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#D4AF37', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Mission Accepted ✓
                </div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#F4E8C1', marginTop: 2 }}>
                  {issueTitle}
                </div>
              </div>
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', gap: 10, margin: '14px 0', fontSize: 13, fontFamily: 'sans-serif' }}>
              <span style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 8, padding: '5px 12px', color: '#B3A387' }}>
                🏷️ {issueType}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 8, padding: '5px 12px', color: '#B3A387' }}>
                🏆 {issueReward} XP on solve
              </span>
            </div>

            {/* GPS Arrival Status */}
            <div style={{
              background: arrived ? 'rgba(46, 107, 42, 0.2)' : 'rgba(45, 27, 19, 0.5)',
              border: `2px solid ${arrived ? '#2E6B2A' : '#5C4033'}`,
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.4s',
            }}>
              {arrived ? (
                <>
                  <CheckCircle size={28} color="#4CAF50" />
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#4CAF50', fontSize: 15 }}>You've Arrived!</div>
                    <div style={{ color: '#B3A387', fontSize: 12, fontFamily: 'sans-serif', marginTop: 2 }}>Location confirmed. Ready to begin.</div>
                  </div>
                </>
              ) : gpsError ? (
                <>
                  <Loader size={24} color="#D4AF37" style={{ animation: 'spin 1.5s linear infinite' }} />
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#D4AF37', fontSize: 14 }}>
                      {desktopUnlocked ? 'Desktop Mode — Starting shortly...' : 'GPS unavailable — navigate manually'}
                    </div>
                    <div style={{ color: '#B3A387', fontSize: 12, fontFamily: 'sans-serif', marginTop: 2 }}>
                      Travel to the issue location, then start the mission.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <MapPin size={28} color="#D4AF37" />
                    <div style={{
                      position: 'absolute', top: -4, right: -4,
                      width: 12, height: 12, borderRadius: '50%',
                      background: '#D4AF37', animation: 'gpsPulse 1.5s infinite',
                    }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#D4AF37', fontSize: 14 }}>
                      {distanceM != null ? `${distanceM}m away` : 'Tracking your location...'}
                    </div>
                    <div style={{ color: '#B3A387', fontSize: 12, fontFamily: 'sans-serif', marginTop: 2 }}>
                      Walk within {ARRIVAL_THRESHOLD_M}m of the issue to start.
                    </div>
                    {distanceM != null && (
                      <div style={{ marginTop: 8, height: 6, background: '#5C4033', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, Math.max(5, 100 - (distanceM / 500 * 100)))}%`,
                          background: 'linear-gradient(90deg, #D4AF37, #4CAF50)',
                          borderRadius: 99,
                          transition: 'width 0.5s',
                        }} />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Navigate to Location button (always shown, non-gated) */}
            <button
              onClick={() => {
                const lat = acceptedMission?.issueData?.lat;
                const lng = acceptedMission?.issueData?.lng;
                if (lat && lng) {
                  window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
                }
              }}
              style={{
                width: '100%', padding: '12px', marginBottom: 10,
                background: 'rgba(80,50,20,0.5)', border: '2px solid #5C4033',
                borderRadius: 10, color: '#C4A484', fontFamily: "'Georgia', serif",
                fontSize: 15, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 8,
                boxSizing: 'border-box',
              }}
            >
              <Navigation size={16} /> Navigate to Location
            </button>

            {/* Start Mission — gated on arrival */}
            <button
              onClick={handleStartMission}
              disabled={!arrived}
              style={{
                width: '100%', padding: '14px',
                background: arrived
                  ? 'linear-gradient(to bottom, #3A7A35, #2E6B2A)'
                  : 'rgba(40,40,40,0.5)',
                border: arrived ? '2px solid #1C4519' : '2px solid #3C3C3C',
                borderRadius: 10, color: arrived ? '#fff' : '#666',
                fontFamily: "'Georgia', serif", fontSize: 17,
                fontWeight: 'bold', cursor: arrived ? 'pointer' : 'not-allowed',
                boxShadow: arrived ? '0 4px 0 #1C4519' : 'none',
                transition: 'all 0.3s',
                boxSizing: 'border-box',
              }}
            >
              {arrived ? '⚔️ Start Mission' : '🔒 Reach Location to Unlock'}
            </button>
          </div>

          <style>{`
            @keyframes gpsPulse {
              0% { transform: scale(0.9); opacity: 0.5; }
              50% { transform: scale(1.4); opacity: 1; }
              100% { transform: scale(0.9); opacity: 0.5; }
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Global Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
}
