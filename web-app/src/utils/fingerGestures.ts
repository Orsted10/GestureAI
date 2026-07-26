// ─────────────────────────────────────────────────────────────────────────────
// Reliable gesture vocabulary — only gestures that are geometrically distinct
// and easy for a human to hold stably.
// ─────────────────────────────────────────────────────────────────────────────

export type GestureId =
  // ── Utility (silent, no TTS) ─────────────────────────────────────────────
  | 'FIST'          // ✊ one hand fist → delete last word
  | 'BOTH_FISTS'    // 🤜🤛 both fists → clear all
  | 'INDEX'         // ☝️  index only → Speak Sentence
  | 'FOUR'          // 🖖 4 fingers → Cycle Modes
  | 'PINKY'         // 🤙 pinky only → Polish Grammar
  
  // ── Single Hand Orientations ──────────────────────────────────────────────
  | 'FIST_DOWN'
  | 'OPEN_PALM'
  | 'OPEN_PALM_DOWN'
  
  // ── Single Finger ────────────────────────────────────────────────────────
  | 'INDEX_DOWN'
  | 'INDEX_SIDE'
  | 'THUMB_UP'
  | 'THUMB_DOWN'
  | 'THUMB_SIDE'
  
  // ── Multi-Finger ─────────────────────────────────────────────────────────
  | 'PEACE'
  | 'PEACE_DOWN'
  | 'THREE'
  | 'THREE_DOWN'
  | 'ROCK'
  | 'ROCK_DOWN'
  | 'C_SHAPE'
  | 'O_SHAPE'
  | 'CROSSED_FINGERS'
  
  // ── Thumb + Finger combos ────────────────────────────────────────────────
  | 'SHAKA'
  | 'L_SHAPE'
  | 'L_SHAPE_DOWN'
  | 'ILY'
  | 'THREE_THUMB'
  | 'FOUR_THUMB'

  // ── Two-hand gestures ────────────────────────────────────────────────────
  | 'BOTH_OPEN'
  | 'BOTH_PEACE'
  | 'BOTH_THUMB_UP'
  | 'BOTH_THUMB_DOWN'
  | 'BOTH_INDEX'
  | 'BOTH_ROCK'
  
  | 'UNKNOWN';

export interface GestureDefinition {
  id: GestureId;
  label: string;
  emoji: string;
  phrase: string;
  sentence?: string;
  isUtility: boolean;
  description: string;
}

