import React from 'react';
import { Home, Map, CheckSquare, Scroll, Trophy, Activity, MapPin } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../api';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: <Home />, label: 'Home', path: '/dashboard' },
    { icon: <Map />, label: 'Map', path: '/map' },
    { icon: <CheckSquare />, label: 'Mission', path: '/missions' },
    { icon: <Scroll />, label: 'Report', path: '/report' },
    { icon: <Activity />, label: 'Impact', path: '/impact' },
    { icon: <MapPin />, label: 'Heatmap', path: '/heatmap' },
    { icon: <Trophy />, label: 'Leaderboard', path: '/leaderboard' },
  ];

  return (
    <>
      <style>{`
        .bottom-nav-container {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          width: 92%;
          max-width: 680px;
          height: 76px;
          background-color: rgba(40, 24, 16, 0.96);
          border: 2px solid #8B5E34;
          border-radius: 40px;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          align-items: center;
          justify-items: center;
          padding: 0 8px;
          z-index: 1000;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          box-sizing: border-box;
          transition: all 0.3s ease;
        }

        .bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #A68A64;
          border-radius: 20px;
          padding: 8px 4px;
          width: 90%;
          transition: all 0.25s ease;
          user-select: none;
          text-decoration: none;
        }

        .bottom-nav-item:hover {
          color: #FFD166;
          transform: translateY(-2px);
        }

        .bottom-nav-item.active {
          color: #FFD166;
          background-color: rgba(212, 175, 55, 0.15);
          transform: translateY(-2px);
          box-shadow: inset 0 0 8px rgba(212, 175, 55, 0.1);
        }

        .bottom-nav-icon svg {
          width: 24px;
          height: 24px;
          transition: all 0.25s ease;
        }

        .bottom-nav-label {
          font-size: 0.72rem;
          font-weight: 600;
          margin-top: 4px;
          font-family: 'Inter', sans-serif;
        }

        .bottom-nav-item.active .bottom-nav-label {
          font-weight: 800;
        }

        @media (max-width: 600px) {
          .bottom-nav-container {
            bottom: 12px;
            width: 96%;
            height: 68px;
            padding: 0 4px;
            border-radius: 30px;
          }
          .bottom-nav-item {
            padding: 6px 0px;
            border-radius: 16px;
            width: 95%;
          }
          .bottom-nav-label {
            font-size: 0.62rem;
            margin-top: 2px;
          }
          .bottom-nav-icon svg {
            width: 20px;
            height: 20px;
          }
        }

        @media (max-width: 400px) {
          .bottom-nav-item {
            padding: 4px 6px;
          }
          .bottom-nav-label {
            font-size: 0.58rem;
          }
        }
      `}</style>
      <div className="bottom-nav-container">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div 
              key={item.label}
              onClick={() => {
                if (item.action === 'logout') {
                  handleLogout();
                } else {
                  navigate(item.path);
                }
              }}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="bottom-nav-icon">
                {item.icon}
              </div>
              <span className="bottom-nav-label">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
