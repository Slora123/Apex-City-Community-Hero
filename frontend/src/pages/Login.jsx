import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Globe, User, MapPin, Loader, Lock } from 'lucide-react';
import { login, getToken } from '../api';
import { useGame } from '../context/GameContext';
import { auth } from '../firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';

export default function Login() {
  const navigate = useNavigate();
  const { setHero, refreshMissions } = useGame();

  const [step, setStep] = useState('choose'); // 'choose' | 'email' | 'details_google_new'
  const [emailMode, setEmailMode] = useState('signin'); // 'signin' | 'signup'
  
  // Forms
  const [form, setForm] = useState({ name: '', email: '', password: '', city: '', area: '' });
  const [googleUser, setGoogleUser] = useState(null); // Cached Google user for new profile setup
  const [googleNewAccountForm, setGoogleNewAccountForm] = useState({ name: '', city: '', area: '' });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  React.useEffect(() => {
    if (getToken()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Call our backend to log in or check if user exists in our local SQLite DB
      const resultBackend = await login({
        name: user.displayName || 'Google Hero',
        email: user.email,
        loginMethod: 'google',
        avatar: 'male'
      });

      setHero({
        id: resultBackend.user.id,
        name: resultBackend.user.name,
        avatar: resultBackend.user.avatar,
        level: resultBackend.user.level,
        xp: resultBackend.user.xp,
        rank: resultBackend.user.rank,
        city: resultBackend.user.city,
        area: resultBackend.user.area,
        email: resultBackend.user.email
      });

      await refreshMissions?.();

      // If the user's city or area is empty, they are a new user signing in for the first time.
      // We should prompt them for their city/area to give them local missions!
      if (!resultBackend.user.city || !resultBackend.user.area) {
        setGoogleUser(user);
        setGoogleNewAccountForm({
          name: resultBackend.user.name,
          city: '',
          area: ''
        });
        setStep('details_google_new');
      } else {
        // If they already have city/area set up, go to avatar creation or dashboard
        if (resultBackend.user.avatar && resultBackend.user.avatar !== 'male') {
          navigate('/dashboard');
        } else {
          navigate('/avatar-creation');
        }
      }
    } catch (err) {
      console.error('Firebase Google Auth error:', err);
      let errMsg = err.message;
      if (err.code === 'auth/popup-blocked') {
        errMsg = 'The sign-in window was blocked by your browser. Please enable popups.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        errMsg = 'Sign-in window closed. Please try again.';
      } else if (err.code === 'auth/configuration-not-found') {
        errMsg = 'Firebase Google login is not enabled in Firebase Console.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleNewAccountSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { name, city, area } = googleNewAccountForm;

    if (!name.trim() || !city.trim() || !area.trim()) {
      setError('Name, City and Area are required to configure your local community grid.');
      return;
    }

    setLoading(true);
    try {
      const result = await login({
        name: name.trim(),
        email: googleUser.email,
        city: city.trim(),
        area: area.trim(),
        loginMethod: 'google',
        avatar: 'male'
      });

      setHero({
        id: result.user.id,
        name: result.user.name,
        avatar: result.user.avatar,
        level: result.user.level,
        xp: result.user.xp,
        rank: result.user.rank,
        city: result.user.city,
        area: result.user.area,
        email: result.user.email
      });

      await refreshMissions?.();
      navigate('/avatar-creation');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { name, email, password, city, area } = form;

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }

    if (emailMode === 'signup') {
      if (!name.trim()) {
        setError('Hero Name is required for registration');
        return;
      }
      if (!city.trim() || !area.trim()) {
        setError('City and Area are required to set up your local missions');
        return;
      }
    }

    setLoading(true);
    try {
      let firebaseUser;
      if (emailMode === 'signup') {
        // 1. Register user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        firebaseUser = userCredential.user;
      } else {
        // 1. Sign in user in Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        firebaseUser = userCredential.user;
      }

      // 2. Synchronize with SQLite backend
      const result = await login({
        name: emailMode === 'signup' ? name.trim() : undefined,
        email: firebaseUser.email,
        password: password,
        city: emailMode === 'signup' ? city.trim() : undefined,
        area: emailMode === 'signup' ? area.trim() : undefined,
        loginMethod: 'email',
        avatar: 'male'
      });

      // 3. Update local GameContext state
      setHero({
        id: result.user.id,
        name: result.user.name,
        avatar: result.user.avatar,
        level: result.user.level,
        xp: result.user.xp,
        rank: result.user.rank,
        city: result.user.city,
        area: result.user.area,
        email: result.user.email
      });

      await refreshMissions?.();

      if (emailMode === 'signup') {
        navigate('/avatar-creation');
      } else {
        if (result.user.avatar && result.user.avatar !== 'male') {
          navigate('/dashboard');
        } else {
          navigate('/avatar-creation');
        }
      }
    } catch (err) {
      console.error('Firebase Email Auth error:', err);
      let errMsg = err.message;
      if (err.code === 'auth/email-already-in-use') {
        errMsg = 'This email is already registered. Try signing in.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errMsg = 'Incorrect email or password. Please try again.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'Password is too weak. Must be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = 'Please enter a valid email address.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ position: 'relative', width: '90%', maxWidth: '400px', margin: '0 auto' }}>
        <img
          src="/login.png"
          alt="Journey Access Panel"
          style={{ 
            width: '100%', 
            height: '100%',
            minHeight: step === 'choose' ? '400px' : (step === 'email' && emailMode === 'signup') ? '680px' : (step === 'email' && emailMode === 'signin') ? '480px' : '520px',
            objectFit: 'fill',
            display: 'block' 
          }}
        />

        <div style={{
          position: 'absolute',
          top: '18%',
          left: '12%',
          right: '12%',
          bottom: '8%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '10px'
        }}>
          {error && (
            <div style={{
              width: '100%',
              maxWidth: '320px',
              background: 'rgba(181,63,63,0.18)',
              border: '2.5px solid #B53F3F',
              borderRadius: '10px',
              padding: '8px 12px',
              color: '#B53F3F',
              fontSize: '0.8rem',
              fontWeight: 800,
              marginBottom: '10px',
              boxSizing: 'border-box'
            }}>
              {error}
            </div>
          )}

          {step === 'choose' && (
            <>
              <h1 style={{
                fontSize: 'min(2.2rem, 6.5vw)',
                fontWeight: '900',
                color: '#4A3B32',
                textTransform: 'uppercase',
                marginBottom: '4px',
                fontFamily: 'system-ui',
                letterSpacing: '1px'
              }}>
                Journey Access
              </h1>
              <p style={{
                color: '#7A6B5D',
                marginBottom: 'min(28px, 5vw)',
                fontWeight: '600',
                fontSize: 'min(1.1rem, 3.8vw)'
              }}>
                Begin your hero journey.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '320px' }}>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    backgroundColor: '#4B77BE', color: 'white',
                    border: '3px solid #3A5C94', borderRadius: '12px',
                    padding: '14px 20px', fontSize: 'min(1.05rem, 3.6vw)', fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 0 #3A5C94, 0 5px 10px rgba(0,0,0,0.3)',
                    transition: 'transform 0.1s', touchAction: 'manipulation', minHeight: '48px', width: '100%',
                    opacity: loading ? 0.8 : 1
                  }}
                >
                  {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Connecting...</> : <><Globe size={18} /> Connect with Google</>}
                </button>

                <button
                  onClick={() => handleChooseMethod('email')}
                  disabled={loading}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    backgroundColor: '#C56B3A', color: 'white',
                    border: '3px solid #9C512A', borderRadius: '12px',
                    padding: '14px 20px', fontSize: 'min(1.05rem, 3.6vw)', fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 0 #9C512A, 0 5px 10px rgba(0,0,0,0.3)',
                    transition: 'transform 0.1s', touchAction: 'manipulation', minHeight: '48px', width: '100%'
                  }}
                >
                  <Mail size={18} color="#F4E8C1" /> Connect with Email
                </button>
              </div>
            </>
          )}

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h1 style={{
                fontSize: 'min(1.6rem, 5.5vw)', fontWeight: '900', color: '#4A3B32',
                textTransform: 'uppercase', marginBottom: '2px', fontFamily: 'system-ui'
              }}>
                {emailMode === 'signin' ? 'Sign In' : 'Sign Up'}
              </h1>
              <p style={{ color: '#7A6B5D', fontSize: '0.8rem', marginBottom: '2px', fontWeight: 600 }}>
                {emailMode === 'signin' ? 'Enter credentials to enter.' : 'Register a new Hero account!'}
              </p>

              {emailMode === 'signup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', textAlign: 'left' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4A3B32' }}>Hero Name *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8B5E34' }} />
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Your heroic name"
                      style={{
                        width: '100%', paddingLeft: '30px', paddingRight: '10px', paddingTop: '7px', paddingBottom: '7px',
                        border: '2px solid #8B5E34', borderRadius: '8px', fontSize: '0.8rem',
                        background: 'rgba(255,255,255,0.55)', color: '#2D1B13', fontWeight: 600,
                        outline: 'none', boxSizing: 'border-box'
                      }}
                      required
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4A3B32' }}>Email *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8B5E34' }} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@email.com"
                    style={{
                      width: '100%', paddingLeft: '30px', paddingRight: '10px', paddingTop: '7px', paddingBottom: '7px',
                      border: '2px solid #8B5E34', borderRadius: '8px', fontSize: '0.8rem',
                      background: 'rgba(255,255,255,0.55)', color: '#2D1B13', fontWeight: 600,
                      outline: 'none', boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4A3B32' }}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8B5E34' }} />
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    style={{
                      width: '100%', paddingLeft: '30px', paddingRight: '10px', paddingTop: '7px', paddingBottom: '7px',
                      border: '2px solid #8B5E34', borderRadius: '8px', fontSize: '0.8rem',
                      background: 'rgba(255,255,255,0.55)', color: '#2D1B13', fontWeight: 600,
                      outline: 'none', boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
              </div>

              {emailMode === 'signup' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', textAlign: 'left' }}>
                    <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4A3B32' }}>City *</label>
                    <div style={{ position: 'relative' }}>
                      <MapPin size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8B5E34' }} />
                      <input
                        type="text"
                        value={form.city}
                        onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                        placeholder="e.g. Mumbai, Bangalore..."
                        style={{
                          width: '100%', paddingLeft: '30px', paddingRight: '10px', paddingTop: '7px', paddingBottom: '7px',
                          border: '2px solid #8B5E34', borderRadius: '8px', fontSize: '0.8rem',
                          background: 'rgba(255,255,255,0.55)', color: '#2D1B13', fontWeight: 600,
                          outline: 'none', boxSizing: 'border-box'
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', textAlign: 'left' }}>
                    <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4A3B32' }}>Area / District *</label>
                    <div style={{ position: 'relative' }}>
                      <MapPin size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8B5E34' }} />
                      <input
                        type="text"
                        value={form.area}
                        onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                        placeholder="e.g. Bandra, Indiranagar..."
                        style={{
                          width: '100%', paddingLeft: '30px', paddingRight: '10px', paddingTop: '7px', paddingBottom: '7px',
                          border: '2px solid #8B5E34', borderRadius: '8px', fontSize: '0.8rem',
                          background: 'rgba(255,255,255,0.55)', color: '#2D1B13', fontWeight: 600,
                          outline: 'none', boxSizing: 'border-box'
                        }}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => setEmailMode(emailMode === 'signin' ? 'signup' : 'signin')}
                style={{
                  background: 'none', border: 'none', color: '#8B5E34',
                  fontSize: '0.72rem', fontWeight: 800, textDecoration: 'underline',
                  cursor: 'pointer', margin: '2px 0', alignSelf: 'flex-end'
                }}
              >
                {emailMode === 'signin' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>

              <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                <button
                  type="button"
                  onClick={() => { setStep('choose'); setError(''); }}
                  style={{
                    flex: 1, padding: '9px', border: '2px solid #8B5E34',
                    background: 'transparent', borderRadius: '8px', color: '#4A3B32',
                    fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem'
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 2, padding: '9px', background: '#2E6B2A',
                    border: '2px solid #1C4519', borderRadius: '8px', color: '#FFF',
                    fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    opacity: loading ? 0.8 : 1
                  }}
                >
                  {loading ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading...</> : (emailMode === 'signin' ? 'Sign In' : 'Join as Hero')}
                </button>
              </div>
            </form>
          )}

          {step === 'details_google_new' && (
            <form onSubmit={handleGoogleNewAccountSubmit} style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h1 style={{
                fontSize: 'min(1.6rem, 5.5vw)', fontWeight: '900', color: '#4A3B32',
                textTransform: 'uppercase', marginBottom: '2px', fontFamily: 'system-ui'
              }}>
                Confirm Region
              </h1>
              <p style={{ color: '#7A6B5D', fontSize: '0.8rem', marginBottom: '4px', fontWeight: 600 }}>
                Set your district to unlock local missions!
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4A3B32' }}>Hero Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8B5E34' }} />
                  <input
                    type="text"
                    value={googleNewAccountForm.name}
                    onChange={e => setGoogleNewAccountForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    style={{
                      width: '100%', paddingLeft: '30px', paddingRight: '10px', paddingTop: '8px', paddingBottom: '8px',
                      border: '2px solid #8B5E34', borderRadius: '8px', fontSize: '0.8rem',
                      background: 'rgba(255,255,255,0.55)', color: '#2D1B13', fontWeight: 600,
                      outline: 'none', boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4A3B32' }}>City *</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8B5E34' }} />
                  <input
                    type="text"
                    value={googleNewAccountForm.city}
                    onChange={e => setGoogleNewAccountForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="e.g. Mumbai, Bangalore..."
                    style={{
                      width: '100%', paddingLeft: '30px', paddingRight: '10px', paddingTop: '8px', paddingBottom: '8px',
                      border: '2px solid #8B5E34', borderRadius: '8px', fontSize: '0.8rem',
                      background: 'rgba(255,255,255,0.55)', color: '#2D1B13', fontWeight: 600,
                      outline: 'none', boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4A3B32' }}>Area / District *</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8B5E34' }} />
                  <input
                    type="text"
                    value={googleNewAccountForm.area}
                    onChange={e => setGoogleNewAccountForm(f => ({ ...f, area: e.target.value }))}
                    placeholder="e.g. Bandra, Indiranagar..."
                    style={{
                      width: '100%', paddingLeft: '30px', paddingRight: '10px', paddingTop: '8px', paddingBottom: '8px',
                      border: '2px solid #8B5E34', borderRadius: '8px', fontSize: '0.8rem',
                      background: 'rgba(255,255,255,0.55)', color: '#2D1B13', fontWeight: 600,
                      outline: 'none', boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => { setStep('choose'); setError(''); }}
                  style={{
                    flex: 1, padding: '10px', border: '2px solid #8B5E34',
                    background: 'transparent', borderRadius: '8px', color: '#4A3B32',
                    fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 2, padding: '10px', background: '#2E6B2A',
                    border: '2px solid #1C4519', borderRadius: '8px', color: '#FFF',
                    fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    opacity: loading ? 0.8 : 1
                  }}
                >
                  {loading ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Configuring...</> : <>Confirm & Join</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
