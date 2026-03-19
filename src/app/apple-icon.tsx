import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img src="https://i.imgur.com/SLxSDoD.png" alt="Logo Apple" style={{ width: '100%', height: '100%' }} />
      </div>
    ),
    { ...size }
  )
}
