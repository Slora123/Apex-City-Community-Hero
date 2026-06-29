import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Globe, User, MapPin, Loader, Lock, ArrowLeft } from 'lucide-react';
import { login, getToken } from '../api';
import { useGame } from '../context/GameContext';
import { auth } from '../firebase';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';

/* ── Shared input style ──────────────────────────────────────── */
const inputStyle = {
  width: '100%',
  paddingLeft: '34px',
  paddingRight: '12px',
  paddingTop: '10px',
  paddingBottom: '10px',
  border: '2px solid #6B4A30',
  borderRadius: '10px',
  fontSize: '0.88rem',
  background: 'rgba(255,245,228,0.18)',
  color: '#F4E8C1',
  fontWeight: 600,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'Inter, system-ui, sans-serif'
};

const labelStyle = {
  fontSize: '0.7rem',
  fontWeight: 700,
  color: '#C4A484',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '4px',
  display: 'block'
};

function FieldIcon({ icon: Icon }) {
  return (
    <Icon
      size={13}
      style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#C4A484', pointerEvents: 'none' }}
    />
  );
}

function InputField({ icon, label, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={{ position: 'relative' }}>
        <FieldIcon icon={icon} />
        <input style={inputStyle} {...props} />
      </div>
    </div>
  );
}

/* ── Stone header badge ──────────────────────────────────────── */
function StoneHeader({ children }) {
  return (
    <div style={{
      position: 'absolute',
      top: '-26px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #8A8A8A 0%, #5E5E5E 100%)',
      border: '3px solid #3C3C3C',
      borderRadius: '14px',
      padding: '10px 36px',
      color: '#FFF',
      fontFamily: "'MedievalSharp', serif",
      fontSize: '1.45rem',
      fontWeight: 900,
      textShadow: '2px 2px 0 #000',
      boxShadow: '0 5px 14px rgba(0,0,0,0.65)',
      whiteSpace: 'nowrap',
      letterSpacing: '1px'
    }}>
      {children}
    </div>
  );
}

/* ── Big medieval button ─────────────────────────────────────── */
function MedievalButton({ onClick, type = 'button', disabled, bg, border, shadow, children, style = {} }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        width: '100%',
        padding: '13px 20px',
        background: disabled ? '#444' : bg,
        border: `3px solid ${border}`,
        borderRadius: '12px',
        color: '#FFF',
        fontFamily: "'MedievalSharp', serif",
        fontWeight: 700,
        fontSize: '1rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : `0 4px 0 ${shadow}, 0 6px 14px rgba(0,0,0,0.35)`,
        transition: 'transform 0.1s, box-shadow 0.1s',
        touchAction: 'manipulation',
        minHeight: '50px',
        opacity: disabled ? 0.7 : 1,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        ...style
      }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = 'none'; }}
      onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = disabled ? 'none' : `0 4px 0 ${shadow}, 0 6px 14px rgba(0,0,0,0.35)`; }}
    >
      {children}
    </button>
  );
}

