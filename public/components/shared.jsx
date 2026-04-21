/* Shared components: logo, golfer silhouette, hexagon radar, etc. */

// ═══════════════════════════════════════════════════════════
//  Brand
// ═══════════════════════════════════════════════════════════
const Logo = ({ size = 20, color = 'currentColor', showText = true }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* golf ball with dimples + tee */}
      <circle cx="10" cy="9" r="7" fill="currentColor" opacity="0.14" />
      <circle cx="10" cy="9" r="7" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="7.5" r="0.7" fill="currentColor" />
      <circle cx="11.5" cy="7" r="0.7" fill="currentColor" />
      <circle cx="9.5" cy="10.5" r="0.7" fill="currentColor" />
      <circle cx="12" cy="10" r="0.7" fill="currentColor" />
      <path d="M10 16 L10 20 M7 22 L13 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {/* AI spark */}
      <path d="M19 5 L19.8 6.6 L21.4 7.4 L19.8 8.2 L19 9.8 L18.2 8.2 L16.6 7.4 L18.2 6.6 Z" fill="#0a8faf"/>
    </svg>
    {showText && (
      <span style={{ fontWeight: 700, letterSpacing: '-0.02em', fontSize: size * 0.88 }}>
        SwingLab<span style={{ color: '#0a8faf' }}>.</span>AI
      </span>
    )}
  </div>
);

// ═══════════════════════════════════════════════════════════
//  Female golfer silhouette — elegant, placeholder-friendly
//  Used inside .hero-photo; label it clearly as a placeholder.
// ═══════════════════════════════════════════════════════════
const GolferSilhouette = ({ style = {} }) => (
  <svg
    viewBox="0 0 400 600"
    preserveAspectRatio="xMidYMax meet"
    style={{ position: 'absolute', right: '-4%', bottom: 0, height: '105%', ...style }}
  >
    <defs>
      <linearGradient id="gf-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0d2110" stopOpacity="0.85"/>
        <stop offset="1" stopColor="#0d2110" stopOpacity="0.95"/>
      </linearGradient>
    </defs>
    {/* Very abstracted silhouette of a woman in mid-backswing. Still a placeholder — actual hero image to replace. */}
    <g fill="url(#gf-body)">
      {/* legs */}
      <path d="M195 420 C 190 460, 188 520, 192 580 L 208 580 C 210 520, 212 470, 215 440 Z" />
      <path d="M215 420 C 225 460, 232 520, 240 580 L 256 580 C 252 520, 248 470, 240 435 Z" />
      {/* skirt */}
      <path d="M178 380 C 175 400, 180 425, 200 432 L 248 432 C 262 425, 265 405, 260 378 Z" />
      {/* torso - twisted */}
      <path d="M188 285 C 182 320, 182 360, 190 390 L 255 390 C 262 360, 260 315, 250 280 C 235 270, 205 272, 188 285 Z" />
      {/* head with ponytail */}
      <ellipse cx="215" cy="258" rx="18" ry="22"/>
      <path d="M228 250 C 242 256, 250 270, 252 290 C 250 294, 244 292, 240 286 C 238 275, 232 264, 228 258 Z" />
      {/* cap visor hint */}
      <path d="M200 248 L 236 248 L 236 252 L 200 252 Z" opacity="0.6"/>
      {/* arms raised (backswing) */}
      <path d="M250 290 C 275 275, 300 240, 310 205 C 304 200, 296 200, 290 210 C 278 240, 260 265, 245 285 Z" />
      <path d="M190 295 C 215 280, 230 250, 240 220 C 234 215, 226 215, 220 225 C 208 255, 195 278, 185 295 Z" />
      {/* club shaft extending out top-right */}
      <rect x="303" y="100" width="3" height="115" fill="#1a1a1a" transform="rotate(-28 305 160)"/>
      {/* club head */}
      <path d="M320 82 L 346 95 L 342 104 L 316 92 Z" fill="#2a2a2a" transform="rotate(-28 330 90)"/>
    </g>
  </svg>
);

