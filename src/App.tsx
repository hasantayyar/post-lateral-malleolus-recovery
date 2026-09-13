import { useEffect, useState, type ButtonHTMLAttributes } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  Check,
  ShieldCheck,
  Sun,
  Moon,
  Clock3,
  House,
  BookOpen,
  History,
  RotateCcw,
  Download,
  Activity,
} from 'lucide-react';
import { program, rules } from './program';
import Illustration from './illustration';

type Timer = { kind: 'hold' | 'rest'; left: number; running: boolean };
type Session = {
  date: string;
  sets: number[];
  reps: number[][];
  targets: number[];
  holds: number[];
  index: number;
  duration: number;
  paused: boolean;
  complete: boolean;
  timer: Timer | null;
};
type Store = { sessions: Record<string, Session>; rest: number; vibrate: boolean; dark: boolean };
type View = 'home' | 'rules' | 'workout' | 'library' | 'history';

const KEY = 'daily-recovery-v1';
const initial: Store = { sessions: {}, rest: 60, vibrate: false, dark: false };

function dateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function blank(date: string): Session {
  return {
    date,
    sets: program.map(() => 0),
    reps: program.map(() => []),
    targets: program.map((e) => e.min),
    holds: program.map((e) => e.hold?.[0] ?? 0),
    index: 0,
    duration: 0,
    paused: false,
    complete: false,
    timer: null,
  };
}

function count(s?: Session) {
  return s ? program.filter((e, i) => s.sets[i] >= e.sets).length : 0;
}