export const GESTURE_MAP: Record<GestureId, GestureDefinition> = {
  // ── Utility ──────────────────────────────────────────────────────────────
  FIST: { id: 'FIST', label: 'Fist', emoji: '✊', phrase: '', sentence: '', isUtility: true, description: 'Close ALL fingers into a fist' },
  BOTH_FISTS: { id: 'BOTH_FISTS', label: 'Both Fists', emoji: '🤜🤛', phrase: '', sentence: '', isUtility: true, description: 'Make a fist with BOTH hands' },
  INDEX: { id: 'INDEX', label: 'Speak Sentence', emoji: '☝️', phrase: '', sentence: '', isUtility: true, description: 'System Action: Triggers AI Voice' },
  FOUR: { id: 'FOUR', label: 'Cycle Modes', emoji: '🖖', phrase: '', sentence: '', isUtility: true, description: 'System Action: Cycles Modes' },
  PINKY: { id: 'PINKY', label: 'Polish Grammar', emoji: '🤙', phrase: '', sentence: '', isUtility: true, description: 'System Action: Triggers AI polish' },

  // ── Orientations ─────────────────────────────────────────────────────────
  FIST_DOWN: { id: 'FIST_DOWN', label: 'Fist Down', emoji: '✊', phrase: 'Drop', sentence: 'I want to drop this.', isUtility: false, description: 'Fist pointing downward' },
  OPEN_PALM: { id: 'OPEN_PALM', label: 'Open Palm (all 5)', emoji: '🖐️', phrase: 'Stop', sentence: 'Stop right there!', isUtility: false, description: 'All 5 fingers spread open UP' },
  OPEN_PALM_DOWN: { id: 'OPEN_PALM_DOWN', label: 'Palm Down', emoji: '🫳', phrase: 'Wait', sentence: 'Please wait a moment.', isUtility: false, description: 'All 5 fingers pointing DOWN' },

  // ── Single Finger ────────────────────────────────────────────────────────
  INDEX_DOWN: { id: 'INDEX_DOWN', label: 'Index Down', emoji: '👇', phrase: 'Here', sentence: 'It is right here.', isUtility: false, description: 'Index pointing down' },
  INDEX_SIDE: { id: 'INDEX_SIDE', label: 'Index Side', emoji: '👉', phrase: 'There', sentence: 'Look over there.', isUtility: false, description: 'Index pointing left or right' },
  THUMB_UP: { id: 'THUMB_UP', label: 'Thumbs Up', emoji: '👍', phrase: 'Yes', sentence: 'Yes, I completely agree with you.', isUtility: false, description: 'Thumb pointing UP' },
  THUMB_DOWN: { id: 'THUMB_DOWN', label: 'Thumbs Down', emoji: '👎', phrase: 'No', sentence: 'No, I do not think that is correct.', isUtility: false, description: 'Thumb pointing DOWN' },
  THUMB_SIDE: { id: 'THUMB_SIDE', label: 'Thumb Side', emoji: '🫲', phrase: 'Maybe', sentence: 'Maybe later.', isUtility: false, description: 'Thumb pointing sideways' },

  // ── Multi-Finger ─────────────────────────────────────────────────────────
  PEACE: { id: 'PEACE', label: 'Peace Sign (V)', emoji: '✌️', phrase: 'Peace', sentence: 'Are you doing okay today?', isUtility: false, description: 'Index + middle up' },
  PEACE_DOWN: { id: 'PEACE_DOWN', label: 'Peace Down', emoji: '✌️', phrase: 'Look', sentence: 'Look down here.', isUtility: false, description: 'Index + middle pointing down' },
  THREE: { id: 'THREE', label: '3 Fingers', emoji: '🖖', phrase: 'I am', sentence: 'I am feeling really good today.', isUtility: false, description: 'Index + middle + ring up' },
  THREE_DOWN: { id: 'THREE_DOWN', label: '3 Fingers Down', emoji: '👇', phrase: 'Hide', sentence: 'I want to hide this.', isUtility: false, description: 'Index + middle + ring down' },
  ROCK: { id: 'ROCK', label: 'Rock', emoji: '🤘', phrase: 'Awesome', sentence: 'That is awesome!', isUtility: false, description: 'Index + pinky up' },
  ROCK_DOWN: { id: 'ROCK_DOWN', label: 'Rock Down', emoji: '🤘', phrase: 'Heavy', sentence: 'This is heavy.', isUtility: false, description: 'Index + pinky down' },
  C_SHAPE: { id: 'C_SHAPE', label: 'C-Shape', emoji: '🗜️', phrase: 'Drink', sentence: 'I need a drink.', isUtility: false, description: 'Thumb + index curved' },
  O_SHAPE: { id: 'O_SHAPE', label: 'O-Shape', emoji: '👌', phrase: 'Perfect', sentence: 'That is absolutely perfect!', isUtility: false, description: 'Thumb + index touching' },
  CROSSED_FINGERS: { id: 'CROSSED_FINGERS', label: 'Crossed', emoji: '🤞', phrase: 'Hope', sentence: 'I hope it works.', isUtility: false, description: 'Index and middle crossed' },

  // ── Thumb + Finger combos ────────────────────────────────────────────────
  SHAKA: { id: 'SHAKA', label: 'Shaka', emoji: '🤙', phrase: 'Relax', sentence: 'No worries, everything is fine!', isUtility: false, description: 'Thumb + pinky' },
  L_SHAPE: { id: 'L_SHAPE', label: 'L-Shape', emoji: '🫲', phrase: 'Loser', sentence: 'That was a bad idea.', isUtility: false, description: 'Thumb + index L' },
  L_SHAPE_DOWN: { id: 'L_SHAPE_DOWN', label: 'L-Shape Down', emoji: '🫳', phrase: 'Small', sentence: 'It is very small.', isUtility: false, description: 'Thumb + index L pointing down' },
  ILY: { id: 'ILY', label: 'I Love You', emoji: '🤟', phrase: 'I love you', sentence: 'I love you very much.', isUtility: false, description: 'Thumb + index + pinky' },
  THREE_THUMB: { id: 'THREE_THUMB', label: 'Thumb + 2 fingers', emoji: '🤙', phrase: 'Good morning', sentence: 'Good morning to you!', isUtility: false, description: 'Thumb + index + middle' },
  FOUR_THUMB: { id: 'FOUR_THUMB', label: '4 fingers + thumb', emoji: '🖐️', phrase: 'Goodbye', sentence: 'Goodbye, have a great day!', isUtility: false, description: 'Thumb + index + middle + ring' },

  // ── Two-hand gestures ─────────────────────────────────────────────────────
  BOTH_OPEN: { id: 'BOTH_OPEN', label: 'Both Open Palms', emoji: '🙌', phrase: 'Wonderful', sentence: 'That is absolutely wonderful!', isUtility: false, description: 'BOTH open palms' },
  BOTH_PEACE: { id: 'BOTH_PEACE', label: 'Double Peace', emoji: '✌️✌️', phrase: 'No problem', sentence: 'No problem at all!', isUtility: false, description: 'Peace sign BOTH hands' },
  BOTH_THUMB_UP: { id: 'BOTH_THUMB_UP', label: 'Double Thumbs Up', emoji: '👍👍', phrase: 'Amazing', sentence: 'That is absolutely amazing!', isUtility: false, description: 'Thumbs up BOTH' },
  BOTH_THUMB_DOWN: { id: 'BOTH_THUMB_DOWN', label: 'Double Thumbs Down', emoji: '👎👎', phrase: 'Terrible', sentence: 'That is terrible!', isUtility: false, description: 'Thumbs down BOTH' },
  BOTH_INDEX: { id: 'BOTH_INDEX', label: 'Both Index', emoji: '☝️☝️', phrase: 'Together', sentence: 'Let us go together.', isUtility: false, description: 'Index fingers BOTH' },
  BOTH_ROCK: { id: 'BOTH_ROCK', label: 'Both Rock', emoji: '🤘🤘', phrase: 'Party', sentence: 'Let us party!', isUtility: false, description: 'Rock BOTH' },

  UNKNOWN: { id: 'UNKNOWN', label: 'Unknown', emoji: '❓', phrase: '', isUtility: true, description: 'Unrecognised' },
};

