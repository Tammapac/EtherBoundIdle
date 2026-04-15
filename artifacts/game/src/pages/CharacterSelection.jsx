import { apiFetch } from "../api/client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import PixelButton from "@/components/game/PixelButton";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, LogOut, Shield, Swords, Star, AlertTriangle
} from "lucide-react";
import { CLASSES } from "@/lib/gameData";
import { useAuth } from "@/lib/AuthContext";
import { CLASS_SPRITE_URLS } from "@/lib/pixelSprites";

export default function CharacterSelection({ onCharacterSelected }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  const { data: characters = [], isLoading, isError, error } = useQuery({
    queryKey: ["characters", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const filter = JSON.stringify({ created_by: user.id });
      const chars = await apiFetch(`/entities/Character?filter=${encodeURIComponent(filter)}`);
      return chars || [];
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 0,
    cacheTime: 0,
  });

  const selectMutation = useMutation({
    mutationFn: async (character) => {
      // Simply pass the selected character to parent
      onCharacterSelected(character);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (characterId) => {
    await apiFetch(`/entities/Character/${characterId}`, {
    method: "DELETE"
});

      queryClient.invalidateQueries({ queryKey: ["characters"] });
      setDeleteConfirm(null);
    },
  });

  const maxCharacters = 5;
  const canCreateMore = characters.length < maxCharacters;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-orbitron text-4xl font-bold text-primary tracking-wider mb-2">
            SELECT CHARACTER
          </h1>
          <p className="text-muted-foreground">
            Choose your hero or create a new one
          </p>
        </div>

        {/* Characters Grid */}
        <div className="space-y-3 mb-6">
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          <AnimatePresence>
            {characters.map((char) => {
              const cls = CLASSES[char.class];
              const spriteUrl = CLASS_SPRITE_URLS[char.class] || CLASS_SPRITE_URLS.warrior;
              return (
                <motion.div
                  key={char.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-lg ${cls?.color} bg-opacity-20 border border-current border-opacity-30 flex items-center justify-center overflow-hidden`}>
                      <img src={spriteUrl} alt={char.class} className="w-10 h-10" style={{ imageRendering: "pixelated" }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{char.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`${cls?.color}`}>
                          Lv.{char.level} {cls?.name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {(char.total_kills || 0).toLocaleString()} kills
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <PixelButton
                      variant="ok"
                      label="PLAY"
                      onClick={() => selectMutation.mutate(char)}
                      disabled={selectMutation.isPending}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteConfirm(char)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!isLoading && characters.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No characters yet. Create one to begin your journey.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          {canCreateMore && (
            <PixelButton
              variant="ok"
              label="CREATE CHARACTER"
              onClick={() => onCharacterSelected(null)}
            />
          )}
          <PixelButton
            variant="cancel"
            label="LOGOUT"
            onClick={() => logout()}
          />
        </div>

        {characters.length >= maxCharacters && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Character limit reached ({maxCharacters})
          </p>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card border border-destructive/30 rounded-xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h3 className="font-bold text-lg">Delete Character?</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Are you sure you want to delete <span className="font-semibold text-foreground">{deleteConfirm.name}</span>?
              </p>
              <p className="text-xs text-destructive/80 mb-6">
                This action cannot be undone. All items and progress will be lost.
              </p>
              <div className="flex gap-3 justify-center">
                <PixelButton variant="cancel" onClick={() => setDeleteConfirm(null)} />
                <PixelButton variant="ok" onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
