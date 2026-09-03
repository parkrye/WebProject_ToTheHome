import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';

const LAYOUT_DIR = path.resolve('src/data/layouts');

/**
 * 맵 관리 툴이 결과를 파일로 남길 수 있게 해 주는 개발용 통로.
 *
 * 브라우저는 파일을 못 쓰므로, 확정 버튼이 여기로 보내고 이쪽이 디스크에 적는다.
 * **개발 서버에서만 붙는다** — 배포된 게임에는 이 통로가 없다.
 */
function stageLayoutApi() {
  const file = (id) => path.join(LAYOUT_DIR, `stage${Number(id)}.json`);

  const readBody = (req) =>
    new Promise((resolve, reject) => {
      let raw = '';
      req.on('data', (chunk) => {
        raw += chunk;
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(raw || '{}'));
        } catch (err) {
          reject(err);
        }
      });
    });

  return {
    name: 'stage-layout-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/__stage/')) return next();
        const url = new URL(req.url, 'http://x');
        const id = url.searchParams.get('stage');
        res.setHeader('content-type', 'application/json; charset=utf-8');

        try {
          if (url.pathname === '/__stage/load') {
            const p = file(id);
            if (!fs.existsSync(p)) {
              res.statusCode = 404;
              return res.end('{}');
            }
            return res.end(fs.readFileSync(p, 'utf8'));
          }

          if (url.pathname === '/__stage/save') {
            const body = await readBody(req);
            fs.mkdirSync(LAYOUT_DIR, { recursive: true });
            fs.writeFileSync(file(body.stage), JSON.stringify(body, null, 2), 'utf8');
            server.config.logger.info(`[stage] stage${body.stage}.json 저장`);
            return res.end('{"ok":true}');
          }

          if (url.pathname === '/__stage/delete') {
            const p = file(id);
            if (fs.existsSync(p)) fs.unlinkSync(p);
            return res.end('{"ok":true}');
          }
        } catch (err) {
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: String(err) }));
        }
        return next();
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [stageLayoutApi()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      // 관리 툴은 개발용이라 배포 빌드에 넣지 않는다
      input: { main: path.resolve('index.html') },
    },
  },
});
