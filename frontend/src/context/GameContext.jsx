import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getMe, getMissions, submitIssue, getStoredUser, getToken, healthCheck, getImageUrl } from '../api';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useSocket } from '../hooks/useSocket';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [hero, setHero] = useState(() => {
    // Hydrate from localStorage on first render
    const stored = getStoredUser();
    return stored ? {
      id: stored.id,
      name: stored.name || 'Hero',
      avatar: stored.avatar || 'male',
      level: stored.level || 1,
      xp: stored.xp || 0,
      rank: stored.rank || 'Novice Hero',
      city: stored.city || '',
      area: stored.area || '',
      email: stored.email || '',
      totalReports: stored.totalReports || 0,
      totalMissions: stored.totalMissions || 0,
      totalVerifications: stored.totalVerifications || 0,
      achievementCount: stored.achievementCount || 0
    } : {
      id: null,
      name: 'Hero',
      avatar: 'male',
      level: 1,
      xp: 0,
      rank: 'Novice Hero',
      city: '',
      area: '',
      totalReports: 0,
      totalMissions: 0,
      totalVerifications: 0,
      achievementCount: 0
    };
  });

  const [missions, setMissions] = useState([]);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Toast for real-time mission activation notifications
  const [missionToast, setMissionToast] = useState(null);

  // Background Music State
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('bg_volume');
    return saved !== null ? parseFloat(saved) : 0.3;
  });
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('bg_muted') === 'true';
  });

  const audioRef = useRef(null);

  // Initialize and update audio player
  useEffect(() => {
    const audio = new Audio('/Mesmerizing Galaxy Loop.mp3');
    audio.loop = true;
    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;

    const startPlay = () => {
      audio.play().catch((err) => {
        console.warn('Autoplay prevented playing background music:', err.message);
      });
      window.removeEventListener('click', startPlay);
      window.removeEventListener('keydown', startPlay);
    };

    window.addEventListener('click', startPlay);
    window.addEventListener('keydown', startPlay);

    return () => {
      audio.pause();
      window.removeEventListener('click', startPlay);
      window.removeEventListener('keydown', startPlay);
    };
  }, []);

  // Sync volume and mute state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      localStorage.setItem('bg_volume', volume.toString());
      localStorage.setItem('bg_muted', isMuted.toString());
    }
  }, [volume, isMuted]);

  // ── Fetch real hero data from backend ──────────────────────────────────
  const refreshHero = useCallback(async () => {
    if (!getToken()) return;
    try {
      const data = await getMe();
      const updated = {
        id: data.id,
        name: data.name,
        avatar: data.avatar || 'male',
        level: data.level,
        xp: data.xp,
        rank: data.rank,
        city: data.city,
        area: data.area,
        email: data.email,
        totalReports: data.totalReports || 0,
        totalMissions: data.totalMissions || 0,
        totalVerifications: data.totalVerifications || 0,
        achievementCount: data.achievementCount || 0
      };
      setHero(updated);
      localStorage.setItem('ch_user', JSON.stringify({ ...data }));
    } catch (err) {
      // Backend offline — keep local state
      console.warn('Backend offline, using local state:', err.message);
    }
  }, []);

  // ── Fetch missions from backend ────────────────────────────────────────
  const refreshMissions = useCallback(async (lat, lng) => {
    try {
      const params = { status: 'all' };
      if (lat != null && lng != null) {
        params.lat = lat;
        params.lng = lng;
        params.radius = 5000; // 5km radius
      }
      const data = await getMissions(params);
      if (data && data.missions) {
        const mapped = data.missions.map(m => ({
          id: m.id,
          title: m.issue_title || m.title || 'Unknown Mission',
          type: m.issue_type || m.type || 'other',
          status: m.status, // exact backend state
          location: m.address || 'Unknown Location',
          description: m.description || '',
          severity: m.severity || 'medium',
          category: m.category || '',
          aiAnalysis: m.aiAnalysis || {},
          lat: m.issue_lat,
          lng: m.issue_lng,
          distance: m.distance,
          beforePhotoUrl: getImageUrl(m.beforePhotoUrl),
          afterPhotoUrl: getImageUrl(m.afterPhotoUrl),
          photoUrl: getImageUrl(m.photoUrl),
          issueId: m.issue_id,
          backendId: m.id,
          assigneeId: m.assignee_id,
          reporter_count: m.reporter_count,
          reporterArea: m.reporter_area || '',
          reporterId: m.reporter_id || '',
          myVerdict: m.myVerdict || null,
          verificationCount: parseInt(m.verification_count || 0, 10)
        }));
        setMissions(mapped);
        setIsBackendOnline(true);
      }
    } catch (err) {
      console.warn('Could not fetch missions from backend:', err.message);
      setIsBackendOnline(false);
    }
  }, []);

  // ── On mount: check backend and load data ─────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const res = await healthCheck();
        if (res.status === 'ok') {
          setIsBackendOnline(true);
          await Promise.all([refreshHero(), refreshMissions()]);
        } else {
          setIsBackendOnline(false);
          setMissions([]);
        }
      } catch {
        setIsBackendOnline(false);
        setMissions([]);
      }
    };
    init();
  }, [refreshHero, refreshMissions]);

  // ── Real-time: refresh missions when a new one activates ──────────────
  useSocket({
    mission_activated: (data) => {
      // Show a brief toast, then auto-refresh the mission list
      setMissionToast({ title: data.title, message: data.message });
      setTimeout(() => setMissionToast(null), 5000);
      refreshMissions();
    },
    new_issue: () => {
      // Refresh so pending reporter counts stay up to date
      refreshMissions();
    },
    confirm_issue_needed: () => {
      // A new pending issue was reported — refresh so the locked card appears
      refreshMissions();
    }
  });

  // ── Sync with Firebase Auth state changes ─────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        // Firebase signed out — clear local storage and local state
        if (getToken()) {
          console.log('🔒 Firebase session ended. Restoring local state to guest.');
          localStorage.removeItem('ch_token');
          localStorage.removeItem('ch_user');
          setHero({
            id: null,
            name: 'Hero',
            avatar: 'male',
            level: 1,
            xp: 0,
            rank: 'Novice Hero',
            city: '',
            area: '',
            email: ''
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // ── Local-only XP add (used as fallback / optimistic update) ──────────
  const addXp = (amount) => {
    setHero(prev => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      if (newXp >= 5000) {
        newLevel += 1;
        newXp -= 5000;
      }
      const updated = { ...prev, xp: newXp, level: newLevel };
      localStorage.setItem('ch_user', JSON.stringify(updated));
      return updated;
    });
  };

  // ── Update mission status locally ──────────────────────────────────────
  const updateMissionStatus = (id, newStatus) => {
    if (newStatus === 'completed' || newStatus === 'rejected') {
      // Remove completed/rejected missions from the list immediately
      setMissions(prev => prev.filter(m => m.id !== id));
    } else {
      setMissions(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
    }
  };


  // ── Report issue — strictly calls backend API ────────────────────────
  const reportIssue = async (newIssue, photoFile = null) => {
    if (!getToken()) {
      throw new Error('Player is not authenticated. Please log in.');
    }

    try {
      setIsLoading(true);
      const result = await submitIssue({
        title: newIssue.title,
        type: newIssue.type,
        lat: newIssue.lat,
        lng: newIssue.lng,
        address: newIssue.location,
        description: newIssue.description,
        severity: newIssue.severity,
        category: newIssue.category,
        photo: photoFile
      });

      // Award XP optimistically if backend succeeded
      if (result.pointsAwarded) {
        addXp(result.pointsAwarded);
      }

      // Refresh missions list to include new one
      await refreshMissions();

      return result;
    } catch (err) {
      console.error('Backend report failed:', err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GameContext.Provider value={{
      hero,
      setHero,
      addXp,
      missions,
      setMissions,
      updateMissionStatus,
      reportIssue,
      refreshHero,
      refreshMissions,
      isBackendOnline,
      isLoading,
      missionToast,
      clearMissionToast: () => setMissionToast(null)
    }}>
      {children}
    </GameContext.Provider>
  );
};
