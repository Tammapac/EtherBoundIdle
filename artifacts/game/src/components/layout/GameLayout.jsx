import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Swords, Shield, Backpack, Map, Users, ShoppingBag,
  Trophy, ScrollText, Menu, X, Coins, Gem, MessageCircle,
  LogOut, RotateCcw, Leaf, ChevronDown, BarChart3, Wrench, Skull, Zap, Settings,
  ArrowUp, Star, PawPrint, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import RoleBadge from "@/components/game/RoleBadge";
import CharacterProfileModal from "@/components/game/CharacterProfileModal";
import IdleStatusBar from "@/components/game/IdleStatusBar";
import ActiveBuffsBar from "@/components/game/ActiveBuffsBar";

const NAV_ITEMS = [
  { path: "/", icon: Swords, label: "Battle" },
  { path: "/inventory", icon: Backpack, label: "Inventory" },
  { path: "/world", icon: Map, label: "World" },
  { path: "/guild", icon: Users, label: "Guild" },
  { path: "/shop", icon: ShoppingBag, label: "Shop" },
  { path: "/quests", icon: ScrollText, label: "Quests" },
  { path: "/leaderboard", icon: Trophy, label: "Ranking" },
  { path: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { path: "/social", icon: MessageCircle, label: "Social" },
  { path: "/lifeskills", icon: Leaf, label: "Life Skills" },
  { path: "/gearupgrading", icon: Wrench, label: "Forge" },
  { path: "/dungeons", icon: Skull, label: "Dungeons" },
  { path: "/skilltree", icon: Zap, label: "Skill Tree" },
  { path: "/runes", icon: Gem, label: "Runes" },
  { path: "/admin", icon: Shield, label: "Admin", admin: true },
  { path: "/gameconfig", icon: Settings, label: "Game Config", admin: true },
];

export default function GameLayout({ character, onCharacterUpdate, onBackToSelection }) {
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const loadUserRole = async () => {
      try {
        const response = await base44.functions.invoke("getCurrentUser", {});
        setCurrentUserRole(response?.role);
      } catch (e) {
        console.log("Could not fetch user role");
      }
    };
    loadUserRole();
  }, []);

  // Clean up presence and party on tab close / logout
  const cleanupOnLeave = React.useCallback(async () => {
    if (!character?.id) return;
    try {
      // Set presence to offline
      const presences = await base44.entities.Presence.filter({ character_id: character.id });
      if (presences[0]) {
        base44.entities.Presence.update(presences[0].id, { status: "offline" }).catch(() => {});
      }
      // Leave party
      base44.functions.invoke("manageParty", {
        characterId: character.id,
        action: "leave",
      }).catch(() => {});
    } catch {}
  }, [character?.id]);

  React.useEffect(() => {
    if (!character?.id) return;
    const handleUnload = () => {
      // Use sendBeacon for reliable delivery on page close
      const token = localStorage.getItem("auth_token") || "";
      const baseUrl = import.meta.env.VITE_API_URL || "";
      navigator.sendBeacon(
        `${baseUrl}/api/functions/cleanupOnDisconnect`,
        new Blob([JSON.stringify({ characterId: character.id, token })], { type: "application/json" })
      );
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [character?.id]);

  const handleLogout = async () => {
    await cleanupOnLeave();
    logout();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-sm">
        <div className="p-4 border-b border-border">
          <h1 className="font-orbitron text-xl font-bold text-primary tracking-wider">
            IDLE REALM
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Online MMORPG</p>
        </div>

        {character && (
          <div className="p-4 border-b border-border">
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-3 w-full hover:bg-muted/50 rounded-lg p-1 -m-1 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:border-primary/60 transition-colors">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm truncate">{character.name}</p>
                  <RoleBadge role={currentUserRole} />
                </div>
                <p className="text-xs text-muted-foreground">Lv.{character.level} {character.class}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
            <div className="flex gap-3 mt-3 text-xs">
              <span className="flex items-center gap-1 text-accent">
                <Coins className="w-3 h-3" /> {(character.gold || 0).toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-secondary">
                <Gem className="w-3 h-3" /> {character.gems || 0}
              </span>
            </div>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
           {NAV_ITEMS.map(({ path, icon: Icon, label, admin }) => {
              // Hide admin link if user is not admin
              if (admin && currentUserRole !== "admin" && currentUserRole !== "superadmin") return null;

              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-primary/15 text-primary glow-cyan"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

        <div className="p-3 border-t border-border space-y-2">
          <Button
            variant="outline"
            className="w-full gap-2 text-xs justify-start"
            onClick={onBackToSelection}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Character Selection
          </Button>
          <Button
            variant="ghost"
            className="w-full gap-2 text-xs justify-start text-destructive hover:text-destructive"
            onClick={() => handleLogout()}
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-3 border-b border-border bg-card/50">
          <h1 className="font-orbitron text-lg font-bold text-primary">IDLE REALM</h1>
          <div className="flex items-center gap-2">
            {character && (
              <>
                <span className="flex items-center gap-1 text-xs text-accent">
                  <Coins className="w-3 h-3" /> {(character.gold || 0).toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-xs text-secondary">
                  <Gem className="w-3 h-3" /> {character.gems || 0}
                </span>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </header>

        {/* Mobile Nav Overlay */}
         {mobileOpen && (
            <div className="md:hidden absolute inset-0 z-50 bg-background/95 backdrop-blur-sm pt-16">
              <nav className="p-4 space-y-2">
                {NAV_ITEMS.map(({ path, icon: Icon, label, admin }) => {
                  if (admin && currentUserRole !== "admin" && currentUserRole !== "superadmin") return null;
                  return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                      location.pathname === path
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </Link>
                );
                })}
               <div className="border-t border-border mt-4 pt-4 space-y-2">
                 <Button
                   variant="outline"
                   className="w-full gap-2 justify-start"
                   onClick={() => {
                     setMobileOpen(false);
                     onBackToSelection();
                   }}
                 >
                   <RotateCcw className="w-4 h-4" /> Character Selection
                 </Button>
                 <Button
                   variant="ghost"
                   className="w-full gap-2 justify-start text-destructive hover:text-destructive"
                   onClick={() => handleLogout()}
                 >
                   <LogOut className="w-4 h-4" /> Logout
                 </Button>
               </div>
             </nav>
           </div>
         )}

        {character && <IdleStatusBar character={character} />}
        {character && <ActiveBuffsBar character={character} />}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative">
          {/* Feature quick-access icons — global, shown on all pages */}
          <div className="fixed top-16 left-4 md:left-[17rem] z-30 flex gap-2">
            <div
              onClick={() => navigate("/tower")}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-600/20 border-2 border-amber-500/50 flex flex-col items-center justify-center cursor-pointer hover:scale-110 hover:border-amber-400 hover:from-amber-500/40 hover:to-orange-500/30 transition-all shadow-lg shadow-amber-500/20 group"
              title="Tower of Trials"
            >
              <ArrowUp className="w-6 h-6 text-amber-400 group-hover:text-amber-300 transition-colors" />
              <span className="text-[8px] font-bold text-amber-400/80 group-hover:text-amber-300 mt-0.5 tracking-wide">TOWER</span>
            </div>
            <div
              onClick={() => navigate("/seasonpass")}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-600/20 border-2 border-purple-500/50 flex flex-col items-center justify-center cursor-pointer hover:scale-110 hover:border-purple-400 hover:from-purple-500/40 hover:to-pink-500/30 transition-all shadow-lg shadow-purple-500/20 group"
              title="Battle Pass"
            >
              <Star className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors" />
              <span className="text-[8px] font-bold text-purple-400/80 group-hover:text-purple-300 mt-0.5 tracking-wide">PASS</span>
            </div>
            <div
              onClick={() => navigate("/pets")}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-teal-600/20 border-2 border-cyan-500/50 flex flex-col items-center justify-center cursor-pointer hover:scale-110 hover:border-cyan-400 hover:from-cyan-500/40 hover:to-teal-500/30 transition-all shadow-lg shadow-cyan-500/20 group"
              title="Pet Companions"
            >
              <PawPrint className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
              <span className="text-[8px] font-bold text-cyan-400/80 group-hover:text-cyan-300 mt-0.5 tracking-wide">PETS</span>
            </div>
            <div
              onClick={() => navigate("/portal")}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/30 to-indigo-600/20 border-2 border-violet-500/50 flex flex-col items-center justify-center cursor-pointer hover:scale-110 hover:border-violet-400 hover:from-violet-500/40 hover:to-indigo-500/30 transition-all shadow-lg shadow-violet-500/20 group"
              title="Infinite Portal"
            >
              <Sparkles className="w-6 h-6 text-violet-400 group-hover:text-violet-300 transition-colors" />
              <span className="text-[8px] font-bold text-violet-400/80 group-hover:text-violet-300 mt-0.5 tracking-wide">PORTAL</span>
            </div>
            <div
              onClick={() => navigate("/worldboss")}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/30 to-amber-600/20 border-2 border-red-500/50 flex flex-col items-center justify-center cursor-pointer hover:scale-110 hover:border-red-400 hover:from-red-500/40 hover:to-amber-500/30 transition-all shadow-lg shadow-red-500/20 group"
              title="World Boss"
            >
              <Skull className="w-6 h-6 text-red-400 group-hover:text-red-300 transition-colors" />
              <span className="text-[8px] font-bold text-red-400/80 group-hover:text-red-300 mt-0.5 tracking-wide">BOSS</span>
            </div>
          </div>
          <Outlet />
        </main>
      </div>

      {/* Character Profile Modal */}
      {profileOpen && character && (
        <CharacterProfileModal
          character={character}
          onCharacterUpdate={onCharacterUpdate}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </div>
  );
}