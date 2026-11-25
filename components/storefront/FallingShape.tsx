import type { FallingShapeKind } from '@/lib/falling';

const HIGHLIGHT = 'rgba(255,255,255,0.45)';

/** Hình SVG cho hiệu ứng rơi (viewBox 24×24, tự co giãn theo khung chứa). */
export default function FallingShape({ shape, color }: { shape: FallingShapeKind; color: string }) {
  const fill = { fill: color };
  const stroke = { stroke: color };

  let body: React.ReactNode;
  switch (shape) {
    case 'petal':
      body = (
        <>
          <path style={fill} d="M12 4.2 10.4 1.9C6.6 5.2 5 10.7 6.8 15.8 8 19.2 10.4 21.6 12 22.3c1.6-.7 4-3.1 5.2-6.5 1.8-5.1.2-10.6-3.6-13.9z" />
          <path d="M11.6 7.5c-1.2 3-1.4 6.6-.4 10" fill="none" stroke={HIGHLIGHT} strokeWidth="1.1" strokeLinecap="round" />
        </>
      );
      break;
    case 'blossom':
      body = (
        <>
          <g style={fill}>
            {[0, 72, 144, 216, 288].map((deg) => (
              <ellipse key={deg} cx="12" cy="6.6" rx="3.9" ry="5.2" transform={`rotate(${deg} 12 12)`} />
            ))}
          </g>
          <circle cx="12" cy="12" r="2.6" fill="#FFF3C4" />
          <circle cx="12" cy="12" r="1.2" fill="#E8A93A" />
        </>
      );
      break;
    case 'sparkle':
      body = (
        <>
          <path style={fill} d="M12 1c.7 5.4 3.6 9.3 10 11-6.4 1.7-9.3 5.6-10 11-.7-5.4-3.6-9.3-10-11C8.4 10.3 11.3 6.4 12 1z" />
          <circle cx="12" cy="12" r="1.6" fill="rgba(255,255,255,0.7)" />
        </>
      );
      break;
    case 'heart':
      body = (
        <>
          <path style={fill} d="M12 21.2s-8.1-4.9-9.9-10C.9 7.6 3.2 3.8 6.9 3.8c2.2 0 3.9 1.2 5.1 3 1.2-1.8 2.9-3 5.1-3 3.7 0 6 3.8 4.8 7.4-1.8 5.1-9.9 10-9.9 10z" />
          <path d="M6.2 7.4c-.9.6-1.4 1.6-1.3 2.8" fill="none" stroke={HIGHLIGHT} strokeWidth="1.4" strokeLinecap="round" />
        </>
      );
      break;
    case 'star':
      body = (
        <path
          style={{ ...fill, ...stroke }}
          strokeWidth="1.6"
          strokeLinejoin="round"
          d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.2 6.1L12 16.6l-5.5 2.9 1.2-6.1-4.5-4.2 6.1-.8z"
        />
      );
      break;
    case 'snowflake':
      body = (
        <g style={stroke} fill="none" strokeWidth="1.6" strokeLinecap="round">
          {[0, 60, 120].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 12 12)`}>
              <path d="M12 2v20" />
              <path d="M9.4 4.6 12 7.2l2.6-2.6M9.4 19.4 12 16.8l2.6 2.6" />
            </g>
          ))}
        </g>
      );
      break;
    case 'leaf':
      body = (
        <>
          <path style={fill} d="M4 20.5C3.6 11 9.4 4 20.5 3.5 21 14.6 14 20.4 4 20.5z" />
          <path d="M5.5 19 17 7.5M10 14.6l-.4-3.4M13.2 11.4l3 .2" fill="none" stroke={HIGHLIGHT} strokeWidth="1.1" strokeLinecap="round" />
        </>
      );
      break;
    case 'bubble':
      body = (
        <>
          <circle cx="12" cy="12" r="9.5" style={{ ...stroke, fill: color, fillOpacity: 0.18 }} strokeWidth="1.4" />
          <path d="M7.4 9.2a5.2 5.2 0 0 1 3.6-3" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinecap="round" />
        </>
      );
      break;
    case 'bow':
      body = (
        <>
          <path style={fill} d="M12 11.2C9.4 7.6 3.2 5.3 2.6 9.4c-.5 3.5 2.4 6.3 9.4 3.3 7 3 9.9.2 9.4-3.3-.6-4.1-6.8-1.8-9.4 1.8z" />
          <path style={fill} d="m10.6 13-2.5 6.6 2.4-.9 1.5 1.9 1.5-1.9 2.4.9-2.5-6.6z" opacity="0.85" />
          <circle cx="12" cy="11.9" r="1.9" style={fill} />
          <circle cx="11.5" cy="11.4" r="0.7" fill={HIGHLIGHT} />
        </>
      );
      break;
    case 'lantern':
      body = (
        <>
          <path d="M12 1v2.4" stroke="#B8860B" strokeWidth="1.2" />
          <rect x="8.6" y="3.2" width="6.8" height="2" rx="0.8" fill="#E0A82E" />
          <ellipse cx="12" cy="11.6" rx="7" ry="6.6" style={fill} />
          <path d="M12 5.2v12.8M8.6 6.2c-1.6 3.4-1.6 7.4 0 10.8M15.4 6.2c1.6 3.4 1.6 7.4 0 10.8" fill="none" stroke="rgba(255,230,160,0.55)" strokeWidth="0.9" />
          <rect x="8.6" y="17.6" width="6.8" height="1.8" rx="0.7" fill="#E0A82E" />
          <path d="M12 19.4v3.4" stroke="#E0A82E" strokeWidth="1.4" strokeLinecap="round" />
        </>
      );
      break;
    case 'moon':
      body = (
        <>
          <path style={fill} d="M15.5 2.6A9.6 9.6 0 1 0 21.4 16 8 8 0 0 1 15.5 2.6z" />
          <circle cx="9" cy="10" r="1.3" fill="rgba(0,0,0,0.08)" />
          <circle cx="11.5" cy="16" r="1.8" fill="rgba(0,0,0,0.07)" />
        </>
      );
      break;
    case 'pumpkin':
      body = (
        <>
          <path d="M12 6.2c0-2 .8-3.4 2.4-4" fill="none" stroke="#4D7C0F" strokeWidth="1.8" strokeLinecap="round" />
          <ellipse cx="8.2" cy="13.8" rx="5.2" ry="7" style={fill} />
          <ellipse cx="15.8" cy="13.8" rx="5.2" ry="7" style={fill} />
          <ellipse cx="12" cy="13.8" rx="4.4" ry="7.3" style={fill} />
          <path d="M12 7.2v13" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
          <path d="M6.6 9.6c-1 1.4-1.3 3.2-1 5" fill="none" stroke={HIGHLIGHT} strokeWidth="1.1" strokeLinecap="round" />
        </>
      );
      break;
    case 'bat':
      body = (
        <path
          style={fill}
          d="M12 9.4c.7-1.3 1.6-1.9 2.4-1.8-.3 1.4.4 2.3 1.6 2.4 1.5-1.7 4-2.2 6.5-1.3-1.2.9-1.8 2.2-1.6 3.6-1.3-.6-2.6-.3-3.3 1-.9-.9-2.3-.8-3.2.3-.8.3-1.6 1-2.4 2.2-.8-1.2-1.6-1.9-2.4-2.2-.9-1.1-2.3-1.2-3.2-.3-.7-1.3-2-1.6-3.3-1 .2-1.4-.4-2.7-1.6-3.6 2.5-.9 5-.4 6.5 1.3 1.2-.1 1.9-1 1.6-2.4.8-.1 1.7.5 2.4 1.8z"
        />
      );
      break;
    case 'confetti':
      body = <rect x="8.5" y="3" width="7" height="18" rx="2.2" style={fill} />;
      break;
    case 'dot':
    default:
      body = (
        <>
          <circle cx="12" cy="12" r="7" style={{ ...fill, fillOpacity: 0.35 }} />
          <circle cx="12" cy="12" r="4.2" style={fill} />
        </>
      );
  }

  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true" focusable="false" style={{ display: 'block', overflow: 'visible' }}>
      {body}
    </svg>
  );
}
