// Runs Vite (:3000) + Express Telegram relay (:3001) together.
// The frontend proxies `/api/*` → localhost:3001 (see vite.config.ts),
// so running ONLY `npm run dev` leaves /api/notify-booking unreachable
// (Vite returns HTTP 500). Use `npm run dev:all` instead.
import { spawn } from 'node:child_process';

const children = [
  spawn('npx', ['vite', '--port=3000', '--host=0.0.0.0'], { stdio: 'inherit', shell: true }),
  spawn('node', ['server.js'], {
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, PORT: process.env.PORT || '3001' },
  }),
];

function shutdown(signal) {
  for (const child of children) {
    try {
      child.kill(signal);
    } catch {
      /* already exited */
    }
  }
  setTimeout(() => process.exit(0), 300);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

await Promise.all(children.map((c) => new Promise((resolve) => c.on('exit', resolve))));
