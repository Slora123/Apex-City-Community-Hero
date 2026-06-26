# Apex City - Community Hero 🦸‍♂️🏙️

A gamified, interactive web application that empowers citizens to become "Community Heroes" by reporting local infrastructure, environment, and safety issues. Citizens earn XP, level up, unlock achievements, and climb the leaderboard, while authorities gain access to a dedicated dashboard with real-time statistics and heatmaps to manage and resolve issues efficiently.

## 🚀 Features

### 🎮 For Heroes (Citizens)
- **Avatar Creation**: Build your hero persona with custom avatars.
- **Interactive Map**: View issues in your neighborhood with real-time status updates.
- **Gamified Progression**: Earn XP for reporting, verifying, and completing missions.
- **Hero Leaderboard**: Compete with other citizens to become the top hero in your city.
- **Achievements**: Unlock unique badges as you contribute to your community.

### 🏛️ For Authorities
- **Impact Dashboard**: Real-time SVG charts showing issues resolved, active categories, and citizen engagement.
- **District Heatmap**: Visual hotspots highlighting high-density anomaly zones requiring immediate attention.
- **Mission Dispatch**: Easily assign issues to active heroes or dispatch municipal teams.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Vanilla CSS, SVG, Lucide Icons.
- **Backend**: Node.js, Express, Better-SQLite3.
- **Database**: SQLite.

---

## ⚙️ Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- npm (Node Package Manager)

### 1. Clone the Repository
```bash
git clone https://github.com/Slora123/Apex-City---Community-Hero.git
cd Apex-City---Community-Hero
```

### 2. Setup Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `backend/.env` (see `backend/.env.example` if applicable).
4. Initialize the database and start the server:
   ```bash
   npm start
   ```
   The backend server runs on `http://localhost:3001`.

### 3. Setup Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `frontend/.env` (such as Firebase config).
4. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend application will be available at `http://localhost:5173`.

---

## 📄 License
This project is licensed under the MIT License.