/* ── Divider ─────────────────────────────────────────────────── */
function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
      <div style={{ flex: 1, height: '1px', background: 'rgba(196,164,132,0.3)' }} />
      <span style={{ color: '#C4A484', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(196,164,132,0.3)' }} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════ */
export default function Login() {
  const navigate = useNavigate();
  const { setHero, refreshMissions } = useGame();

  const [step, setStep] = useState('choose'); // 'choose' | 'email' | 'details_google_new'
  const [emailMode, setEmailMode] = useState('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '', city: '', area: '' });
  const [googleUser, setGoogleUser] = useState(null);
  const [googleNewAccountForm, setGoogleNewAccountForm] = useState({ name: '', city: '', area: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (getToken()) navigate('/dashboard');
  }, [navigate]);

  /* ── Google Sign In ──────────────────────────────────────────── */
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const resultBackend = await login({
        name: user.displayName || 'Google Hero',
        email: user.email,
        loginMethod: 'google',
        avatar: 'male'
      });

      if (resultBackend.requiresRegistration) {
        setGoogleUser(user);
        setGoogleNewAccountForm({ name: resultBackend.name, city: '', area: '' });
        setStep('details_google_new');
        setLoading(false);
        return;
      }

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
      navigate(resultBackend.user.avatar && resultBackend.user.avatar !== 'male' ? '/dashboard' : '/avatar-creation');
    } catch (err) {
      let msg = err.message;
      if (err.code === 'auth/popup-blocked') msg = 'Pop-up was blocked. Please allow pop-ups for this site.';
      else if (err.code === 'auth/popup-closed-by-user') msg = 'Sign-in window closed. Please try again.';
      else if (err.code === 'auth/configuration-not-found') msg = 'Google login is not enabled yet.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Google New Account ──────────────────────────────────────── */
  const handleGoogleNewAccountSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { name, city, area } = googleNewAccountForm;
    if (!name.trim() || !city.trim() || !area.trim()) {
      setError('Name, City and Area are all required.');
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

  /* ── Email Sign In / Up ──────────────────────────────────────── */
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { name, email, password, city, area } = form;
    if (!email.trim() || !password.trim()) { setError('Email and password are required'); return; }
    if (emailMode === 'signup') {
      if (!name.trim()) { setError('Hero Name is required'); return; }
      if (!city.trim() || !area.trim()) { setError('City and Area are required to set up local missions'); return; }
    }
    setLoading(true);
    try {
      let firebaseUser;
      if (emailMode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        firebaseUser = cred.user;
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        firebaseUser = cred.user;
      }

      const result = await login({
        name: emailMode === 'signup' ? name.trim() : undefined,
        email: firebaseUser.email,
        password,
        city: emailMode === 'signup' ? city.trim() : undefined,
        area: emailMode === 'signup' ? area.trim() : undefined,
        loginMethod: 'email',
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
      if (emailMode === 'signup') {
        navigate('/avatar-creation');
      } else {
        navigate(result.user.avatar && result.user.avatar !== 'male' ? '/dashboard' : '/avatar-creation');
      }
    } catch (err) {
      let msg = err.message;
      if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered. Try signing in.';
      else if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(err.code)) msg = 'Incorrect email or password.';
      else if (err.code === 'auth/weak-password') msg = 'Password must be at least 6 characters.';
      else if (err.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="login-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap');

        .login-input:focus {
          border-color: #D4AF37 !important;
          background: rgba(255,245,228,0.28) !important;
        }
        .login-input::placeholder { color: rgba(196,164,132,0.55); }

        @keyframes loginSpin { 100% { transform: rotate(360deg); } }
        .login-spin { animation: loginSpin 1s linear infinite; }

        @keyframes loginFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .login-animate { animation: loginFadeIn 0.3s ease-out; }
      `}</style>

      {/* ── Decorative birds flanking the panel ── */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '420px', marginTop: '30px' }}>

        {/* Stone header badge pokes above the card */}
        <div style={{ position: 'relative' }}>
          <StoneHeader>
            {step === 'choose' ? 'Journey Access' : step === 'email' ? (emailMode === 'signin' ? 'Sign In' : 'Sign Up') : 'Confirm Region'}
          </StoneHeader>

          {/* Main wood panel card */}
          <div className="login-card login-animate" key={step + emailMode}>

            {/* Gold subtitle */}
            <p style={{
              color: '#D4AF37',
              fontFamily: "'MedievalSharp', serif",
              fontSize: '0.85rem',
              textAlign: 'center',
              margin: '14px 0 20px',
              textShadow: '1px 1px 0 #000',
              letterSpacing: '0.5px'
            }}>
              {step === 'choose' ? '✦ Begin your hero journey ✦'
                : step === 'email' && emailMode === 'signin' ? '✦ Enter credentials to continue ✦'
                : step === 'email' && emailMode === 'signup' ? '✦ Register a new Hero account ✦'
                : '✦ Set your district to unlock local missions ✦'}
            </p>

            {/* Error box */}
            {error && (
              <div style={{
                background: 'rgba(181,63,63,0.25)',
                border: '2px solid #B53F3F',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#F4A0A0',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: '16px',
                textAlign: 'center',
                lineHeight: 1.4
              }}>
                {error}
              </div>
            )}

            {/* ── STEP: CHOOSE ─────────────────────────────── */}
            {step === 'choose' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <MedievalButton
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  bg="#4B77BE"
                  border="#3A5C94"
                  shadow="#2A4070"
                >
                  {loading
                    ? <><Globe size={17} className="login-spin" /> Connecting...</>
                    : <><Globe size={17} /> Connect with Google</>}
                </MedievalButton>

                <Divider label="or" />

                <MedievalButton
                  onClick={() => { setStep('email'); setError(''); }}
                  disabled={loading}
                  bg="#C56B3A"
                  border="#9C512A"
                  shadow="#6B3016"
                >
                  <Mail size={17} /> Connect with Email
                </MedievalButton>

                {/* START YOUR JOURNEY decorative footer */}
                <div style={{
                  marginTop: '8px',
                  background: 'linear-gradient(135deg, #5C3D1A, #3e2723)',
                  border: '3px solid #8B5E34',
                  borderRadius: '12px',
                  padding: '12px',
                  textAlign: 'center',
                  color: '#D4AF37',
                  fontFamily: "'MedievalSharp', serif",
                  fontSize: '0.9rem',
                  letterSpacing: '1px',
                  textShadow: '1px 1px 0 #000',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)'
                }}>
                  ⚔ START YOUR JOURNEY ⚔
                </div>
              </div>
            )}

            {/* ── STEP: EMAIL ──────────────────────────────── */}
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {emailMode === 'signup' && (
                  <InputField
                    icon={User}
                    label="Hero Name *"
                    type="text"
                    className="login-input"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your heroic name"
                    required
                  />
                )}

                <InputField
                  icon={Mail}
                  label="Email *"
                  type="email"
                  className="login-input"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@email.com"
                  required
                />

                <InputField
                  icon={Lock}
                  label="Password *"
                  type="password"
                  className="login-input"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                />

                {emailMode === 'signup' && (
                  <>
                    <InputField
                      icon={MapPin}
                      label="City *"
                      type="text"
                      className="login-input"
                      value={form.city}
                      onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="e.g. Mumbai, Bangalore…"
                      required
                    />
                    <InputField
                      icon={MapPin}
                      label="Area / District *"
                      type="text"
                      className="login-input"
                      value={form.area}
                      onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                      placeholder="e.g. Bandra, Indiranagar…"
                      required
                    />
                  </>
                )}

                <button
                  type="button"
                  onClick={() => { setEmailMode(emailMode === 'signin' ? 'signup' : 'signin'); setError(''); }}
                  style={{
                    background: 'none', border: 'none', color: '#C4A484',
                    fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline',
                    cursor: 'pointer', textAlign: 'right', padding: '0'
                  }}
                >
                  {emailMode === 'signin' ? "Don't have an account? Sign Up →" : "Already have an account? Sign In →"}
                </button>

                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => { setStep('choose'); setError(''); }}
                    style={{
                      flex: 1, padding: '10px', border: '2px solid #6B4A30',
                      background: 'rgba(255,255,255,0.06)', borderRadius: '10px',
                      color: '#C4A484', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>

                  <MedievalButton
                    type="submit"
                    disabled={loading}
                    bg="#2E6B2A"
                    border="#1C4519"
                    shadow="#122E0F"
                    style={{ flex: 2 }}
                  >
                    {loading
                      ? <><Loader size={15} className="login-spin" /> Loading…</>
                      : emailMode === 'signin' ? 'Enter the City' : '⚔ Join as Hero'}
                  </MedievalButton>
                </div>
              </form>
            )}

            {/* ── STEP: GOOGLE NEW ACCOUNT ─────────────────── */}
            {step === 'details_google_new' && (
              <form onSubmit={handleGoogleNewAccountSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <InputField
                  icon={User}
                  label="Hero Name *"
                  type="text"
                  className="login-input"
                  value={googleNewAccountForm.name}
                  onChange={e => setGoogleNewAccountForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your heroic name"
                  required
                />
                <InputField
                  icon={MapPin}
                  label="City *"
                  type="text"
                  className="login-input"
                  value={googleNewAccountForm.city}
                  onChange={e => setGoogleNewAccountForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Mumbai, Bangalore…"
                  required
                />
                <InputField
                  icon={MapPin}
                  label="Area / District *"
                  type="text"
                  className="login-input"
                  value={googleNewAccountForm.area}
                  onChange={e => setGoogleNewAccountForm(f => ({ ...f, area: e.target.value }))}
                  placeholder="e.g. Bandra, Indiranagar…"
                  required
                />

                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => { setStep('choose'); setError(''); }}
                    style={{
                      flex: 1, padding: '10px', border: '2px solid #6B4A30',
                      background: 'rgba(255,255,255,0.06)', borderRadius: '10px',
                      color: '#C4A484', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                  >
                    <ArrowLeft size={14} /> Cancel
                  </button>

                  <MedievalButton
                    type="submit"
                    disabled={loading}
                    bg="#2E6B2A"
                    border="#1C4519"
                    shadow="#122E0F"
                    style={{ flex: 2 }}
                  >
                    {loading
                      ? <><Loader size={15} className="login-spin" /> Configuring…</>
                      : '⚔ Confirm & Join'}
                  </MedievalButton>
                </div>
              </form>
            )}

          </div>{/* /login-card */}
        </div>
      </div>
    </div>
  );
}
