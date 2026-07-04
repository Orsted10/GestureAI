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
  HELLO: { id: 'HELLO', label: 'Hello', emoji: '👋', phrase: 'Hello, how are you doing today?', isUtility: false, description: 'Right Open Palm' },
  THANK_YOU: { id: 'THANK_YOU', label: 'Thank You', emoji: '🙏', phrase: 'Thank you so much!', isUtility: false, description: 'Two Hands Open Palm' },
  GOOD: { id: 'GOOD', label: 'Good', emoji: '👍', phrase: 'That sounds really good to me.', isUtility: false, description: 'Right Thumb Up' },
  BAD: { id: 'BAD', label: 'Bad', emoji: '👎', phrase: 'I do not think that is a good idea.', isUtility: false, description: 'Right Thumb Down' },
  YES: { id: 'YES', label: 'Yes', emoji: '✅', phrase: 'Yes, I completely agree.', isUtility: false, description: 'Right Fist' },
  NO: { id: 'NO', label: 'No', emoji: '❌', phrase: 'No, I cannot do that right now.', isUtility: false, description: 'Right Index and Middle Up' },
  PLEASE: { id: 'PLEASE', label: 'Please', emoji: '🥺', phrase: 'Could you please help me with this?', isUtility: false, description: 'Right Open Palm, Left Fist' },
  SORRY: { id: 'SORRY', label: 'Sorry', emoji: '😔', phrase: 'I am so sorry about that.', isUtility: false, description: 'Right Fist, Left Open Palm' },
  HELP: { id: 'HELP', label: 'Help', emoji: '🆘', phrase: 'Excuse me, I need some help please.', isUtility: false, description: 'Right Thumb Up, Left Open Palm' },
  WAIT: { id: 'WAIT', label: 'Wait', emoji: '✋', phrase: 'Please wait a moment, I am still thinking.', isUtility: false, description: 'Left Open Palm' },
  STOP: { id: 'STOP', label: 'Stop', emoji: '🛑', phrase: 'Stop right there!', isUtility: false, description: 'Two Hands Open Palm (Wait)' },
  I_LOVE_YOU: { id: 'I_LOVE_YOU', label: 'I Love You', emoji: '🤟', phrase: 'I love you very much.', isUtility: false, description: 'Right ILY sign' },
  DONE: { id: 'DONE', label: 'Done', emoji: '🏁', phrase: 'I am completely finished with my work.', isUtility: false, description: 'Two Hands Fists' },
  MORE: { id: 'MORE', label: 'More', emoji: '➕', phrase: 'Could I please have some more?', isUtility: false, description: 'Right Pinch, Left Pinch' },
  EAT: { id: 'EAT', label: 'Eat', emoji: '🍔', phrase: 'I am really hungry, let us eat something.', isUtility: false, description: 'Right Pinch' },
  DRINK: { id: 'DRINK', label: 'Drink', emoji: '🥤', phrase: 'I am thirsty, can I get a drink?', isUtility: false, description: 'Right C-Shape (Thumb+Index)' },
  TIME: { id: 'TIME', label: 'Time', emoji: '⏰', phrase: 'Excuse me, could you tell me what time it is?', isUtility: false, description: 'Right Index, Left Fist' },
  WATER: { id: 'WATER', label: 'Water', emoji: '💧', phrase: 'Can I please have a glass of water?', isUtility: false, description: 'Right Three Fingers' },
  TOILET: { id: 'TOILET', label: 'Toilet', emoji: '🚽', phrase: 'Could you please point me to the washroom?', isUtility: false, description: 'Right Rock Sign' },
  FRIEND: { id: 'FRIEND', label: 'Friend', emoji: '🤝', phrase: 'You are a very good friend of mine.', isUtility: false, description: 'Right Index, Left Index' },
  HOUSE: { id: 'HOUSE', label: 'House', emoji: '🏠', phrase: 'I want to go back to my house now.', isUtility: false, description: 'Right Pinky, Left Pinky' },
  CAR: { id: 'CAR', label: 'Car', emoji: '🚗', phrase: 'Let us take the car and go for a drive.', isUtility: false, description: 'Right Fist, Left Fist' },
  LATE: { id: 'LATE', label: 'Late', emoji: '⏳', phrase: 'I am running a bit late, sorry!', isUtility: false, description: 'Right L-Shape' },
  PERFECT: { id: 'PERFECT', label: 'Perfect', emoji: '👌', phrase: 'That is absolutely perfect, thank you.', isUtility: false, description: 'Right Shaka' },
  MONEY: { id: 'MONEY', label: 'Money', emoji: '💰', phrase: 'How much money does this cost?', isUtility: false, description: 'Right Pinch, Left Open Palm' },
  UNKNOWN: { id: 'UNKNOWN', label: 'Unknown', emoji: '❓', phrase: '', isUtility: true, description: 'Unrecognised pose' },
};
