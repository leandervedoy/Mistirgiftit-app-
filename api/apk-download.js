'use strict';

const { Readable } = require('node:stream');

const RELEASE_API = 'https://api.github.com/repos/leandervedoy/Mistirgiftit-app-/releases/tags/apk-demo-latest';
const APK_FILENAME = 'MistirGift-VedoyStudio-demo.apk';

async function getApkAsset() {
  const response = await fetch(RELEASE_API, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'Vedoy-Studio-MistirGift-APK'
    },
    signal: AbortSignal.timeout(10000)
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Release status unavailable');
  const release = await response.json();
  const asset = (release.assets || []).find(
    (item) => item.name === APK_FILENAME &&
      item.state === 'uploaded' &&
      Number.isFinite(item.size) && item.size > 0
  );
  if (!asset) return null;
  const url = new URL(asset.browser_download_url);
  if (url.protocol !== 'https:' ||
      url.hostname !== 'github.com' ||
      !url.pathname.startsWith('/leandervedoy/Mistirgiftit-app-/releases/download/')) {
    throw new Error('Unexpected download asset origin');
  }
  return asset;
}

module.exports = async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const isStatus = req.query && req.query.status === '1';
  try {
    const asset = await getApkAsset();
    if (isStatus) {
      res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=30');
      return res.status(200).json({
        available: Boolean(asset),
        filename: asset ? APK_FILENAME : null,
        bytes: asset ? asset.size : null
      });
    }
    if (!asset) {
      return res.status(404).json({
        error: 'APK_NOT_READY',
        message: 'Android-testappen er ikke publisert ennå.'
      });
    }

    const upstream = await fetch(asset.browser_download_url, {
      headers: {
        'Accept': 'application/octet-stream',
        'User-Agent': 'Vedoy-Studio-MistirGift-APK'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(30000)
    });
    if (!upstream.ok || !upstream.body ||
        (upstream.headers.get('content-type') || '').includes('text/html')) {
      throw new Error('APK asset could not be downloaded');
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="' + APK_FILENAME + '"');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Length', String(asset.size));
    const stream = Readable.fromWeb(upstream.body);
    return await new Promise((resolve) => {
      stream.on('error', () => {
        if (!res.headersSent) res.status(502).end();
        else res.destroy();
        resolve();
      });
      res.on('close', resolve);
      res.on('finish', resolve);
      stream.pipe(res);
    });
  } catch (_error) {
    if (res.headersSent) return res.destroy();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({
      error: 'APK_TEMPORARILY_UNAVAILABLE',
      message: 'Nedlastingen er midlertidig utilgjengelig.'
    });
  }
};
