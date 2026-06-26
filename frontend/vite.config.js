import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom Vite server middleware plugin to act as a secure backend API
function authorityApiPlugin() {
  return {
    name: 'authority-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Only handle POST requests to /api/authority/unlock
        if (req.url === '/api/authority/unlock' && req.method === 'POST') {
          let body = '';
          
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', () => {
            try {
              const { passcode } = JSON.parse(body);
              
              // Hardcoded secure database simulation on the server-side
              // These values are strictly on the server and are never sent in the client bundle!
              const codeVasai = '1070';
              const codeVirar = '1072';
              const codeNalasopara = '1073';
              
              const locationData = {
                Vasai: {
                  reports: [
                    { label: 'Vasai Grant', finance: '99%', resevent: '$254,768' },
                    { label: 'Vasai Aqueduct', finance: '95%', resevent: '$253,250' },
                    { label: 'Vasai Guest', finance: '850', resevent: '$300,509' },
                    { label: 'Vasai Watch', finance: '850', resevent: '$299,786' },
                    { label: 'Vasai Merchant', finance: '850', resevent: '$259,787' },
                    { label: 'Vasai Vault', finance: '850', resevent: '$329,997' }
                  ],
                  scalarHotspot: { r: 4.5, c: 6.5 },
                  senthianTop: [90, 105, 98, 112, 106, 128],
                  senthianBottom: [62, 38, 42, 44, 58, 40],
                  affiliateHotspot: { r: 3.5, c: 10 },
                  contributorBars: [
                    { label: 'C', val: 108 },
                    { label: 'B', val: 50 },
                    { label: 'D', val: 108 },
                    { label: 'B', val: 135 },
                    { label: 'D', val: 86 },
                    { label: '+', val: 92 }
                  ]
                },
                Virar: {
                  reports: [
                    { label: 'Virar Grant', finance: '99%', resevent: '$189,450' },
                    { label: 'Virar Roadway', finance: '95%', resevent: '$210,120' },
                    { label: 'Virar Guest', finance: '850', resevent: '$240,680' },
                    { label: 'Virar Guard', finance: '850', resevent: '$280,340' },
                    { label: 'Virar Market', finance: '850', resevent: '$195,430' },
                    { label: 'Virar Chest', finance: '850', resevent: '$299,500' }
                  ],
                  scalarHotspot: { r: 2.5, c: 3.5 },
                  senthianTop: [110, 85, 95, 80, 115, 90],
                  senthianBottom: [45, 52, 30, 48, 35, 55],
                  affiliateHotspot: { r: 2.5, c: 7 },
                  contributorBars: [
                    { label: 'C', val: 75 },
                    { label: 'B', val: 120 },
                    { label: 'D', val: 90 },
                    { label: 'B', val: 60 },
                    { label: 'D', val: 130 },
                    { label: '+', val: 85 }
                  ]
                },
                Nalasopara: {
                  reports: [
                    { label: 'Nala Grant', finance: '99%', resevent: '$145,200' },
                    { label: 'Nala Lantern', finance: '95%', resevent: '$162,300' },
                    { label: 'Nala Guest', finance: '850', resevent: '$198,400' },
                    { label: 'Nala Patrol', finance: '850', resevent: '$220,150' },
                    { label: 'Nala Gate', finance: '850', resevent: '$180,900' },
                    { label: 'Nala Keep', finance: '850', resevent: '$250,750' }
                  ],
                  scalarHotspot: { r: 5.5, c: 7.5 },
                  senthianTop: [80, 95, 120, 100, 125, 110],
                  senthianBottom: [50, 40, 55, 30, 42, 48],
                  affiliateHotspot: { r: 4.5, c: 13 },
                  contributorBars: [
                    { label: 'C', val: 130 },
                    { label: 'B', val: 80 },
                    { label: 'D', val: 125 },
                    { label: 'B', val: 95 },
                    { label: 'D', val: 70 },
                    { label: '+', val: 115 }
                  ]
                }
              };
              
              const cleanInput = passcode ? passcode.toString().trim() : '';
              
              res.setHeader('Content-Type', 'application/json');
              
              if (cleanInput === codeVasai) {
                res.end(JSON.stringify({ success: true, location: 'Vasai', telemetry: locationData.Vasai }));
              } else if (cleanInput === codeVirar) {
                res.end(JSON.stringify({ success: true, location: 'Virar', telemetry: locationData.Virar }));
              } else if (cleanInput === codeNalasopara) {
                res.end(JSON.stringify({ success: true, location: 'Nalasopara', telemetry: locationData.Nalasopara }));
              } else {
                res.statusCode = 401;
                res.end(JSON.stringify({ success: false, error: 'The gatekeeper frowns. That passcode is unrecognized in our archives.' }));
              }
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: 'Internal Server Error' }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), authorityApiPlugin()],
  envDir: '../',
  server: {
    proxy: {
      // Forward all /api/* calls to the backend EXCEPT /api/authority/* (handled by plugin)
      '/api/auth': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/issues': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/missions': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/analyze': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/users': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/leaderboard': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/stats': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/achievements': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/health': { target: 'http://localhost:3001', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3001', changeOrigin: true },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true
      }
    }
  }
})
