// ─────────────────────────────────────────────────────────────────────────────
// Gesture vocabulary — 20 distinct hand poses mapped to composable phrases
// 2 utility gestures (silent), 18 phrase gestures
// ─────────────────────────────────────────────────────────────────────────────

export type GestureId =
  // Utility (silent)
  | 'FIST'        // 0 fingers — delete last word
  | 'TWO_HANDS'   // both hands open — clear all
  // Phrases
  | 'INDEX'           // index only
  | 'PEACE'           // index + middle
  | 'THREE'           // index + middle + ring
  | 'FOUR'            // index + middle + ring + pinky
  | 'OPEN_PALM'       // all 5 (thumb + 4 fingers)
  | 'THUMB_UP'        // thumb only, pointing up
  | 'THUMB_DOWN'      // thumb only, pointing down
  | 'PINKY'           // pinky only
  | 'ROCK'            // index + pinky  (\m/)
  | 'SHAKA'           // thumb + pinky
  | 'L_SHAPE'         // thumb + index (spread)
  | 'ILY'             // thumb + index + pinky  (ASL "I Love You")
  | 'THREE_THUMB'     // thumb + index + middle
  | 'FOUR_THUMB'      // thumb + index + middle + ring
  | 'MIDDLE_ONLY'     // middle only
  | 'RING_ONLY'       // ring only
  | 'THUMB_MIDDLE'    // thumb + middle (skip index)
  | 'MIDDLE_RING'     // middle + ring (skip index)
  | 'RING_PINKY'      // ring + pinky  (skip index+middle)
  | 'UNKNOWN';

export interface GestureDefinition {
  id: GestureId;
  label: string;        // human-readable name
  emoji: string;        // representative emoji
  phrase: string;       // phrase to add to sentence builder (empty = silent utility)
  isUtility: boolean;   // if true: performs an action instead of speaking
  description: string;  // how to show the gesture
}

