/* ═══════════════════════════════════════════════════════════
   SwingLab.AI — 소개 애니메이션 씬들
   믹스 톤: 페어웨이 그린 자연 + 미니멀 테크 UI 오버레이
   스토리 (40s):
     0-5   SC1: 골프장 풀샷 + 여자 골퍼 스윙
     5-10  SC2: 영상 업로드 (핸드폰)
     10-18 SC3: AI 분석 — 관절 트래킹 스캔
     18-27 SC4: 육각형 레이더 차트 드로잉 + 점수
     27-34 SC5: 원포인트 레슨 카드
     34-40 SC6: 개선 후 스윙 + 브랜드 아웃트로
   ═══════════════════════════════════════════════════════════ */

const V_GREEN_DK = '#1f441f';
const V_GREEN    = '#285a27';
const V_GREEN_LT = '#4a8a44';
const V_IVORY    = '#faf8f1';
const V_CYAN     = '#0a8faf';
const V_INK      = '#0f1a10';

// timeline keyframes helper
const kf = (pairs, time, ease = Easing.easeInOutCubic) => {
  const keys = pairs.map(p => p[0]);
  const vals = pairs.map(p => p[1]);
  return interpolate(keys, vals, ease)(time);
};

// ═══════════════════════════════════════════════════════════
// Reusable: full-bleed fairway background
// ═══════════════════════════════════════════════════════════
const FairwayBG = ({ zoom = 1, pan = 0 }) => (
  <div style={{
    position: 'absolute', inset: 0,
    transform: `scale(${zoom}) translateX(${pan}px)`,
    transformOrigin: 'center',
    background:
      'radial-gradient(ellipse at 50% 15%, rgba(255,245,210,0.45), transparent 55%),' +
      'radial-gradient(ellipse at 80% 95%, rgba(15,50,20,0.6), transparent 60%),' +
      'linear-gradient(180deg, #8ec084 0%, #5b9158 28%, #2f6b30 55%, #1a3f1c 90%)',
  }}>
    {/* distant tree line */}
    <svg viewBox="0 0 1920 200" preserveAspectRatio="none" style={{ position:'absolute', top: '38%', width:'100%', height: 120, opacity: 0.7 }}>
      <path d="M0 100 C 150 50, 300 90, 450 60 C 600 30, 750 80, 900 55 C 1100 25, 1300 85, 1500 50 C 1700 25, 1800 70, 1920 60 L 1920 200 L 0 200 Z" fill="#0f2a12"/>
    </svg>
    {/* grass texture */}
    <div style={{
      position:'absolute', inset: 0,
      backgroundImage:
        'repeating-linear-gradient(95deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 16px),' +
        'repeating-linear-gradient(175deg, rgba(0,0,0,0.05) 0 1px, transparent 1px 22px)',
      opacity: 0.6,
    }}/>
    {/* fairway contour */}
    <svg viewBox="0 0 1920 1080" preserveAspectRatio="none" style={{ position:'absolute', inset: 0, width:'100%', height:'100%' }}>
      <path d="M 960 540 L 760 1080 L 1160 1080 Z" fill="rgba(150,195,130,0.25)"/>
      <path d="M 960 540 L 820 1080 L 1100 1080 Z" fill="rgba(170,210,145,0.18)"/>
    </svg>
    {/* golf ball on tee, mid-distance */}
    <div style={{ position:'absolute', left: '50%', top: '72%', transform:'translate(-50%,-50%)' }}>
      <svg width="20" height="30" viewBox="0 0 20 30">
        <circle cx="10" cy="10" r="7" fill="#fff"/>
        <circle cx="8" cy="9" r="0.7" fill="#d8dcd5"/>
        <circle cx="11" cy="8" r="0.7" fill="#d8dcd5"/>
        <circle cx="9" cy="11.5" r="0.7" fill="#d8dcd5"/>
        <path d="M10 17 L10 26 M6 29 L14 29" stroke="#3a3530" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    </div>
  </div>
);

