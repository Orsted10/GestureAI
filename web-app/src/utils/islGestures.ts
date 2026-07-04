import { GestureId } from './fingerGestures';

export type ISLWordId =
  | 'HELLO' | 'THANK_YOU' | 'GOOD' | 'BAD' | 'YES' | 'NO'
  | 'PLEASE' | 'SORRY' | 'HELP' | 'WAIT' | 'STOP' | 'I_LOVE_YOU'
  | 'DONE' | 'MORE' | 'EAT' | 'DRINK' | 'TIME' | 'WATER'
  | 'TOILET' | 'FRIEND' | 'HOUSE' | 'CAR' | 'LATE' | 'PERFECT' | 'MONEY'
  | 'UNKNOWN';

export interface ISLDefinition {
  id: ISLWordId;
  label: string;
  emoji: string;
  phrase: string;
  isUtility: boolean;
  description: string;
}

export const ISL_MAP: Record<ISLWordId, ISLDefinition> = {
  HELLO: { id: 'HELLO', label: 'Hello', emoji: '👋', phrase: 'Hello', isUtility: false, description: 'Right Open Palm' },
  THANK_YOU: { id: 'THANK_YOU', label: 'Thank You', emoji: '🙏', phrase: 'Thank you', isUtility: false, description: 'Two Hands Open Palm' },
  GOOD: { id: 'GOOD', label: 'Good', emoji: '👍', phrase: 'Good', isUtility: false, description: 'Right Thumb Up' },
  BAD: { id: 'BAD', label: 'Bad', emoji: '👎', phrase: 'Bad', isUtility: false, description: 'Right Thumb Down' },
  YES: { id: 'YES', label: 'Yes', emoji: '✅', phrase: 'Yes', isUtility: false, description: 'Right Fist' },
  NO: { id: 'NO', label: 'No', emoji: '❌', phrase: 'No', isUtility: false, description: 'Right Index and Middle Up' },
  PLEASE: { id: 'PLEASE', label: 'Please', emoji: '🥺', phrase: 'Please', isUtility: false, description: 'Right Open Palm, Left Fist' },
  SORRY: { id: 'SORRY', label: 'Sorry', emoji: '😔', phrase: 'Sorry', isUtility: false, description: 'Right Fist, Left Open Palm' },
  HELP: { id: 'HELP', label: 'Help', emoji: '🆘', phrase: 'Help', isUtility: false, description: 'Right Thumb Up, Left Open Palm' },
  WAIT: { id: 'WAIT', label: 'Wait', emoji: '✋', phrase: 'Wait', isUtility: false, description: 'Left Open Palm' },
  STOP: { id: 'STOP', label: 'Stop', emoji: '🛑', phrase: 'Stop', isUtility: false, description: 'Two Hands Open Palm (Wait)' },
  I_LOVE_YOU: { id: 'I_LOVE_YOU', label: 'I Love You', emoji: '🤟', phrase: 'I love you', isUtility: false, description: 'Right ILY sign' },
  DONE: { id: 'DONE', label: 'Done', emoji: '🏁', phrase: 'Done', isUtility: false, description: 'Two Hands Fists' },
  MORE: { id: 'MORE', label: 'More', emoji: '➕', phrase: 'More', isUtility: false, description: 'Right Pinch, Left Pinch' },
  EAT: { id: 'EAT', label: 'Eat', emoji: '🍔', phrase: 'Eat', isUtility: false, description: 'Right Pinch' },
  DRINK: { id: 'DRINK', label: 'Drink', emoji: '🥤', phrase: 'Drink', isUtility: false, description: 'Right C-Shape (Thumb+Index)' },
  TIME: { id: 'TIME', label: 'Time', emoji: '⏰', phrase: 'Time', isUtility: false, description: 'Right Index, Left Fist' },
  WATER: { id: 'WATER', label: 'Water', emoji: '💧', phrase: 'Water', isUtility: false, description: 'Right Three Fingers' },
  TOILET: { id: 'TOILET', label: 'Toilet', emoji: '🚽', phrase: 'Toilet', isUtility: false, description: 'Right Rock Sign' },
  FRIEND: { id: 'FRIEND', label: 'Friend', emoji: '🤝', phrase: 'Friend', isUtility: false, description: 'Right Index, Left Index' },
  HOUSE: { id: 'HOUSE', label: 'House', emoji: '🏠', phrase: 'House', isUtility: false, description: 'Right Pinky, Left Pinky' },
  CAR: { id: 'CAR', label: 'Car', emoji: '🚗', phrase: 'Car', isUtility: false, description: 'Right Fist, Left Fist' },
  LATE: { id: 'LATE', label: 'Late', emoji: '⏳', phrase: 'Late', isUtility: false, description: 'Right L-Shape' },
  PERFECT: { id: 'PERFECT', label: 'Perfect', emoji: '👌', phrase: 'Perfect', isUtility: false, description: 'Right Shaka' },
  MONEY: { id: 'MONEY', label: 'Money', emoji: '💰', phrase: 'Money', isUtility: false, description: 'Right Pinch, Left Open Palm' },
  UNKNOWN: { id: 'UNKNOWN', label: 'Unknown', emoji: '❓', phrase: '', isUtility: true, description: 'Unrecognised pose' },
};