export const GESTURE_MAP: Record<GestureId, GestureDefinition> = {
  // ── Utility ──────────────────────────────────────────────────────────────
  FIST: {
    id: 'FIST', label: 'Fist', emoji: '✊',
    phrase: '', isUtility: true,
    description: 'Close all fingers into a fist',
  },
  TWO_HANDS: {
    id: 'TWO_HANDS', label: 'Both Hands', emoji: '🙌',
    phrase: '', isUtility: true,
    description: 'Show both open palms at the same time',
  },

  // ── Finger count (no thumb) ───────────────────────────────────────────────
  INDEX: {
    id: 'INDEX', label: '1 Finger', emoji: '☝️',
    phrase: 'Hello!', isUtility: false,
    description: 'Raise only your index finger',
  },
  PEACE: {
    id: 'PEACE', label: 'Peace / V', emoji: '✌️',
    phrase: 'How are you?', isUtility: false,
    description: 'Raise index + middle finger (peace sign)',
  },
  THREE: {
    id: 'THREE', label: '3 Fingers', emoji: '🤟',
    phrase: 'I am', isUtility: false,
    description: 'Raise index + middle + ring finger',
  },
  FOUR: {
    id: 'FOUR', label: '4 Fingers', emoji: '🖖',
    phrase: 'going to', isUtility: false,
    description: 'Raise index + middle + ring + pinky (no thumb)',
  },
  OPEN_PALM: {
    id: 'OPEN_PALM', label: 'Open Palm', emoji: '🖐️',
    phrase: 'Thank you!', isUtility: false,
    description: 'All 5 fingers spread open, palm facing camera',
  },

  // ── Thumb variants ────────────────────────────────────────────────────────
  THUMB_UP: {
    id: 'THUMB_UP', label: 'Thumbs Up', emoji: '👍',
    phrase: 'Yes,', isUtility: false,
    description: 'Only thumb extended, pointing upward',
  },
  THUMB_DOWN: {
    id: 'THUMB_DOWN', label: 'Thumbs Down', emoji: '👎',
    phrase: 'No,', isUtility: false,
    description: 'Only thumb extended, pointing downward',
  },

  // ── Single isolated fingers ───────────────────────────────────────────────
  PINKY: {
    id: 'PINKY', label: 'Pinky', emoji: '🤙',
    phrase: 'I need', isUtility: false,
    description: 'Extend only your pinky finger',
  },
  MIDDLE_ONLY: {
    id: 'MIDDLE_ONLY', label: 'Middle Finger', emoji: '🖕',
    phrase: "I'm sorry.", isUtility: false,
    description: 'Extend only your middle finger',
  },
  RING_ONLY: {
    id: 'RING_ONLY', label: 'Ring Finger', emoji: '💍',
    phrase: 'Can you', isUtility: false,
    description: 'Extend only your ring finger',
  },

  // ── Two-finger combos (no thumb) ──────────────────────────────────────────
  ROCK: {
    id: 'ROCK', label: 'Rock Sign', emoji: '🤘',
    phrase: 'Please,', isUtility: false,
    description: 'Index + pinky extended (rock/metal sign)',
  },
  MIDDLE_RING: {
    id: 'MIDDLE_RING', label: 'Middle + Ring', emoji: '🤞',
    phrase: "I'm not feeling well.", isUtility: false,
    description: 'Extend middle + ring fingers only',
  },
  RING_PINKY: {
    id: 'RING_PINKY', label: 'Ring + Pinky', emoji: '🤙',
    phrase: 'Water please.', isUtility: false,
    description: 'Extend ring + pinky fingers only',
  },

  // ── Thumb + finger combos ─────────────────────────────────────────────────
  L_SHAPE: {
    id: 'L_SHAPE', label: 'L-Shape', emoji: '👌',
    phrase: 'I want to', isUtility: false,
    description: 'Thumb + index extended forming an "L" shape',
  },
  SHAKA: {
    id: 'SHAKA', label: 'Shaka / Hang Loose', emoji: '🤙',
    phrase: 'No worries!', isUtility: false,
    description: 'Thumb + pinky extended (hang loose / shaka)',
  },
  THUMB_MIDDLE: {
    id: 'THUMB_MIDDLE', label: 'Thumb + Middle', emoji: '👋',
    phrase: 'Help me please.', isUtility: false,
    description: 'Extend thumb + middle finger (skip index)',
  },
  ILY: {
    id: 'ILY', label: 'I Love You', emoji: '🤟',
    phrase: 'I love you!', isUtility: false,
    description: 'Thumb + index + pinky extended (ASL "I Love You")',
  },
  THREE_THUMB: {
    id: 'THREE_THUMB', label: '3 + Thumb', emoji: '🤙',
    phrase: 'Good morning!', isUtility: false,
    description: 'Thumb + index + middle extended',
  },
  FOUR_THUMB: {
    id: 'FOUR_THUMB', label: '4 + Thumb', emoji: '🖐️',
    phrase: 'Goodbye!', isUtility: false,
    description: 'Thumb + index + middle + ring extended (no pinky)',
  },

  UNKNOWN: {
    id: 'UNKNOWN', label: 'Unknown', emoji: '❓',
    phrase: '', isUtility: true,
    description: 'Unrecognised pose',
  },
};

// Ordered list for the gesture legend display (utility first, then phrases)
export const GESTURE_LIST: GestureId[] = [
  'FIST', 'TWO_HANDS',
  'INDEX', 'PEACE', 'THREE', 'FOUR', 'OPEN_PALM',
  'THUMB_UP', 'THUMB_DOWN',
  'PINKY', 'MIDDLE_ONLY', 'RING_ONLY',
  'ROCK', 'MIDDLE_RING', 'RING_PINKY',
  'L_SHAPE', 'SHAKA', 'THUMB_MIDDLE',
  'ILY', 'THREE_THUMB', 'FOUR_THUMB',
];

// Legacy compat — keep old FINGER_SENTENCES import working
export const FINGER_SENTENCES: Record<number, string> = {
  1: GESTURE_MAP.INDEX.phrase,
  2: GESTURE_MAP.PEACE.phrase,
  3: GESTURE_MAP.THREE.phrase,
  4: GESTURE_MAP.FOUR.phrase,
  5: GESTURE_MAP.OPEN_PALM.phrase,
};