export const GESTURE_LIST: GestureId[] = Object.keys(GESTURE_MAP) as GestureId[];

export const FINGER_SENTENCES: Record<number, string> = {};
export interface IDEGestureDefinition {
  id: GestureId;
  label: string;
  emoji: string;
  code: string;
  description: string;
}

export const IDE_MAP: Partial<Record<GestureId, IDEGestureDefinition>> = {
  // Utility
  FIST: { id: 'FIST', label: 'Delete', emoji: '✊', code: 'BACKSPACE', description: 'Delete last token' },
  BOTH_FISTS: { id: 'BOTH_FISTS', label: 'Clear All', emoji: '🤜🤛', code: 'CLEAR', description: 'Clear IDE' },
  INDEX: { id: 'INDEX', label: 'Execute', emoji: '☝️', code: 'RUN', description: 'Run Python Code' },
  
  // Syntax
  OPEN_PALM: { id: 'OPEN_PALM', label: 'Print', emoji: '🖐️', code: 'print("Hello, World!")\n', description: 'print()' },
  THUMB_UP: { id: 'THUMB_UP', label: 'True', emoji: '👍', code: 'True', description: 'Boolean True' },
  THUMB_DOWN: { id: 'THUMB_DOWN', label: 'False', emoji: '👎', code: 'False', description: 'Boolean False' },
  PEACE: { id: 'PEACE', label: 'Return', emoji: '✌️', code: 'return ', description: 'return statement' },
  ROCK: { id: 'ROCK', label: 'If', emoji: '🤘', code: 'if ', description: 'if statement' },
  L_SHAPE: { id: 'L_SHAPE', label: 'Def', emoji: '🫲', code: 'def ', description: 'def function' },
  C_SHAPE: { id: 'C_SHAPE', label: 'Class', emoji: '🗜️', code: 'class ', description: 'class definition' },
  O_SHAPE: { id: 'O_SHAPE', label: 'For Loop', emoji: '👌', code: 'for i in range(10):\n    ', description: 'for loop' },
  CROSSED_FINGERS: { id: 'CROSSED_FINGERS', label: 'Try/Except', emoji: '🤞', code: 'try:\n    \nexcept Exception as e:\n    ', description: 'Try/Except block' },
  THREE: { id: 'THREE', label: 'Import Math', emoji: '🖖', code: 'import math\n', description: 'import math' },
  SHAKA: { id: 'SHAKA', label: 'Import Time', emoji: '🤙', code: 'import time\n', description: 'import time' },
  ILY: { id: 'ILY', label: 'Self', emoji: '🤟', code: 'self', description: 'self keyword' },
  INDEX_SIDE: { id: 'INDEX_SIDE', label: 'Indent', emoji: '👉', code: '    ', description: 'Add indentation' },
  INDEX_DOWN: { id: 'INDEX_DOWN', label: 'Newline', emoji: '👇', code: '\n', description: 'Add newline' },
  BOTH_OPEN: { id: 'BOTH_OPEN', label: 'Main', emoji: '🙌', code: 'if __name__ == "__main__":\n    ', description: 'Main execution block' },
  BOTH_PEACE: { id: 'BOTH_PEACE', label: 'Equals', emoji: '✌️✌️', code: ' = ', description: 'Assignment operator' },
  BOTH_THUMB_UP: { id: 'BOTH_THUMB_UP', label: 'Plus', emoji: '👍👍', code: ' + ', description: 'Addition operator' },
  BOTH_THUMB_DOWN: { id: 'BOTH_THUMB_DOWN', label: 'Minus', emoji: '👎👎', code: ' - ', description: 'Subtraction operator' },
  BOTH_ROCK: { id: 'BOTH_ROCK', label: 'Multiply', emoji: '🤘🤘', code: ' * ', description: 'Multiplication operator' },
};