// ═══════════════════════════════════════════════════════════
//  Landscape decoration — subtle golf course hills SVG line
// ═══════════════════════════════════════════════════════════
const CourseLines = ({ color = 'currentColor', opacity = 1, style = {} }) => (
  <svg viewBox="0 0 1200 200" preserveAspectRatio="none" style={{ width: '100%', display: 'block', opacity, ...style }}>
    <path d="M0 140 C 200 90, 340 180, 520 130 C 680 90, 820 170, 1000 120 C 1100 95, 1150 110, 1200 100 L 1200 200 L 0 200 Z"
      fill={color} opacity="0.15"/>
    <path d="M0 140 C 200 90, 340 180, 520 130 C 680 90, 820 170, 1000 120 C 1100 95, 1150 110, 1200 100"
      stroke={color} fill="none" strokeWidth="1.2"/>
    <path d="M0 165 C 180 135, 360 195, 560 160 C 720 135, 880 185, 1060 155 C 1140 145, 1180 155, 1200 150"
      stroke={color} fill="none" strokeWidth="1" opacity="0.5"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════
//  Hexagon radar chart — 6 axes
// ═══════════════════════════════════════════════════════════
const HexRadar = ({
  axes = ['어드레스', '백스윙', '탑', '다운스윙', '임팩트', '팔로우스루'],
  values = [82, 76, 68, 71, 88, 74],
  compare,            // optional second array
  size = 320,
  color = '#357132',
  compareColor = '#0a8faf',
  labels = true,
  rings = 4,
  animated = true,
}) => {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.36;
  const n = axes.length;
  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const point = (i, v) => {
    const a = angle(i);
    const rr = (v / 100) * r;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  };
  const polygon = (arr) => arr.map((v, i) => point(i, v).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      {/* concentric hex rings */}
      {Array.from({ length: rings }, (_, k) => {
        const pct = ((k + 1) / rings) * 100;
        return (
          <polygon
            key={k}
            points={polygon(Array(n).fill(pct))}
            fill={k === rings - 1 ? 'rgba(255,255,255,0.6)' : 'none'}
            stroke="#d8dcd5"
            strokeWidth="1"
          />
        );
      })}
      {/* axes */}
      {axes.map((_, i) => {
        const [x, y] = point(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#d8dcd5" strokeWidth="1" />;
      })}
      {/* compare fill */}
      {compare && (
        <polygon
          points={polygon(compare)}
          fill={compareColor}
          fillOpacity="0.08"
          stroke={compareColor}
          strokeWidth="1.4"
          strokeDasharray="4 3"
        />
      )}
      {/* main fill */}
      <polygon
        points={polygon(values)}
        fill={color}
        fillOpacity="0.18"
        stroke={color}
        strokeWidth="2"
        style={animated ? { animation: 'radar-in .9s cubic-bezier(.2,.8,.2,1) both' } : {}}
      />
      {/* vertex dots + value chips */}
      {values.map((v, i) => {
        const [x, y] = point(i, v);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill="#fff" stroke={color} strokeWidth="2" />
          </g>
        );
      })}
      {/* labels */}
      {labels && axes.map((label, i) => {
        const [x, y] = point(i, 122);
        const score = values[i];
        return (
          <g key={label} textAnchor="middle">
            <text x={x} y={y - 4} fill="#3d443d" fontSize={size * 0.04} fontWeight="600" dominantBaseline="middle">
              {label}
            </text>
            <text x={x} y={y + size * 0.045} fill={color} fontSize={size * 0.048} fontWeight="700" dominantBaseline="middle"
              fontFamily="var(--font-mono, monospace)">
              {score}
            </text>
          </g>
        );
      })}
      <style>{`
        @keyframes radar-in {
          from { transform: scale(0.4); transform-origin: center; opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </svg>
  );
};

// ═══════════════════════════════════════════════════════════
//  Score display — big number + grade
// ═══════════════════════════════════════════════════════════
const scoreGrade = (s) => {
  if (s >= 90) return { grade: 'A+', label: '프로 수준', color: '#357132' };
  if (s >= 80) return { grade: 'A',  label: '우수', color: '#4a8a44' };
  if (s >= 70) return { grade: 'B',  label: '양호', color: '#0a8faf' };
  if (s >= 60) return { grade: 'C',  label: '보통', color: '#d19b1a' };
  return { grade: 'D', label: '개선 필요', color: '#c0453a' };
};

const BigScore = ({ score = 77, sub = true }) => {
  const { grade, label, color } = scoreGrade(score);
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 72, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--ink-900)' }}>
        {score}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{grade}</div>
        {sub && <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 4 }}>{label}</div>}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  Video frame placeholder — shows an overlaid pose skeleton
// ═══════════════════════════════════════════════════════════
const SwingFrame = ({ label = '임팩트', showPose = true, style = {} }) => (
  <div style={{
    position: 'relative', aspectRatio: '9/16', width: '100%',
    borderRadius: 'var(--r-md)', overflow: 'hidden',
    background: 'linear-gradient(170deg, #1f441f 0%, #357132 40%, #6ea666 100%)',
    ...style
  }}>
    {/* course hint */}
    <div style={{ position: 'absolute', inset: 0,
      backgroundImage:
        'repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 12px)',
      mixBlendMode: 'screen'
    }}/>
    {/* golfer simplified silhouette in frame center */}
    <svg viewBox="0 0 200 360" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <g fill="rgba(10,20,10,0.85)">
        <ellipse cx="100" cy="110" rx="12" ry="14"/>
        <path d="M84 130 Q100 125 116 130 L 118 180 L 82 180 Z"/>
        <path d="M82 180 L 118 180 L 124 230 L 76 230 Z"/>
        <path d="M84 230 L 96 310 L 104 310 L 98 230 Z"/>
        <path d="M104 230 L 118 310 L 110 310 L 100 230 Z"/>
        <path d="M115 145 Q 155 125 165 95" stroke="rgba(10,20,10,0.85)" strokeWidth="6" fill="none" strokeLinecap="round"/>
        <path d="M85 145 Q 55 135 50 115" stroke="rgba(10,20,10,0.85)" strokeWidth="6" fill="none" strokeLinecap="round"/>
      </g>
      {showPose && (
        <g stroke="#0a8faf" strokeWidth="1.5" fill="none" opacity="0.95">
          {/* pose skeleton dots */}
          <circle cx="100" cy="110" r="3" fill="#0a8faf"/>
          <line x1="100" y1="110" x2="100" y2="180"/>
          <circle cx="100" cy="180" r="3" fill="#0a8faf"/>
          <line x1="100" y1="180" x2="80" y2="230"/>
          <line x1="100" y1="180" x2="118" y2="230"/>
          <circle cx="80" cy="230" r="3" fill="#0a8faf"/>
          <circle cx="118" cy="230" r="3" fill="#0a8faf"/>
          <line x1="80" y1="230" x2="92" y2="310"/>
          <line x1="118" y1="230" x2="112" y2="310"/>
          <line x1="100" y1="130" x2="155" y2="95"/>
          <line x1="100" y1="130" x2="50" y2="115"/>
          <circle cx="155" cy="95" r="3" fill="#0a8faf"/>
          <circle cx="50" cy="115" r="3" fill="#0a8faf"/>
          {/* swing arc */}
          <path d="M 30 120 Q 100 30 170 110" strokeDasharray="3 4" opacity="0.8"/>
        </g>
      )}
    </svg>
    {/* label */}
    <div style={{ position: 'absolute', left: 10, top: 10, display: 'flex', gap: 6 }}>
      <span className="chip dot" style={{ background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', backdropFilter: 'blur(6px)' }}>
        {label}
      </span>
    </div>
    <div style={{ position: 'absolute', right: 10, bottom: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.4)', padding: '3px 7px', borderRadius: 4 }}>
      00:00:{String(Math.floor(Math.random()*60)).padStart(2,'0')}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════
//  Photo placeholder block — striped with mono explainer
// ═══════════════════════════════════════════════════════════
const PhotoPlaceholder = ({ aspect = '16/9', note = 'photo', style = {}, children }) => (
  <div style={{
    aspectRatio: aspect,
    background:
      'repeating-linear-gradient(135deg, #e4efe2 0 10px, #d6e7d3 10px 20px)',
    borderRadius: 'var(--r-md)',
    position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#4a6548',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    letterSpacing: '0.04em',
    overflow: 'hidden',
    ...style,
  }}>
    {children || <span>[ {note} ]</span>}
  </div>
);

Object.assign(window, {
  Logo, GolferSilhouette, CourseLines, HexRadar, BigScore, SwingFrame,
  PhotoPlaceholder, scoreGrade,
});