// Golfer SVG (reuse shared one but callable as scene actor)
const SceneGolfer = ({ x = 0, y = 0, scale = 1, rotation = 0, opacity = 1 }) => (
  <div style={{ position:'absolute', left:`${x}%`, top:`${y}%`, transform: `translate(-50%,-100%) scale(${scale}) rotate(${rotation}deg)`, transformOrigin: 'center bottom', opacity, transition: 'transform 0.05s linear' }}>
    <svg viewBox="0 0 400 600" width="400" height="600">
      <defs>
        <linearGradient id="v-golfer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f1a10" stopOpacity="0.92"/>
          <stop offset="1" stopColor="#0d2110" stopOpacity="1"/>
        </linearGradient>
      </defs>
      <g fill="url(#v-golfer)">
        <path d="M195 420 C 190 460, 188 520, 192 580 L 208 580 C 210 520, 212 470, 215 440 Z"/>
        <path d="M215 420 C 225 460, 232 520, 240 580 L 256 580 C 252 520, 248 470, 240 435 Z"/>
        <path d="M178 380 C 175 400, 180 425, 200 432 L 248 432 C 262 425, 265 405, 260 378 Z"/>
        <path d="M188 285 C 182 320, 182 360, 190 390 L 255 390 C 262 360, 260 315, 250 280 C 235 270, 205 272, 188 285 Z"/>
        <ellipse cx="215" cy="258" rx="18" ry="22"/>
        <path d="M228 250 C 242 256, 250 270, 252 290 C 250 294, 244 292, 240 286 C 238 275, 232 264, 228 258 Z"/>
        <path d="M200 248 L 236 248 L 236 252 L 200 252 Z" opacity="0.6"/>
        <path d="M250 290 C 275 275, 300 240, 310 205 C 304 200, 296 200, 290 210 C 278 240, 260 265, 245 285 Z"/>
        <path d="M190 295 C 215 280, 230 250, 240 220 C 234 215, 226 215, 220 225 C 208 255, 195 278, 185 295 Z"/>
      </g>
      {/* club */}
      <g>
        <rect x="303" y="100" width="3" height="115" fill="#1a1a1a" transform="rotate(-28 305 160)"/>
        <path d="M320 82 L 346 95 L 342 104 L 316 92 Z" fill="#2a2a2a" transform="rotate(-28 330 90)"/>
      </g>
    </svg>
  </div>
);

const Mono = ({ children, size = 14, color = '#fff', style = {} }) => (
  <div style={{ fontFamily: 'var(--font-mono, JetBrains Mono, monospace)', fontSize: size, letterSpacing: '0.12em', textTransform: 'uppercase', color, ...style }}>
    {children}
  </div>
);

const Tick = ({ color = '#fff', style = {} }) => (
  <div style={{ width: 40, height: 1, background: color, ...style }}/>
);

