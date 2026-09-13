export type Exercise = {
  id: string;
  name: string;
  position: string;
  movement: string;
  sets: number;
  min: number;
  max: number;
  tempo: string;
  cue: string;
  hold?: [number, number];
  timed?: boolean;
};

export const program: Exercise[] = [
  {
    id: 'slides',
    name: 'Knee bends / heel slides',
    position: 'Lie on your back.',
    movement: 'Slide your heel toward your buttock, then straighten slowly.',
    sets: 2,
    min: 15,
    max: 20,
    tempo: 'Slow, controlled movement',
    cue: 'Keep the ankle relaxed as the heel slides.',
  },
  {
    id: 'quads',
    name: 'Quad contractions',
    position: 'Lie with your leg straight.',
    movement: 'Tighten the front thigh and gently press the back of the knee downward.',
    sets: 2,
    min: 10,
    max: 10,
    hold: [5, 8],
    tempo: 'Hold each contraction for 5-8 seconds',
    cue: 'Tighten the thigh; keep the ankle relaxed.',
  },
  {
    id: 'raises',
    name: 'Straight-leg raises',
    position: 'Lie flat on your back.',
    movement: 'Tighten your quad first. Lift the straight leg about 20-30 cm, then lower slowly.',
    sets: 3,
    min: 10,
    max: 15,
    tempo: '2 sec lift, 1-2 sec hold, 3 sec lower',
    cue: 'Keep the knee completely straight.',
  },
  {
    id: 'glutes',
    name: 'Glute squeezes',
    position: 'Lie flat on your back.',
    movement: 'Tighten both buttocks without moving the ankle.',
    sets: 3,
    min: 10,
    max: 15,
    hold: [5, 8],
    tempo: 'Hold each squeeze for 5-8 seconds',
    cue: 'Squeeze both buttocks; do not move the ankle.',
  },
  {
    id: 'clams',
    name: 'Clamshells',
    position: 'Lie on your healthy side with knees bent.',
    movement: 'Keep your feet together and raise the operated-side knee using the hip.',
    sets: 3,
    min: 12,
    max: 15,
    tempo: 'Controlled opening and lowering',
    cue: 'Keep the operated ankle relaxed, supported and neutral. Do not twist or roll it inward or outward. The movement comes from the hip.',
  },
  {
    id: 'extension',
    name: 'Prone hip extension',
    position: 'Lie on your stomach with your leg straight.',
    movement: 'Gently lift the thigh using your glute, without excessively arching your lower back.',
    sets: 3,
    min: 12,
    max: 15,
    tempo: 'Controlled lift, short hold, slow lowering',
    cue: 'Keep the ankle relaxed and supported.',
  },
  {
    id: 'curls',
    name: 'Prone hamstring curls',
    position: 'Lie on your stomach.',
    movement: 'Slowly bend your knee toward your buttock, then lower again.',
    sets: 3,
    min: 12,
    max: 15,
    tempo: 'Slow, controlled bending and lowering',
    cue: 'Keep the ankle relaxed.',
  },
  {
    id: 'brace',
    name: 'Abdominal brace',
    position: 'Lie comfortably.',
    movement: 'Tighten your abdominal muscles while continuing to breathe normally.',
    sets: 3,
    min: 20,
    max: 30,
    hold: [20, 30],
    timed: true,
    tempo: 'Hold for 20-30 seconds',
    cue: 'Breathe normally throughout. Do not hold your breath.',
  },
];

export const rules = [
  'Perform this routine once daily.',
  'Rest 45-90 seconds between strength sets.',
  'Prefer controlled movements over more repetitions.',
  'General strength tempo: approximately 2 sec up, 1-2 sec hold, 3 sec down.',
  'Stop an exercise if the ankle twists, rolls, feels unstable, or develops significant pain.',
  'Do not add squats, calf raises, lunges, balance exercises, ankle resistance, or other weight-bearing exercises unless medically cleared.',
];
