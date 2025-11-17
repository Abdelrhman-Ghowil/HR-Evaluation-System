import { spawn } from 'child_process';

// Respect Replit/hosted envs: bind to provided PORT and 0.0.0.0
const port = process.env.PORT || process.env.VITE_PORT || 4173;
const isWindows = process.platform === 'win32';
const npx = isWindows ? 'npx.cmd' : 'npx';

const args = ['vite', 'preview', '--host', '0.0.0.0', '--port', String(port)];
const child = spawn(npx, args, { stdio: 'inherit' });

child.on('exit', (code) => {
  process.exit(code ?? 0);
});