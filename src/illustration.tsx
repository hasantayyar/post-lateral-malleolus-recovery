import { useId } from 'react';

const labels: Record<string, string> = {
  slides: 'Side view: heel slides toward buttock as knee bends.',
  quads: 'Side view: straight leg, thigh tightens and knee presses downward.',
  raises: 'Side view: straight operated leg lifts from hip, knee stays straight.',
  glutes: 'Side view: both buttocks tighten with no ankle movement.',
  clams: 'Side view: upper knee opens from hip while both feet stay together on support.',
  extension: 'Prone side view: straight thigh lifts slightly from hip.',
  curls: 'Prone side view: knee bends while thigh stays still.',
  brace: 'Side view: abdominal muscles tighten while breathing continues.',
};

const paths: Record<string, string> = {
  slides: 'M204 148 L269 90 L319 154 L322 137',
  raises: 'M204 148 L285 114 L376 77 L369 61',
  extension: 'M204 145 L283 131 L382 119 L385 135',
  curls: 'M204 145 L284 150 L322 68 L338 71',
};

export default function Illustration({ kind }: { kind: string }) {
  const id = useId().replaceAll(':', '');
  const prone = kind === 'extension' || kind === 'curls';
  const leg = paths[kind] ?? 'M204 148 L286 151 L383 155 L385 139';

  return (
    <figure className="diagram">
      <svg viewBox="0 0 460 210" role="img" aria-label={labels[kind]}>
        <defs>
          <marker id={id} markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto-start-reverse">
            <path d="M0 0 L5 3 L0 6" fill="none" stroke="var(--primary)" strokeWidth="1.4" />
          </marker>
        </defs>
        <path d="M36 174 H424" stroke="var(--line)" strokeWidth="2" />
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="70" cy={prone ? 147 : 132} r="18" stroke="var(--ink)" strokeWidth="4" />
          <path d={prone ? 'M93 145 Q146 131 204 145' : 'M92 146 Q140 127 204 148'} stroke="var(--ink)" strokeWidth="8" />
          <path d="M102 147 L133 164 L174 164" stroke="var(--muted)" strokeWidth="5" />
          {kind === 'clams' ? (
            <>
              <path d="M204 148 L284 165 L349 150 L363 155" stroke="var(--muted)" strokeWidth="7" />
              <path d="M204 148 L273 97 L349 150 L363 155" stroke="var(--primary)" strokeWidth="8" />
              <path d="M292 146 Q311 118 291 102" stroke="var(--primary)" strokeWidth="2" markerEnd={`url(#${id})`} />
              <rect x="334" y="162" width="48" height="10" rx="4" stroke="var(--muted)" />
              <circle cx="349" cy="150" r="11" stroke="var(--primary)" strokeWidth="2" />
              <text x="254" y="64">Open from hip</text>
              <text x="296" y="197">Feet together</text>
            </>
          ) : (
            <>
              <path d="M204 148 L286 156 L383 157 L385 141" stroke="var(--muted)" strokeWidth="6" opacity=".45" strokeDasharray="7 8" />
              <path d={leg} stroke="var(--primary)" strokeWidth="8" />
              {kind === 'slides' && <path d="M371 165 H330" stroke="var(--primary)" strokeWidth="2" markerEnd={`url(#${id})`} />}
              {kind === 'raises' && <path d="M400 137 L398 86" stroke="var(--primary)" strokeWidth="2" markerEnd={`url(#${id})`} />}
              {kind === 'extension' && <path d="M403 153 L403 119" stroke="var(--primary)" strokeWidth="2" markerEnd={`url(#${id})`} />}
              {kind === 'curls' && <path d="M371 133 Q366 102 344 88" stroke="var(--primary)" strokeWidth="2" markerEnd={`url(#${id})`} />}
              {kind === 'quads' && (
                <>
                  <path d="M270 105 V134" stroke="var(--primary)" strokeWidth="2" markerEnd={`url(#${id})`} />
                  <text x="225" y="83">Press knee down</text>
                </>
              )}
              {kind === 'glutes' && (
                <>
                  <ellipse cx="194" cy="144" rx="24" ry="18" stroke="var(--primary)" strokeWidth="2" />
                  <text x="181" y="86">Tighten both buttocks</text>
                </>
              )}
              {kind === 'brace' && (
                <>
                  <ellipse cx="151" cy="140" rx="29" ry="20" stroke="var(--primary)" strokeWidth="2" />
                  <text x="179" y="87">Brace and breathe</text>
                </>
              )}
              {kind === 'raises' && <text x="267" y="55">Straight knee, 20-30 cm</text>}
            </>
          )}
        </g>
      </svg>
      <figcaption>
        <span className="legend" /> Operated leg / active area <span className="dash" /> Starting position
      </figcaption>
    </figure>
  );
}