// ═══════════════════════════════════════════════════════════
// SCENE 1 — 골프장 & 골퍼 스윙 (0 - 5s)
// ═══════════════════════════════════════════════════════════
const Scene1 = () => {
  const { localTime, progress } = useSprite();
  const zoom = kf([[0,1.15],[1,1.08],[1,1.02]], progress, Easing.easeOutCubic);
  // golfer swing: address → back → impact → follow, by t
  const swingAngle = kf([[0,0],[0.4,-55],[0.65,40],[0.85,55],[1,55]], progress);
  const golferScale = kf([[0,0.95],[1,1.0]], progress);

  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
      <FairwayBG zoom={zoom}/>
      {/* sun glow */}
      <div style={{ position:'absolute', top:'12%', left:'72%', width: 180, height: 180, borderRadius:'50%',
        background: 'radial-gradient(circle, rgba(255,240,190,0.6), transparent 70%)', filter:'blur(20px)' }}/>

      {/* golfer */}
      <div style={{ position:'absolute', inset: 0 }}>
        <SceneGolfer x={48} y={85} scale={golferScale * 0.9} rotation={0} />
        {/* club rotating independently */}
        <div style={{ position:'absolute', left:'48%', top:'52%', transform:`translate(-50%,-100%) rotate(${swingAngle}deg)`, transformOrigin: 'bottom center' }}>
          <div style={{ width: 4, height: 160, background: '#111', borderRadius: 2 }}/>
          <div style={{ position:'absolute', bottom: 150, left: -8, width: 30, height: 12, background: '#333', borderRadius: 2 }}/>
        </div>
      </div>

      {/* TITLE */}
      <Sprite start={0.3} end={4.5}>
        {({ localTime: lt, duration: d }) => {
          const entry = Easing.easeOutCubic(clamp(lt / 0.7, 0, 1));
          const exit = Easing.easeInCubic(clamp((lt - (d - 0.5)) / 0.5, 0, 1));
          const op = entry * (1 - exit);
          return (
            <div style={{ position:'absolute', left: 80, top: 120, opacity: op, transform: `translateY(${(1-entry)*20}px)` }}>
              <Mono size={13} color="rgba(255,255,255,0.75)">A NEW WAY TO LEARN GOLF · EST. 2026</Mono>
              <Tick color="rgba(255,255,255,0.5)" style={{ margin: '20px 0' }}/>
              <div style={{ fontFamily:'var(--font-sans)', fontSize: 92, fontWeight: 700, color: '#fff', letterSpacing:'-0.04em', lineHeight: 1.02 }}>
                당신의 스윙을<br/>
                <span style={{ color: '#c7dec3' }}>코치보다 자세히.</span>
              </div>
            </div>
          );
        }}
      </Sprite>

      {/* HERO placeholder note */}
      <div style={{ position:'absolute', right: 40, top: 40, display:'flex', alignItems:'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'pulse 1.4s infinite' }}/>
        <Mono size={11} color="rgba(255,255,255,0.7)">[ HERO · 여자 골퍼 / 골프장 ]</Mono>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// SCENE 2 — Upload (5 - 10s)
// ═══════════════════════════════════════════════════════════
const Scene2 = () => {
  const { localTime, progress } = useSprite();
  const phoneRise = kf([[0, 180], [0.5, 0]], progress, Easing.easeOutBack);
  const uploadProgress = clamp((localTime - 2) / 2.5, 0, 1);

  return (
    <div style={{ position:'absolute', inset: 0, background: V_IVORY, overflow:'hidden' }}>
      {/* subtle grid */}
      <div style={{ position:'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(15,26,16,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,26,16,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px' }}/>

      {/* left text */}
      <div style={{ position:'absolute', left: 100, top: 180 }}>
        <Mono size={13} color={V_CYAN}>§ STEP 01</Mono>
        <Tick color={V_INK} style={{ margin: '24px 0' }}/>
        <div style={{ fontFamily:'var(--font-sans)', fontSize: 72, fontWeight: 600, color: V_INK, letterSpacing:'-0.03em', lineHeight: 1.08 }}>
          영상을 올리세요.
        </div>
        <div style={{ marginTop: 24, fontSize: 22, color: '#3d443d', lineHeight: 1.5, maxWidth: 520 }}>
          측면에서 찍은 스윙 6초면 충분합니다. 드라이버부터 퍼터까지 모두 지원해요.
        </div>
      </div>

      {/* phone mock */}
      <div style={{ position:'absolute', right: 180, top: 120, transform: `translateY(${phoneRise}px)` }}>
        <div style={{ width: 340, height: 680, borderRadius: 42, background: V_INK, padding: 12, boxShadow: '0 40px 100px rgba(0,0,0,0.3), 0 10px 30px rgba(0,0,0,0.15)' }}>
          <div style={{ width:'100%', height:'100%', borderRadius: 32, background: '#fff', overflow:'hidden', position:'relative' }}>
            <div style={{ padding: '30px 18px 14px', borderBottom: `1px solid #eae9e3`, fontSize: 13, fontFamily:'var(--font-mono)', color:'#6c7569', display:'flex', justifyContent:'space-between' }}>
              <span>UPLOAD</span><span>01/03</span>
            </div>
            {/* dropzone */}
            <div style={{ margin: 16, border: `2px dashed ${V_GREEN_LT}`, borderRadius: 16, aspectRatio: '4/5', position:'relative', overflow:'hidden',
              background: 'repeating-linear-gradient(45deg, #f2f7f1 0 8px, #fff 8px 16px)' }}>
              {/* golfer silhouette in frame */}
              <div style={{ position:'absolute', inset: 0, display: 'flex', alignItems:'flex-end', justifyContent:'center' }}>
                <svg viewBox="0 0 200 360" width="200" style={{ opacity: 0.85 }}>
                  <g fill="#1a2a1a">
                    <ellipse cx="100" cy="110" rx="14" ry="16"/>
                    <path d="M84 130 Q100 125 116 130 L 120 200 L 80 200 Z"/>
                    <path d="M80 200 L 120 200 L 128 260 L 72 260 Z"/>
                    <path d="M80 260 L 92 340 L 104 340 L 96 260 Z"/>
                    <path d="M104 260 L 122 340 L 112 340 L 100 260 Z"/>
                  </g>
                </svg>
              </div>
              {/* upload overlay */}
              <div style={{ position:'absolute', inset: 0, background: `rgba(40, 90, 39, ${0.1 + uploadProgress * 0.4})`, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap: 10 }}>
                <div style={{ width: 64, height: 64, borderRadius:'50%', background: V_GREEN, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', boxShadow:'0 8px 24px rgba(40,90,39,0.4)' }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 18V6M8 12l6-6 6 6"/></svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color:'#fff' }}>swing_0421.mp4</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize: 11, color:'rgba(255,255,255,0.9)' }}>
                  {Math.round(uploadProgress * 100)}% · 6.4 MB
                </div>
              </div>
              {/* progress bar */}
              <div style={{ position:'absolute', left: 16, right: 16, bottom: 16, height: 4, background:'rgba(255,255,255,0.3)', borderRadius: 2 }}>
                <div style={{ height:'100%', width: `${uploadProgress*100}%`, background:'#fff', borderRadius: 2 }}/>
              </div>
            </div>
            <div style={{ padding: '8px 16px', fontFamily:'var(--font-mono)', fontSize: 10, color:'#6c7569' }}>MP4 · 6s · DTL</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// SCENE 3 — AI Analysis (10 - 18s)
// ═══════════════════════════════════════════════════════════
const Scene3 = () => {
  const { localTime, progress } = useSprite();
  const scanY = kf([[0, 100], [1, 900]], progress);
  const pointOp = clamp((localTime - 1) / 0.5, 0, 1);

  // fake log lines, revealed over time
  const logs = [
    { t: 0.5, line: '▸ init pose_model_v3.2', s: 'OK' },
    { t: 1.2, line: '▸ extract 144 frames', s: 'OK' },
    { t: 2.0, line: '▸ detect 32 keypoints', s: 'OK' },
    { t: 3.0, line: '▸ segment 6 phases', s: 'OK' },
    { t: 4.5, line: '▸ compute biomechanics', s: 'OK' },
    { t: 5.8, line: '▸ match pro reference · 12,000 swings', s: 'OK' },
    { t: 6.8, line: '▸ generate report', s: '...' },
  ];

  // keypoints positions on golfer
  const keypoints = [
    [48, 42], [48, 50], [44, 55], [52, 55], [42, 63], [54, 63],
    [48, 65], [44, 75], [52, 75], [44, 85], [52, 85],
    [55, 40], [62, 36], [40, 40], [33, 38],
  ];

  return (
    <div style={{ position:'absolute', inset: 0, background: V_INK, overflow:'hidden' }}>
      {/* left: golfer frame */}
      <div style={{ position:'absolute', left: 80, top: 80, bottom: 80, width: 720,
        border: `2px solid ${V_CYAN}`, overflow:'hidden',
        background: 'linear-gradient(170deg, #1f441f 0%, #357132 40%, #6ea666 100%)' }}>
        {/* grid */}
        <div style={{ position:'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(10,143,175,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(10,143,175,0.15) 1px, transparent 1px)',
          backgroundSize: '60px 60px' }}/>
        {/* corner brackets */}
        {[0,1,2,3].map(i => (
          <div key={i} style={{ position:'absolute', width: 30, height: 30, border:`3px solid ${V_CYAN}`,
            ...({0:{top:10,left:10,borderRight:'none',borderBottom:'none'},1:{top:10,right:10,borderLeft:'none',borderBottom:'none'},2:{bottom:10,left:10,borderRight:'none',borderTop:'none'},3:{bottom:10,right:10,borderLeft:'none',borderTop:'none'}}[i])
          }}/>
        ))}

        {/* scan line */}
        <div style={{ position:'absolute', left: 0, right: 0, top: scanY, height: 3, background: V_CYAN, boxShadow: `0 0 24px 4px ${V_CYAN}`, zIndex: 5 }}/>
        <div style={{ position:'absolute', left: 0, right: 0, top: 0, height: scanY, background: 'linear-gradient(to bottom, transparent, rgba(10,143,175,0.08))', zIndex: 3 }}/>

        {/* golfer large silhouette */}
        <div style={{ position:'absolute', inset: 0 }}>
          <SceneGolfer x={48} y={95} scale={1.6}/>
        </div>

        {/* keypoints */}
        {keypoints.map(([x, y], i) => (
          <div key={i} style={{
            position:'absolute', left:`${x}%`, top:`${y}%`, transform:'translate(-50%,-50%)',
            width: 12, height: 12, borderRadius:'50%',
            background: V_CYAN, boxShadow: `0 0 12px ${V_CYAN}`,
            opacity: clamp((localTime - 1.5 - i * 0.08) / 0.3, 0, 1) * pointOp,
          }}>
            <div style={{ position:'absolute', inset:-4, border: `1px solid ${V_CYAN}`, borderRadius:'50%', opacity: 0.6 }}/>
          </div>
        ))}

        {/* connecting lines (simplified skeleton) */}
        <svg viewBox="0 0 720 920" style={{ position:'absolute', inset: 0, width:'100%', height:'100%', opacity: clamp((localTime-2.5)/1, 0, 1) }}>
          <g stroke={V_CYAN} strokeWidth="2" fill="none" opacity="0.8">
            <line x1="346" y1="386" x2="346" y2="460"/>
            <line x1="346" y1="460" x2="317" y2="506"/>
            <line x1="346" y1="460" x2="374" y2="506"/>
            <line x1="317" y1="506" x2="303" y2="579"/>
            <line x1="374" y1="506" x2="389" y2="579"/>
            <line x1="346" y1="460" x2="303" y2="690"/>
            <line x1="346" y1="460" x2="374" y2="690"/>
          </g>
        </svg>

        {/* frame counter */}
        <div style={{ position:'absolute', bottom: 16, left: 16, display:'flex', gap: 12 }}>
          <Mono size={11} color={V_CYAN}>FRAME {Math.floor(progress * 144)} / 144</Mono>
          <Mono size={11} color="rgba(255,255,255,0.6)">DTL · 1080p</Mono>
        </div>
      </div>

      {/* right: log panel */}
      <div style={{ position:'absolute', right: 80, top: 100, width: 580 }}>
        <Mono size={13} color={V_CYAN}>§ SCENE 03 · AI ANALYSIS</Mono>
        <div style={{ fontFamily:'var(--font-sans)', fontSize: 64, fontWeight: 600, color: '#fff', letterSpacing:'-0.03em', lineHeight: 1.05, margin: '20px 0 10px' }}>
          32개의 관절을<br/>실시간 추적.
        </div>
        <div style={{ fontSize: 20, color:'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: 32 }}>
          프로 12,000 스윙 데이터베이스와 비교합니다.
        </div>

        {/* log lines */}
        <div style={{ fontFamily:'var(--font-mono)', fontSize: 15, color:'rgba(255,255,255,0.8)', lineHeight: 2, background: 'rgba(255,255,255,0.04)', padding: '20px 24px', borderLeft: `2px solid ${V_CYAN}` }}>
          {logs.map((L, i) => {
            if (localTime < L.t) return null;
            return (
              <div key={i} style={{ display:'flex', justifyContent:'space-between' }}>
                <span>{L.line}</span>
                <span style={{ color: L.s === 'OK' ? V_GREEN_LT : V_CYAN }}>[{L.s}]</span>
              </div>
            );
          })}
          {localTime > 6.8 && <div style={{ display: 'inline-block', width: 10, height: 18, background: V_CYAN, animation: 'blink 0.8s steps(2) infinite', verticalAlign:'middle' }}/>}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// SCENE 4 — Hex Radar + Scores (18 - 27s)
// ═══════════════════════════════════════════════════════════
const Scene4 = () => {
  const { localTime, progress } = useSprite();
  const hexAppear = clamp(localTime / 1, 0, 1);
  const scoreCount = Math.floor(kf([[0.5, 0], [3, 77]], localTime, Easing.easeOutCubic));

  const axes = ['어드레스', '백스윙', '탑', '다운스윙', '임팩트', '팔로우스루'];
  const values = [82, 76, 68, 71, 88, 74];

  const size = 560;
  const cx = size/2, cy = size/2, R = size*0.36;
  const angle = (i) => -Math.PI/2 + (i * 2 * Math.PI)/6;
  const pt = (i, v) => [cx + (v/100)*R * Math.cos(angle(i)), cy + (v/100)*R * Math.sin(angle(i))];

  // animate polygon draw: each vertex fades in by t
  const vertexT = (i) => clamp((localTime - 1 - i * 0.25) / 0.6, 0, 1);

  return (
    <div style={{ position:'absolute', inset: 0, background: V_IVORY, overflow:'hidden' }}>
      {/* subtle fairway texture top */}
      <div style={{ position:'absolute', left: 0, right: 0, top: 0, height: 120,
        background: 'linear-gradient(180deg, rgba(40,90,39,0.12), transparent)' }}/>
      <div style={{ position:'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(15,26,16,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15,26,16,0.03) 1px, transparent 1px)',
        backgroundSize: '48px 48px' }}/>

      {/* left — big score */}
      <div style={{ position:'absolute', left: 100, top: 140 }}>
        <Mono size={13} color={V_GREEN}>§ YOUR SCORE · 2026.04.21</Mono>
        <Tick color={V_INK} style={{ margin: '20px 0' }}/>
        <div style={{ display:'flex', alignItems:'flex-end', gap: 24 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize: 240, fontWeight: 700, letterSpacing:'-0.06em', lineHeight: 0.85, color: V_INK }}>
            {scoreCount}
          </div>
          <div style={{ paddingBottom: 20 }}>
            <div style={{ fontSize: 28, color:'#6c7569' }}>/ 100</div>
            <div style={{ fontSize: 44, fontWeight: 700, color: V_GREEN, marginTop: 8, opacity: localTime > 3.2 ? 1 : 0, transition:'opacity .4s' }}>B</div>
          </div>
        </div>
        <div style={{ fontSize: 20, color:'#3d443d', marginTop: 16, opacity: localTime > 3.5 ? 1 : 0, transition:'opacity .5s' }}>
          지난 달 대비 <b style={{ color: V_GREEN }}>+4.2</b> · 양호 등급
        </div>
      </div>

      {/* center — hex radar */}
      <div style={{ position:'absolute', right: 80, top: 100 }}>
        <svg width={size} height={size+80} style={{ overflow:'visible' }}>
          {/* concentric hex rings */}
          {[25, 50, 75, 100].map((pct, i) => {
            const pts = Array(6).fill(0).map((_, j) => pt(j, pct).join(',')).join(' ');
            return <polygon key={i} points={pts} fill={i===3?'rgba(255,255,255,0.7)':'none'} stroke="#d8dcd5" strokeWidth="1" opacity={hexAppear}/>;
          })}
          {/* axes */}
          {Array(6).fill(0).map((_, i) => {
            const [x,y] = pt(i, 100);
            return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#d8dcd5" strokeWidth="1" opacity={hexAppear}/>;
          })}
          {/* animated polygon */}
          <polygon
            points={values.map((v, i) => pt(i, v * vertexT(i)).join(',')).join(' ')}
            fill={V_GREEN} fillOpacity="0.22"
            stroke={V_GREEN} strokeWidth="3"
          />
          {/* vertex dots */}
          {values.map((v, i) => {
            const [x, y] = pt(i, v * vertexT(i));
            return <circle key={i} cx={x} cy={y} r={vertexT(i) > 0.3 ? 7 : 0} fill="#fff" stroke={V_GREEN} strokeWidth="3"/>;
          })}
          {/* labels */}
          {axes.map((l, i) => {
            const [x, y] = pt(i, 122);
            const op = clamp((localTime - 1.2 - i*0.2) / 0.4, 0, 1);
            return (
              <g key={l} textAnchor="middle" opacity={op}>
                <text x={x} y={y-2} fill={V_INK} fontSize="18" fontWeight="700" style={{ fontFamily:'var(--font-sans)' }}>{l}</text>
                <text x={x} y={y+22} fill={V_GREEN} fontSize="22" fontWeight="700" style={{ fontFamily:'var(--font-mono)' }}>{values[i]}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// SCENE 5 — One-point lesson (27 - 34s)
// ═══════════════════════════════════════════════════════════
const Scene5 = () => {
  const { localTime } = useSprite();
  const slideIn = Easing.easeOutCubic(clamp(localTime / 0.7, 0, 1));

  return (
    <div style={{ position:'absolute', inset: 0, background: V_INK, overflow:'hidden' }}>
      {/* left: two comparison frames */}
      <div style={{ position:'absolute', left: 80, top: 140, display:'flex', gap: 24, transform: `translateY(${(1-slideIn)*30}px)`, opacity: slideIn }}>
        {[
          { label: 'YOUR SWING', angle: '78°', color: V_CYAN, skel: 78 },
          { label: 'PRO AVG', angle: '92°', color: V_GREEN_LT, skel: 92 },
        ].map((S, i) => (
          <div key={i} style={{ width: 340 }}>
            <Mono size={11} color={S.color}>{S.label}</Mono>
            <div style={{ marginTop: 10, width: 340, height: 500, border: `2px solid ${S.color}`, position:'relative',
              background: 'linear-gradient(170deg, #1f441f 0%, #357132 40%, #6ea666 100%)', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset: 0 }}>
                <SceneGolfer x={50} y={95} scale={0.95} rotation={i===0 ? -5 : 0}/>
              </div>
              {/* shoulder rotation arc overlay */}
              <svg viewBox="0 0 340 500" style={{ position:'absolute', inset: 0 }}>
                <path d={`M 170 140 A 60 60 0 0 1 ${170 + 60 * Math.cos(Math.PI - (S.skel/100)*Math.PI)} ${140 + 60 * Math.sin(Math.PI - (S.skel/100)*Math.PI)}`}
                  stroke={S.color} strokeWidth="3" fill="none" strokeDasharray="6 4"/>
              </svg>
              <div style={{ position:'absolute', bottom: 12, left: 12, display:'flex', gap: 8, alignItems:'baseline' }}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize: 44, fontWeight: 700, color: S.color, lineHeight: 1 }}>{S.angle}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>SHOULDER ROT.</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* right: prescription */}
      <div style={{ position:'absolute', right: 80, top: 180, width: 640, opacity: clamp((localTime-1)/0.8, 0, 1), transform: `translateX(${(1-clamp((localTime-1)/0.8, 0, 1))*30}px)` }}>
        <Mono size={13} color={V_CYAN}>§ ONE-POINT LESSON</Mono>
        <Tick color="#fff" style={{ margin: '24px 0' }}/>
        <div style={{ fontFamily:'var(--font-sans)', fontSize: 60, fontWeight: 600, color:'#fff', letterSpacing:'-0.03em', lineHeight: 1.08 }}>
          탑에서 어깨 회전<br/>
          <span style={{ color: V_CYAN, fontFamily:'var(--font-mono)' }}>+14°</span> 필요.
        </div>
        <div style={{ fontSize: 22, color:'rgba(255,255,255,0.75)', marginTop: 24, lineHeight: 1.55 }}>
          왼쪽 어깨가 턱 아래까지 깊숙이. 등이 타겟을 향하도록 돌려주세요.
        </div>

        {/* drill badge */}
        <div style={{ marginTop: 40, display:'flex', alignItems:'center', gap: 16, padding: '20px 24px', background:'rgba(255,255,255,0.06)', borderLeft: `3px solid ${V_GREEN_LT}` }}>
          <div style={{ width: 56, height: 56, background: V_GREEN_LT, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>DRILL</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color:'#fff' }}>크로스 암 턴</div>
            <div style={{ fontSize: 15, color:'rgba(255,255,255,0.6)', marginTop: 2 }}>하루 30회 × 3세트 · 4주 플랜</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// SCENE 6 — Outro (34 - 40s)
// ═══════════════════════════════════════════════════════════
const Scene6 = () => {
  const { localTime, progress } = useSprite();
  const swingAngle = kf([[0,-55],[0.3,40],[0.45,55],[1,55]], progress);
  const beforeAfter = clamp((localTime - 2) / 0.6, 0, 1);
  const logoAppear = clamp((localTime - 3) / 0.7, 0, 1);

  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
      <FairwayBG zoom={1.05}/>
      {/* golden hour */}
      <div style={{ position:'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 70% 20%, rgba(255,220,150,0.35), transparent 50%)' }}/>

      <div style={{ position:'absolute', inset: 0 }}>
        <SceneGolfer x={46} y={90} scale={1.0}/>
        <div style={{ position:'absolute', left:'46%', top:'54%', transform:`translate(-50%,-100%) rotate(${swingAngle}deg)`, transformOrigin: 'bottom center' }}>
          <div style={{ width: 4, height: 180, background: '#111', borderRadius: 2 }}/>
          <div style={{ position:'absolute', bottom: 170, left: -8, width: 32, height: 12, background: '#333', borderRadius: 2 }}/>
        </div>
      </div>

      {/* before/after tag */}
      <div style={{ position:'absolute', left: 80, top: 80, opacity: beforeAfter, transform: `translateY(${(1-beforeAfter)*20}px)` }}>
        <Mono size={13} color="#c7dec3">AFTER 4 WEEKS</Mono>
        <div style={{ display:'flex', alignItems:'baseline', gap: 24, marginTop: 20 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize: 140, fontWeight: 700, color:'#fff', lineHeight: 0.85, letterSpacing:'-0.05em' }}>
            84
          </div>
          <div style={{ paddingBottom: 16 }}>
            <div style={{ fontSize: 22, color:'#c7dec3', fontWeight: 600 }}>↑ +7</div>
            <div style={{ fontSize: 14, color:'rgba(255,255,255,0.7)', fontFamily:'var(--font-mono)', marginTop: 4 }}>A GRADE</div>
          </div>
        </div>
      </div>

      {/* logo outro */}
      <div style={{ position:'absolute', inset: 0, display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight: 120, opacity: logoAppear }}>
        <div style={{ textAlign:'right' }}>
          <Tick color="#fff" style={{ marginLeft:'auto', marginBottom: 32, width: 60 }}/>
          <div style={{ fontFamily:'var(--font-sans)', fontSize: 96, fontWeight: 700, color:'#fff', letterSpacing:'-0.04em', lineHeight: 1 }}>
            SwingLab<span style={{ color: V_CYAN }}>.</span>AI
          </div>
          <div style={{ fontSize: 24, color:'rgba(255,255,255,0.85)', marginTop: 20, letterSpacing:'-0.01em' }}>
            코치보다 자세하게. 데이터보다 친절하게.
          </div>
          <Mono size={12} color="rgba(255,255,255,0.6)" style={{ marginTop: 40 }}>
            swinglab.ai · 무료로 시작하기
          </Mono>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// Timestamp label updater for screen label
// ═══════════════════════════════════════════════════════════
const TimestampLabel = () => {
  const { time } = useTimeline();
  React.useEffect(() => {
    const root = document.querySelector('[data-video-root]');
    if (root) root.setAttribute('data-screen-label', `T=${Math.floor(time)}s`);
  }, [Math.floor(time)]);
  return null;
};

const VideoRoot = () => (
  <div data-video-root style={{ position:'absolute', inset: 0 }}>
    <style>{`
      @keyframes pulse { 0%,100% { opacity: 0.4 } 50% { opacity: 1 } }
      @keyframes blink { 0%,100% { opacity: 1 } 50% { opacity: 0 } }
    `}</style>
    <TimestampLabel/>
    <Sprite start={0}  end={5}>{() => <Scene1/>}</Sprite>
    <Sprite start={5}  end={10}>{() => <Scene2/>}</Sprite>
    <Sprite start={10} end={18}>{() => <Scene3/>}</Sprite>
    <Sprite start={18} end={27}>{() => <Scene4/>}</Sprite>
    <Sprite start={27} end={34}>{() => <Scene5/>}</Sprite>
    <Sprite start={34} end={40}>{() => <Scene6/>}</Sprite>

    {/* persistent mono timecode overlay (top right) */}
    <div style={{ position:'absolute', top: 24, right: 32, display:'flex', gap: 14, alignItems:'center', zIndex: 100 }}>
      <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
        <Logo size={18} color="rgba(255,255,255,0.9)" showText={true}/>
      </div>
    </div>
  </div>
);

Object.assign(window, { VideoRoot });
