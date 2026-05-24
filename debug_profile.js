import { ProfileManager } from './src/core/ProfileManager';
import { NodeType } from './src/assets/constants';

const profile = {
  xp: 0,
  level: 1,
  galaxy: 1,
  upgrades: {},
  unlockedThemes: ['deepSpace'],
  achievements: [],
  settings: {
    volume: 0.7,
    theme: 'deepSpace',
    muteSfx: false,
    disableVibration: false,
  },
};

console.log('Testing ProfileManager.addXP...');
const result = ProfileManager.addXP(profile as any, 100);
console.log('Result:', result);
console.log('New XP:', profile.xp);
console.log('New Level:', profile.level);

if (result.levelUp && profile.level === 2) {
  console.log('SUCCESS');
} else {
  console.log('FAILURE');
  process.exit(1);
}
