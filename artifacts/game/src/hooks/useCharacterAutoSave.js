import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Auto-saves character data every 10 seconds or when specific fields change
 * Prevents data loss on logout
 */
export function useCharacterAutoSave(character, enabled = true) {
  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef(null);

  useEffect(() => {
    if (!enabled || !character?.id) return;

    const hasSignificantChanges = () => {
      if (!lastSavedRef.current) return true;

      // Check if any significant fields have changed
      const fieldsToCheck = [
        'level', 'exp', 'gold', 'gems',
        'hp', 'mp', 'max_hp', 'max_mp',
        'strength', 'dexterity', 'intelligence', 'vitality', 'luck',
        'stat_points', 'skill_points',
        'current_region', 'idle_mode', 'is_banned', 'is_muted',
        'total_kills', 'total_damage'
      ];

      return fieldsToCheck.some(field => 
        character[field] !== lastSavedRef.current[field]
      );
    };

    const autoSave = async () => {
      if (!hasSignificantChanges()) return;

      try {
        // Save only the fields that matter
        const dataToSave = {
          level: character.level,
          exp: character.exp,
          gold: character.gold,
          gems: character.gems,
          hp: character.hp,
          mp: character.mp,
          max_hp: character.max_hp,
          max_mp: character.max_mp,
          strength: character.strength,
          dexterity: character.dexterity,
          intelligence: character.intelligence,
          vitality: character.vitality,
          luck: character.luck,
          stat_points: character.stat_points,
          skill_points: character.skill_points,
          current_region: character.current_region,
          idle_mode: character.idle_mode,
          is_banned: character.is_banned,
          is_muted: character.is_muted,
          total_kills: character.total_kills,
          total_damage: character.total_damage,
          last_idle_claim: character.last_idle_claim,
        };

        await base44.entities.Character.update(character.id, dataToSave);
        lastSavedRef.current = { ...character };
      } catch {
      }
    };

    // Save every 10 seconds
    saveTimerRef.current = setInterval(autoSave, 10000);

    // Also save on unmount
    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      autoSave(); // Final save
    };
  }, [character, enabled]);
}