// ─────────────────────────────────────────────────────────────────────────────
// Reliable gesture vocabulary — only gestures that are geometrically distinct
// and easy for a human to hold stably.
// ─────────────────────────────────────────────────────────────────────────────

export type GestureId =
  // ── Utility (silent, no TTS) ─────────────────────────────────────────────
  | 'FIST'          // ✊ one hand fist → delete last word
  | 'BOTH_FISTS'    // 🤜🤛 both fists → clear all
  // ── Standard finger count (no thumb) ────────────────────────────────────
  | 'INDEX'         // ☝️  index only
  | 'PEACE'         // ✌️  index + middle
  | 'THREE'         // 🤟 index + middle + ring
  | 'FOUR'          // 🖖 index + middle + ring + pinky
  | 'OPEN_PALM'     // 🖐️ all 5 — thumb + 4 fingers
  // ── Thumb variants ───────────────────────────────────────────────────────
  | 'THUMB_UP'      // 👍 thumb only pointing up
  | 'THUMB_DOWN'    // 👎 thumb only pointing down
  // ── Isolated / special single fingers ───────────────────────────────────
  | 'PINKY'         // 🤙 pinky only
  // ── Distinctive multi-finger combos (no thumb) ───────────────────────────
  | 'ROCK'          // 🤘 index + pinky (\m/)
  // ── Thumb + finger combos ────────────────────────────────────────────────
  | 'SHAKA'         // 🤙 thumb + pinky (hang loose)
  | 'L_SHAPE'       // 🫲 thumb + index (L)
  | 'ILY'           // 🤟 thumb + index + pinky (ASL I Love You)
  | 'THREE_THUMB'   // thumb + index + middle
  | 'FOUR_THUMB'    // thumb + index + middle + ring (no pinky)
  // ── Two-hand gestures ────────────────────────────────────────────────────
  | 'BOTH_OPEN'     // 🙌 both open palms
  | 'BOTH_PEACE'    // ✌️✌️ peace on both hands
  | 'BOTH_THUMB_UP' // 👍👍 thumbs up on both
  | 'UNKNOWN';

export interface GestureDefinition {
  id: GestureId;
  label: string;
  emoji: string;
  phrase: string;
  isUtility: boolean;
  description: string;
}

