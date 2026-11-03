import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const iconPath = path.join(publicDir, 'icon.png');
const fallbackPwaIcon = path.join(publicDir, 'pwa-512x512.png');

if (!fs.existsSync(iconPath) && fs.existsSync(fallbackPwaIcon)) {
  fs.copyFileSync(fallbackPwaIcon, iconPath);
}

if (fs.existsSync(iconPath)) {
  const webTargets = [
    path.join(publicDir, 'pwa-512x512.png'),
    path.join(publicDir, 'pwa-192x192.png'),
    path.join(publicDir, 'pwa-maskable-512x512.png'),
    path.join(publicDir, 'apple-touch-icon.png'),
  ];

  for (const target of webTargets) {
    if (path.resolve(target) !== path.resolve(iconPath)) {
      fs.copyFileSync(iconPath, target);
    }
  }

  const mipmapDirs = [
    'mipmap-mdpi',
    'mipmap-hdpi',
    'mipmap-xhdpi',
    'mipmap-xxhdpi',
    'mipmap-xxxhdpi',
  ];

  const androidResDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res');
  if (fs.existsSync(androidResDir)) {
    for (const folder of mipmapDirs) {
      const targetDir = path.join(androidResDir, folder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.copyFileSync(iconPath, path.join(targetDir, 'ic_launcher.png'));
      fs.copyFileSync(iconPath, path.join(targetDir, 'ic_launcher_round.png'));
      fs.copyFileSync(iconPath, path.join(targetDir, 'ic_launcher_foreground.png'));
    }
  }

  console.log('✔ Synced public/icon.png across web manifest icons and Android mipmap-* launcher icons.');
}