function format(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function range(ex: { min: number; max: number }) {
  return ex.min === ex.max ? String(ex.min) : `${ex.min}-${ex.max}`;
}

function Btn({
  variant = 'ghost',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'ghost' | 'outline' | 'primary' }) {
  return <button type="button" className={`btn btn-${variant} ${className}`} {...props} />;
}

function Safety() {
  return (
    <aside className="safety">
      <ShieldCheck size={22} />
      <div>
        <strong>Protect your ankle</strong>
        <p>Stop if your ankle twists, rolls, feels unstable, or develops significant pain.</p>
      </div>
    </aside>
  );
}

export default function App() {
  const [data, setData] = useState<Store>(initial);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>('home');
  const [today, setToday] = useState('');
  const [reset, setReset] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register(new URL('./sw.js', document.baseURI).href).catch(() => {});
    }
    setToday(dateKey());
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.sessions || ![45, 60, 90].includes(parsed.rest)) throw Error();
        for (const s of Object.values(parsed.sessions) as Session[]) {
          if (!Array.isArray(s.sets) || s.sets.length !== 8 || !s.targets || !s.holds || !s.reps) throw Error();
          s.paused = true;
          if (s.timer) s.timer.running = false;
        }
        setData(parsed);
      } else {
        setData({ ...initial, dark: matchMedia('(prefers-color-scheme: dark)').matches });
      }
    } catch {
      setError('Saved data could not be loaded. Tracking is available for this visit, but existing saved data will not be overwritten.');
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || error) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      setError('This browser could not save your progress. Keep this page open and export your history before leaving.');
    }
  }, [data, ready, error]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', data.dark);
  }, [data.dark]);

  const s = data.sessions[today];
  const e = program[s?.index ?? 0];
  const idx = s?.index ?? 0;
  const completed = count(s);

  const update = (fn: (session: Session) => Session) =>
    setData((d) => ({ ...d, sessions: { ...d.sessions, [today]: fn(d.sessions[today]) } }));

  useEffect(() => {
    if (!ready) return;
    const t = setInterval(() => {
      const now = dateKey();
      setToday((previous) => {
        if (previous && previous !== now) setView('home');
        return now;
      });
      if (document.hidden) return;
      setData((d) => {
        const current = d.sessions[now];
        if (!current || current.paused || current.complete) return d;
        const timer = current.timer;
        const next = timer?.running
          ? { ...timer, left: Math.max(0, timer.left - 1), running: timer.left > 1 }
          : timer;
        return { ...d, sessions: { ...d.sessions, [now]: { ...current, duration: current.duration + 1, timer: next } } };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [ready]);

  useEffect(() => {
    const pause = () =>
      setData((d) => {
        const day = dateKey();
        const cur = d.sessions[day];
        return cur
          ? { ...d, sessions: { ...d.sessions, [day]: { ...cur, paused: true, timer: cur.timer ? { ...cur.timer, running: false } : null } } }
          : d;
      });
    const visibility = () => {
      if (document.hidden) pause();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);

  useEffect(() => {
    if (s?.timer?.left === 0) {
      setNotice(s.timer.kind === 'rest' ? 'Rest timer finished. Continue when ready.' : 'Hold finished. Relax.');
      if (data.vibrate && navigator.vibrate) navigator.vibrate(100);
    }
  }, [s?.timer?.left, data.vibrate, s?.timer?.kind]);

  const nav = (v: View) => {
    if (s && !s.paused && !s.complete) {
      update((x) => ({ ...x, paused: true, timer: x.timer ? { ...x.timer, running: false } : null }));
    }
    setView(v);
  };

  const start = () => {
    if (s) {
      setView('workout');
      return;
    }
    setView('rules');
  };

  const begin = () => {
    setData((d) => ({ ...d, sessions: { ...d.sessions, [today]: blank(today) } }));
    setView('workout');
  };

  const move = (i: number) => {
    setNotice('');
    update((x) => ({ ...x, index: i, timer: x.timer?.kind === 'rest' ? x.timer : null }));
  };

  const completeSet = () => {
    if (!s || s.paused || s.sets[idx] >= e.sets || s.timer?.running) return;
    update((x) => {
      const sets = [...x.sets];
      sets[idx]++;
      const reps = x.reps.map((a) => [...a]);
      reps[idx].push(e.timed ? x.holds[idx] : x.targets[idx]);
      const complete = program.every((ex, i) => sets[i] >= ex.sets);
      return {
        ...x,
        sets,
        reps,
        complete,
        paused: complete,
        timer: complete ? null : { kind: 'rest', left: data.rest, running: true },
      };
    });
    setNotice('Set recorded.');
  };

  const download = (type: 'json' | 'csv') => {
    const sessions = Object.values(data.sessions).sort((a, b) => b.date.localeCompare(a.date));
    const csv =
      'date,exercises_completed,sets_completed,duration_seconds,fully_completed\n' +
      sessions.map((x) => `${x.date},${count(x)},${x.sets.reduce((a, b) => a + b, 0)},${x.duration},${x.complete}`).join('\n');
    const blob = new Blob([type === 'json' ? JSON.stringify({ program, sessions }, null, 2) : csv], {
      type: type === 'json' ? 'application/json' : 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recovery-history.${type}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const timer = (kind: 'hold' | 'rest', seconds: number) => {
    setNotice('');
    update((x) => ({ ...x, timer: { kind, left: seconds, running: true } }));
  };

  const restBlocked = s?.paused || !!s?.timer?.running || !!(s?.timer?.kind === 'rest' && s.timer.left > 0);

  const historyDays = Array.from(
    new Set([
      ...Object.keys(data.sessions),
      ...Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return dateKeyFrom(d);
      }),
    ]),
  )
    .sort()
    .reverse();

  return (
    <div className="app">
      <header className="topbar">
        <a
          href="#"
          onClick={(ev) => {
            ev.preventDefault();
            nav('home');
          }}
          className="brand"
        >
          <span className="brand-icon">
            <Activity size={23} />
          </span>
          My Ankle Recovery
        </a>
        <nav aria-label="Main navigation">
          {(
            [
              ['home', 'Today', House],
              ['library', 'Exercises', BookOpen],
              ['history', 'History', History],
            ] as const
          ).map(([v, label, Icon]) => (
            <Btn key={v} className={view === v ? 'nav active' : 'nav'} onClick={() => nav(v)}>
              <Icon size={18} />
              {label}
            </Btn>
          ))}
        </nav>
        <Btn aria-label={data.dark ? 'Use light mode' : 'Use dark mode'} onClick={() => setData((d) => ({ ...d, dark: !d.dark }))}>
          {data.dark ? <Sun /> : <Moon />}
        </Btn>
      </header>

      <main>
        <aside className="personal-disclaimer" aria-label="Personal use disclaimer">
          <strong>Personal use · Physiotherapist-approved routine</strong>
          <p>
            This is my personal exercise guide and tracker for recovery after lateral malleolus surgery, used with my
            physiotherapist's approval. It is not medical advice or a rehabilitation plan for anyone else. My surgeon's and
            physiotherapist's instructions take priority; changes to exercises, loading or progression require their approval.
          </p>
        </aside>
        {error && (
          <p role="alert" className="safety">
            {error}
          </p>
        )}
        {!ready ? (
          <p>Loading your routine...</p>
        ) : (
          <>
            {view === 'home' && (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">YOUR DAILY ROUTINE</p>
                    <h1>My Ankle Recovery</h1>
                    <p className="subtitle">Personal recovery after lateral malleolus surgery.</p>
                  </div>
                  <span className="date">
                    {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </div>
                <div className="home-grid">
                  <section className="card today-card">
                    <div className="row">
                      <span className="pill">{s?.complete ? 'Session complete' : s ? 'Session in progress' : 'Ready when you are'}</span>
                      <Clock3 size={20} />
                    </div>
                    <div className="progress-area">
                      <div className="ring" style={{ background: `conic-gradient(var(--primary) ${completed * 45}deg,var(--line) 0deg)` }}>
                        <div>
                          <strong>
                            {completed}
                            <small> / 8</small>
                          </strong>
                          <span>exercises completed</span>
                        </div>
                      </div>
                      <div className="progress-copy">
                        <h2>{s?.complete ? "Today's session is complete." : s ? 'Continue at your pace.' : 'Your routine, one set at a time.'}</h2>
                        <p>
                          8 exercises · once daily
                          <br />
                          No added resistance or progression.
                        </p>
                      </div>
                    </div>
                    <Btn variant="primary" className="wide" onClick={start}>
                      {s?.complete ? <Check /> : <Play />}
                      {s?.complete ? "Review today's session" : s ? 'Continue session' : "Start today's session"}
                      <ArrowRight />
                    </Btn>
                    {s && (
                      <p className="saved">
                        {format(s.duration)} active time · Progress saved on this device
                      </p>
                    )}
                  </section>
                  <div className="home-side">
                    <Safety />
                    <section className="card compact">
                      <p className="eyebrow">SESSION PREFERENCES</p>
                      <label className="setting">
                        Rest between sets
                        <select aria-label="Rest between sets" value={data.rest} onChange={(ev) => setData((d) => ({ ...d, rest: +ev.target.value }))}>
                          {[45, 60, 90].map((n) => (
                            <option key={n} value={n}>
                              {n} seconds
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="setting">
                        Vibrate when a timer ends
                        <input
                          type="checkbox"
                          className="toggle"
                          checked={data.vibrate}
                          onChange={(ev) => setData((d) => ({ ...d, vibrate: ev.target.checked }))}
                        />
                      </label>
                      <p className="small muted">Vibration depends on your device and browser.</p>
                    </section>
                  </div>
                </div>
                <div className="section-title">
                  <h2>Your exercise program</h2>
                  <Btn onClick={() => nav('library')}>
                    View exercises <ArrowRight />
                  </Btn>
                </div>
                <div className="program-list">
                  {program.map((ex, i) => (
                    <button key={ex.id} className="exercise-row" onClick={() => nav('library')}>
                      <span className="number">{s && s.sets[i] >= ex.sets ? <Check size={19} /> : String(i + 1).padStart(2, '0')}</span>
                      <span>
                        <strong>{ex.name}</strong>
                        <small>
                          {ex.sets} sets · {range(ex)} {ex.timed ? 'seconds' : 'reps'}
                        </small>
                      </span>
                      <ArrowRight size={18} />
                    </button>
                  ))}
                </div>
              </>
            )}

            {view === 'rules' && (
              <section className="card rules">
                <p className="eyebrow">BEFORE YOU BEGIN</p>
                <h1>A safe, steady session.</h1>
                <p>Follow your surgical team's restrictions. This app guides and records your supplied routine; it does not decide medical readiness.</p>
                <ul>
                  {rules.map((r) => (
                    <li key={r}>
                      <ShieldCheck size={20} />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
                <Btn variant="primary" className="wide" onClick={begin}>
                  Start workout <ArrowRight />
                </Btn>
                <Btn className="wide" onClick={() => setView('home')}>
                  Back to today
                </Btn>
              </section>
            )}

            {view === 'workout' && s && (
              <>
                <div className="workout-heading">
                  <Btn onClick={() => nav('home')}>
                    <ArrowLeft /> Today
                  </Btn>
                  <span className="muted">
                    <Clock3 size={17} /> {format(s.duration)} active
                  </span>
                  <Btn
                    variant="outline"
                    disabled={s.complete}
                    onClick={() => update((x) => ({ ...x, paused: !x.paused, timer: x.timer ? { ...x.timer, running: false } : null }))}
                  >
                    {s.paused ? <Play /> : <Pause />}
                    {s.paused ? 'Resume session' : 'Pause session'}
                  </Btn>
                </div>
                {s.complete && (
                  <div className="completion" role="status">
                    <Check />
                    <div>
                      <strong>Today's session is complete.</strong>
                      <p>All 8 exercises are recorded. You can rest now.</p>
                    </div>
                    <Btn variant="outline" onClick={() => nav('history')}>
                      View history
                    </Btn>
                  </div>
                )}
                <div className="workout-grid">
                  <section className="card exercise-main">
                    <div className="row">
                      <p className="eyebrow">
                        EXERCISE {idx + 1} OF 8
                      </p>
                      <span className="pill">{completed} / 8 complete</span>
                    </div>
                    <div className="steps" aria-label={`${completed} of 8 exercises completed`}>
                      {program.map((ex, i) => (
                        <span key={ex.id} className={s.sets[i] >= ex.sets ? 'done' : i === idx ? 'current' : ''} />
                      ))}
                    </div>
                    <h1>{e.name}</h1>
                    <Illustration kind={e.id} />
                    <div className="instructions">
                      <div>
                        <p className="eyebrow">STARTING POSITION</p>
                        <p>{e.position}</p>
                      </div>
                      <div>
                        <p className="eyebrow">MOVEMENT</p>
                        <p>{e.movement}</p>
                      </div>
                    </div>
                    <div className={'form-cue ' + (e.id === 'clams' ? 'important' : '')}>
                      <ShieldCheck size={21} />
                      <div>
                        <strong>{e.id === 'clams' ? 'Ankle safety - movement from the hip' : 'Form cue'}</strong>
                        <p>{e.cue}</p>
                      </div>
                    </div>
                    <div className="exercise-nav">
                      <Btn variant="outline" disabled={idx === 0} onClick={() => move(idx - 1)}>
                        <ArrowLeft /> Previous
                      </Btn>
                      <Btn variant="outline" disabled={idx === 7} onClick={() => move(idx + 1)}>
                        Next exercise <ArrowRight />
                      </Btn>
                    </div>
                  </section>
                  <aside className="workout-side">
                    <section className="card set-card">
                      <div className="row">
                        <p className="eyebrow">{s.sets[idx] >= e.sets ? 'SETS COMPLETE' : 'CURRENT SET'}</p>
                        <span className="set-number">
                          {Math.min(s.sets[idx] + 1, e.sets)} <small>/ {e.sets}</small>
                        </span>
                      </div>
                      <div className="set-dots">
                        {Array.from({ length: e.sets }, (_, i) => (
                          <span key={i} className={i < s.sets[idx] ? 'done' : ''}>
                            {i < s.sets[idx] ? <Check size={17} /> : i + 1}
                          </span>
                        ))}
                      </div>
                      <label className="target">
                        {e.timed ? 'Hold duration' : 'Repetitions per set'}
                        <select
                          aria-label={e.timed ? 'Hold duration' : 'Repetitions per set'}
                          disabled={s.complete}
                          value={e.timed ? s.holds[idx] : s.targets[idx]}
                          onChange={(ev) => {
                            const value = +ev.target.value;
                            update((x) => {
                              const key = e.timed ? 'holds' : 'targets';
                              const a = [...x[key]];
                              a[idx] = value;
                              return { ...x, [key]: a };
                            });
                          }}
                        >
                          {Array.from({ length: e.max - e.min + 1 }, (_, j) => e.min + j).map((n) => (
                            <option key={n} value={n}>
                              {n}
                              {e.timed ? ' seconds' : ' reps'}
                            </option>
                          ))}
                        </select>
                      </label>
                      <p className="tempo">
                        <Clock3 size={17} />
                        {e.tempo}
                      </p>
                      {e.hold && !e.timed && (
                        <label className="setting">
                          Hold duration
                          <select
                            aria-label="Hold duration"
                            value={s.holds[idx]}
                            onChange={(ev) => {
                              const n = +ev.target.value;
                              update((x) => {
                                const holds = [...x.holds];
                                holds[idx] = n;
                                return { ...x, holds };
                              });
                            }}
                          >
                            {[5, 6, 7, 8].map((n) => (
                              <option key={n}>{n}</option>
                            ))}
                          </select>
                        </label>
                      )}
                      {s.paused && !s.complete && (
                        <div className="paused">
                          <Pause size={18} /> Session paused. Resume when ready.
                        </div>
                      )}
                      {s.timer && (
                        <div className={'timer ' + s.timer.kind}>
                          <p>{s.timer.kind === 'rest' ? 'REST BETWEEN SETS' : 'HOLD & BREATHE'}</p>
                          <output role="timer" aria-label={`${s.timer.kind} timer`}>
                            {format(s.timer.left)}
                          </output>
                          {s.timer.left > 0 ? (
                            <Btn
                              variant="outline"
                              disabled={s.paused}
                              onClick={() => update((x) => ({ ...x, timer: x.timer ? { ...x.timer, running: !x.timer.running } : null }))}
                            >
                              {s.timer.running ? 'Pause timer' : 'Resume timer'}
                            </Btn>
                          ) : (
                            <span className="small">
                              {s.timer.kind === 'rest' ? 'Continue when you feel ready.' : 'Relax. Count this repetition yourself.'}
                            </span>
                          )}
                          {s.timer.kind === 'rest' && (
                            <Btn disabled={s.paused} onClick={() => update((x) => ({ ...x, timer: null }))}>
                              Dismiss rest timer
                            </Btn>
                          )}
                        </div>
                      )}
                      {e.hold && (
                        <Btn
                          variant="outline"
                          className="wide timer-start"
                          disabled={restBlocked || s.sets[idx] >= e.sets}
                          onClick={() => timer('hold', s.holds[idx])}
                        >
                          <Clock3 />
                          {s.timer?.kind === 'hold' && s.timer.left === 0 ? 'Repeat timer' : `Start ${s.holds[idx]} sec hold`}
                        </Btn>
                      )}
                      <Btn variant="primary" className="wide" disabled={restBlocked || s.sets[idx] >= e.sets} onClick={completeSet}>
                        <Check />
                        {s.sets[idx] >= e.sets ? 'Exercise completed' : 'Complete Set'}
                      </Btn>
                      <p className="small muted">
                        {e.timed ? 'Complete the set after your hold.' : 'Complete the set after all repetitions.'} Timers do not
                        record reps.
                      </p>
                      <Btn className="wide" disabled={s.paused || !!s.timer?.running || s.complete} onClick={() => timer('rest', data.rest)}>
                        Start {data.rest} sec rest
                      </Btn>
                    </section>
                    <Safety />
                    <p className="small muted">No weight-bearing exercises or ankle resistance unless medically cleared.</p>
                    <Btn onClick={() => setReset(true)}>
                      <RotateCcw /> Reset today's session
                    </Btn>
                  </aside>
                </div>
                <p className="sr-only" role="status">
                  {notice}
                </p>
              </>
            )}

            {view === 'library' && (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">YOUR PROGRAM</p>
                    <h1>Exercise library</h1>
                    <p className="subtitle">Review the position, movement and form at your own pace.</p>
                  </div>
                </div>
                <Safety />
                <div className="library-grid">
                  {program.map((ex, i) => (
                    <article className="card library-card" key={ex.id}>
                      <div className="row">
                        <span className="number">{String(i + 1).padStart(2, '0')}</span>
                        <span className="muted small">
                          {ex.sets} sets · {range(ex)} {ex.timed ? 'sec' : 'reps'}
                        </span>
                      </div>
                      <h2>{ex.name}</h2>
                      <Illustration kind={ex.id} />
                      <strong>{ex.position}</strong>
                      <p>{ex.movement}</p>
                      <p className="tempo">
                        <Clock3 size={17} />
                        {ex.tempo}
                      </p>
                      <div className={'form-cue ' + (ex.id === 'clams' ? 'important' : '')}>
                        <ShieldCheck size={20} />
                        <p>{ex.cue}</p>
                      </div>
                    </article>
                  ))}
                </div>
                <section className="card rules">
                  <h2>General session rules</h2>
                  <ul>
                    {rules.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </section>
              </>
            )}

            {view === 'history' && (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">YOUR RECORD</p>
                    <h1>Session history</h1>
                    <p className="subtitle">A record of your routine. No streaks, no pressure.</p>
                  </div>
                  <div className="exports">
                    <Btn variant="outline" onClick={() => download('json')}>
                      <Download />
                      JSON
                    </Btn>
                    <Btn variant="outline" onClick={() => download('csv')}>
                      <Download />
                      CSV
                    </Btn>
                  </div>
                </div>
                <section className="card history">
                  {historyDays.map((day) => {
                    const item = data.sessions[day];
                    return (
                      <div className="history-row" key={day}>
                        <div>
                          <strong>
                            {new Date(day + 'T12:00:00').toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </strong>
                          <p>{item ? `${item.sets.reduce((a, b) => a + b, 0)} sets · ${format(item.duration)} active time` : 'Rest / no session'}</p>
                        </div>
                        <span className={item?.complete ? 'pill' : 'muted'}>{item ? `${count(item)}/8 completed` : '-'}</span>
                      </div>
                    );
                  })}
                </section>
                <p className="muted small">Stored only in this browser. Clearing browser data removes your history. Export a copy to keep it.</p>
              </>
            )}
          </>
        )}
      </main>

      <footer>
        <ShieldCheck size={16} /> Your routine, guided. Your care team's instructions come first.
        <span>Progress stored on this device</span>
      </footer>

      {reset && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="reset-title">
          <div className="dialog">
            <h2 id="reset-title">Reset today's session?</h2>
            <p>This removes today's recorded sets, timers and duration. Other days stay in your history.</p>
            <div className="dialog-actions">
              <Btn variant="outline" onClick={() => setReset(false)}>
                Keep session
              </Btn>
              <Btn
                variant="primary"
                onClick={() => {
                  setData((d) => {
                    const sessions = { ...d.sessions };
                    delete sessions[today];
                    return { ...d, sessions };
                  });
                  setReset(false);
                  setView('home');
                }}
              >
                Reset session
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function dateKeyFrom(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