export const GESTURE_MAP: Record<GestureId, GestureDefinition> = {
  // ── Utility ──────────────────────────────────────────────────────────────
  FIST: {
    id: 'FIST', label: 'Fist', emoji: '✊',
    phrase: '', isUtility: true,
    description: 'Close ALL fingers into a fist',
  },
  BOTH_FISTS: {
    id: 'BOTH_FISTS', label: 'Both Fists', emoji: '🤜🤛',
    phrase: '', isUtility: true,
    description: 'Make a fist with BOTH hands',
  },

  // ── Finger count (no thumb) ───────────────────────────────────────────────
  INDEX: {
    id: 'INDEX', label: '1 Finger (Index)', emoji: '☝️',
    phrase: 'Hello!', isUtility: false,
    description: 'Raise ONLY your index finger. Curl all others.',
  },
  PEACE: {
    id: 'PEACE', label: 'Peace Sign (V)', emoji: '✌️',
    phrase: 'How are you?', isUtility: false,
    description: 'Index + middle up. Thumb and other fingers curled.',
  },
  THREE: {
    id: 'THREE', label: '3 Fingers', emoji: '🖖',
    phrase: 'I am', isUtility: false,
    description: 'Index + middle + ring up. Thumb and pinky curled.',
  },
  FOUR: {
    id: 'FOUR', label: '4 Fingers (no thumb)', emoji: '🖖',
    phrase: 'going to', isUtility: false,
    description: 'All 4 fingers up — index to pinky. Thumb curled IN.',
  },
  OPEN_PALM: {
    id: 'OPEN_PALM', label: 'Open Palm (all 5)', emoji: '🖐️',
    phrase: 'Thank you!', isUtility: false,
    description: 'All 5 fingers spread open including thumb.',
  },

  // ── Thumb variants ────────────────────────────────────────────────────────
  THUMB_UP: {
    id: 'THUMB_UP', label: 'Thumbs Up', emoji: '👍',
    phrase: 'Yes,', isUtility: false,
    description: 'ONLY thumb extended and pointing UP. All fingers curled.',
  },
  THUMB_DOWN: {
    id: 'THUMB_DOWN', label: 'Thumbs Down', emoji: '👎',
    phrase: 'No,', isUtility: false,
    description: 'ONLY thumb extended and pointing DOWN. All fingers curled.',
  },

  // ── Single isolated finger ────────────────────────────────────────────────
  PINKY: {
    id: 'PINKY', label: 'Pinky Only', emoji: '🤙',
    phrase: 'I need', isUtility: false,
    description: 'Raise ONLY your pinky finger. All others curled.',
  },

  // ── Multi-finger combos (no thumb) ───────────────────────────────────────
  ROCK: {
    id: 'ROCK', label: 'Rock / Metal \m/', emoji: '🤘',
    phrase: 'Please,', isUtility: false,
    description: 'Index + pinky up. Middle + ring curled down. No thumb.',
  },

  // ── Thumb + finger combos ─────────────────────────────────────────────────
  L_SHAPE: {
    id: 'L_SHAPE', label: 'L-Shape', emoji: '🫲',
    phrase: 'I want to', isUtility: false,
    description: 'Thumb pointing OUT + index pointing UP. Others curled.',
  },
  SHAKA: {
    id: 'SHAKA', label: 'Shaka / Hang Loose', emoji: '🤙',
    phrase: 'No worries!', isUtility: false,
    description: 'Thumb + pinky extended. Middle 3 fingers curled.',
  },
  ILY: {
    id: 'ILY', label: 'I Love You (ASL)', emoji: '🤟',
    phrase: 'I love you!', isUtility: false,
    description: 'Thumb + index + pinky extended. Middle + ring curled.',
  },
  THREE_THUMB: {
    id: 'THREE_THUMB', label: 'Thumb + 2 fingers', emoji: '🤙',
    phrase: 'Good morning!', isUtility: false,
    description: 'Thumb + index + middle up. Ring + pinky curled.',
  },
  FOUR_THUMB: {
    id: 'FOUR_THUMB', label: '4 fingers + thumb (no pinky)', emoji: '🖐️',
    phrase: 'Goodbye!', isUtility: false,
    description: 'Thumb + index + middle + ring up. ONLY pinky curled.',
  },

  // ── Two-hand gestures ─────────────────────────────────────────────────────
  BOTH_OPEN: {
    id: 'BOTH_OPEN', label: 'Both Open Palms', emoji: '🙌',
    phrase: 'That is absolutely wonderful!', isUtility: false,
    description: 'Show BOTH open palms at the same time.',
  },
  BOTH_PEACE: {
    id: 'BOTH_PEACE', label: 'Double Peace', emoji: '✌️✌️',
    phrase: 'No problem at all!', isUtility: false,
    description: 'Peace sign (V) with BOTH hands simultaneously.',
  },
  BOTH_THUMB_UP: {
    id: 'BOTH_THUMB_UP', label: 'Double Thumbs Up', emoji: '👍👍',
    phrase: 'That is absolutely amazing!', isUtility: false,
    description: 'Thumbs up with BOTH hands simultaneously.',
  },

  UNKNOWN: {
    id: 'UNKNOWN', label: 'Unknown', emoji: '❓',
    phrase: '', isUtility: true,
    description: 'Unrecognised pose',
  },
};

// Display order for the gesture legend
export const GESTURE_LIST: GestureId[] = [
  'FIST', 'BOTH_FISTS',
  'INDEX', 'PEACE', 'THREE', 'FOUR', 'OPEN_PALM',
  'THUMB_UP', 'THUMB_DOWN',
  'PINKY', 'ROCK',
  'L_SHAPE', 'SHAKA', 'ILY', 'THREE_THUMB', 'FOUR_THUMB',
  'BOTH_OPEN', 'BOTH_PEACE', 'BOTH_THUMB_UP',
];

// Legacy compat
export const FINGER_SENTENCES: Record<number, string> = {
  1: GESTURE_MAP.INDEX.phrase,
  2: GESTURE_MAP.PEACE.phrase,
  3: GESTURE_MAP.THREE.phrase,
  4: GESTURE_MAP.FOUR.phrase,
  5: GESTURE_MAP.OPEN_PALM.phrase,
};
