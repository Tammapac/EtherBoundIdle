import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const SAVE_FIELDS = [
  'level', 'exp', 'gold', 'gems',
  'hp', 'mp', 'max_hp', 'max_mp',
  'strength', 'dexterity', 'intelligence', 'vitality', 'luck',
  'stat_points', 'skill_points',
  'current_region', 'idle_mode', 'is_banned', 'is_muted',
  'total_kills', 'total_damage',
  'last_idle_claim',
  'equipment', 'life_skills', 'skill_tree_data',
  'daily_login_streak', 'last_daily_login',
];

function hasChanges(char, lastSaved) {
  if (!lastSaved || !char) return !!char;
  return SAVE_FIELDS.some(f => {
    const a = char[f];
    const b = lastSaved[f];
    if (a === b) return false;
    if (typeof a === 'object' || typeof b === 'object') {
      return JSON.stringify(a) !== JSON.stringify(b);
    }
    return true;
  });
}

async function doSave(char, lastSavedRef) {
  if (!char?.id) return;
  if (!hasChanges(char, lastSavedRef.current)) return;
  const data = {};
  SAVE_FIELDS.forEach(f => {
    if (char[f] !== undefined) data[f] = char[f];
  });
  try {
    await base44.entities.Character.update(char.id, data);
    lastSavedRef.current = { ...char };
  } catch (e) {
    console.warn('[AutoSave] failed:', e.message);
  }
}

export function useCharacterAutoSave(character, enabled = true) {
  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef(null);
  const pendingSaveRef = useRef(null);

  useEffect(() => {
    if (!enabled || !character?.id) return;
    pendingSaveRef.current = character;

    saveTimerRef.current = setInterval(() => {
      if (pendingSaveRef.current) doSave(pendingSaveRef.current, lastSavedRef);
    }, 10000);

    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      if (pendingSaveRef.current) doSave(pendingSaveRef.current, lastSavedRef);
    };
  }, [character?.id, enabled]);

  useEffect(() => {
    pendingSaveRef.current = character;
  }, [character]);

  return { saveNow: () => doSave(character, lastSavedRef) };
}