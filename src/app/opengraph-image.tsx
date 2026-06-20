import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const alt = 'Frontend Coach — Master Your Frontend Interview with AI';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const ogData = fs.readFileSync(
    path.join(process.cwd(), 'public/brand/frontend-coach-og-v3.png')
  );
  const ogSrc = `data:image/png;base64,${ogData.toString('base64')}`;

  return new ImageResponse(
    (
      <img
        src={ogSrc}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    ),
    { width: 1200, height: 630 },
  );
}
