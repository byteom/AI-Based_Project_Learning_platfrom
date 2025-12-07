import { ImageResponse } from 'next/og';

export const alt = 'Project Code - Learn by Building Real-World Projects';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Background circles */}
        <div
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #9333EA 0%, #EC4899 100%)',
            opacity: 0.2,
            top: '-100px',
            left: '-100px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #9333EA 0%, #EC4899 100%)',
            opacity: 0.15,
            bottom: '-150px',
            right: '-150px',
          }}
        />
        
        {/* Main content */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '60px',
            zIndex: 10,
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '300px',
              height: '300px',
              background: 'linear-gradient(135deg, #9333EA 0%, #EC4899 100%)',
              borderRadius: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '200px',
                height: '200px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: '120px', color: 'white' }}>{'<>'}</div>
            </div>
          </div>
          
          {/* Text */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <h1
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Project Code
            </h1>
            <p
              style={{
                fontSize: '36px',
                color: '#a0a0a0',
                margin: 0,
              }}
            >
              Learn by Building Real-World Projects
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                marginTop: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #9333EA 0%, #EC4899 100%)',
                  }}
                />
                <span style={{ fontSize: '24px', color: '#d0d0d0' }}>
                  AI-Powered Learning Paths
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #9333EA 0%, #EC4899 100%)',
                  }}
                />
                <span style={{ fontSize: '24px', color: '#d0d0d0' }}>
                  Step-by-Step Tutorials
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #9333EA 0%, #EC4899 100%)',
                  }}
                />
                <span style={{ fontSize: '24px', color: '#d0d0d0' }}>
                  30 Days Free Trial
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

