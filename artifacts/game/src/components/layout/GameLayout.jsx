import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Swords, Shield, Backpack, Map, Users, ShoppingBag,
  Trophy, ScrollText, Menu, X, Coins, Gem, MessageCircle,
  LogOut, RotateCcw, Leaf, ChevronDown, BarChart3, Wrench, Skull, Zap, Settings,
  ArrowUp, Star, PawPrint, Sparkles, Wheat
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import RoleBadge from "@/components/game/RoleBadge";
import CharacterProfileModal from "@/components/game/CharacterProfileModal";
import IdleStatusBar from "@/components/game/IdleStatusBar";
import ActiveBuffsBar from "@/components/game/ActiveBuffsBar";
import { useSocket } from "@/lib/SocketContext";
import PixelButton from "@/components/game/PixelButton";

// Renders a pixel sprite for the floating quick-access menu; falls back to the
// lucide icon if the sprite PNG is missing. Drop sprites at the given paths in
// /public/sprites/ui/menu/ to auto-pick them up.
function MenuSprite({ src, Fallback, className }) {
  const [errored, setErrored] = React.useState(false);
  if (errored || !src) return <Fallback className={className} />;
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      onError={() => setErrored(true)}
      className={className}
      style={{ imageRendering: "pixelated", objectFit: "contain" }}
    />
  );
}

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
  const { connected, onlineCount } = useSocket();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickAccessOpen, setQuickAccessOpen] = useState(true);
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
      <aside
        className="hidden md:flex flex-col w-64"
        style={{
          border: "2px solid #b8872a",
          background: "#0f0e24",
          position: "relative",
          zIndex: 10,
          boxShadow: "4px 0 12px rgba(0,0,0,0.5)",
        }}
      >
        <div className="p-4" style={{ borderBottom: "1px solid #c8973a" }}>
          <h1
            className="text-base font-bold tracking-wider"
            style={{ fontFamily: "'Press Start 2P', monospace", color: "#c8973a" }}
          >
            IDLE REALM
          </h1>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            Online MMORPG
            {onlineCount > 0 && (
              <span className="flex items-center gap-1 text-green-400">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {onlineCount.toLocaleString()} online
              </span>
            )}
          </p>
        </div>

        {character && (
          <div className="p-4" style={{ borderBottom: "1px solid #c8973a" }}>
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-3 w-full hover:bg-muted/50 rounded-lg p-1 -m-1 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:border-primary/60 transition-colors overflow-hidden">
                <img src={`/sprites/class_${character.class || "warrior"}.png`} alt={character.class} className="w-9 h-9" style={{ imageRendering: "pixelated" }} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm truncate">{character.name}</p>
                  <RoleBadge role={currentUserRole} />
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} title={connected ? "Connected" : "Reconnecting..."} />
                  Lv.{character.level} {character.class}
                </p>
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

        <nav className="flex-1 overflow-y-auto">
           {NAV_ITEMS.map(({ path, icon: Icon, label, admin }) => {
              // Hide admin link if user is not admin
              if (admin && currentUserRole !== "admin" && currentUserRole !== "superadmin") return null;

              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className="flex items-center gap-3 px-3 py-2.5 transition-all"
                  style={{
                    borderBottom: "1px solid #c8973a",
                    background: active ? "rgba(200, 151, 58, 0.15)" : "transparent",
                    color: active ? "#c8973a" : "#a89070",
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: "8px",
                    letterSpacing: "0.05em",
                    transform: "scale(1)",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(200,151,58,0.08)"; e.currentTarget.style.color = "#c8973a"; e.currentTarget.style.transform = "scale(1.03)"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a89070"; e.currentTarget.style.transform = "scale(1)"; }}
                >
                  <Icon className="w-4 h-4 shrink-0" style={{ color: active ? "#c8973a" : "#a89070" }} />
                  {label}
                </Link>
              );
            })}
          </nav>

        <div className="p-3 space-y-2" style={{ borderTop: "1px solid #c8973a" }}>
          <PixelButton
            variant="ok"
            label="CHARACTER SELECTION"
            onClick={onBackToSelection}
            className="w-full"
          />
          <PixelButton
            variant="cancel"
            label="LOGOUT"
            onClick={() => handleLogout()}
            className="w-full"
          />
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-3 border-b border-border bg-card/50">
          <div className="flex items-center gap-2">
            <h1 className="font-orbitron text-lg font-bold text-primary">IDLE REALM</h1>
            {onlineCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-green-400">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {onlineCount.toLocaleString()}
              </span>
            )}
          </div>
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
          {/* Feature quick-access icons — hidden on immersive pages, collapsible */}
          {!["/fields", "/portal", "/tower"].includes(location.pathname) && <div className="fixed top-16 left-4 md:left-[17rem] z-30 flex items-start gap-1">
            <div
              onClick={() => setQuickAccessOpen(o => !o)}
              className="w-8 h-8 rounded-lg bg-gray-800/90 border border-gray-600/50 flex items-center justify-center cursor-pointer hover:bg-gray-700/90 transition-all shrink-0"
              title={quickAccessOpen ? "Hide shortcuts" : "Show shortcuts"}
            >
              {quickAccessOpen ? <X className="w-4 h-4 text-gray-400" /> : <Menu className="w-4 h-4 text-gray-400" />}
            </div>
            {quickAccessOpen && <div className="grid grid-cols-3 gap-2">
            <div
              onClick={() => navigate("/tower")}
              className="w-16 h-16 flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-all group"
              title="Tower of Trials"
            >
              <MenuSprite src="/sprites/ui/menu/tower.png" Fallback={ArrowUp} className="w-12 h-12 text-amber-400 group-hover:text-amber-300 transition-colors" />
              <span className="text-[8px] font-bold text-amber-400/80 group-hover:text-amber-300 mt-0.5 tracking-wide">TOWER</span>
            </div>
            <div
              onClick={() => navigate("/seasonpass")}
              className="w-16 h-16 flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-all group"
              title="Battle Pass"
            >
              <MenuSprite src="/sprites/ui/menu/pass.png" Fallback={Star} className="w-12 h-12 text-purple-400 group-hover:text-purple-300 transition-colors" />
              <span className="text-[8px] font-bold text-purple-400/80 group-hover:text-purple-300 mt-0.5 tracking-wide">PASS</span>
            </div>
            <div
              onClick={() => navigate("/pets")}
              className="w-16 h-16 flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-all group"
              title="Pet Companions"
            >
              <MenuSprite src="/sprites/ui/menu/pets.png" Fallback={PawPrint} className="w-12 h-12 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
              <span className="text-[8px] font-bold text-cyan-400/80 group-hover:text-cyan-300 mt-0.5 tracking-wide">PETS</span>
            </div>
            <div
              onClick={() => navigate("/portal")}
              className="w-16 h-16 flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-all group"
              title="Infinite Portal"
            >
              <MenuSprite src="/sprites/ui/menu/portal.png" Fallback={Sparkles} className="w-12 h-12 text-violet-400 group-hover:text-violet-300 transition-colors" />
              <span className="text-[8px] font-bold text-violet-400/80 group-hover:text-violet-300 mt-0.5 tracking-wide">PORTAL</span>
            </div>
            <div
              onClick={() => navigate("/fields")}
              className="w-16 h-16 flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-all group"
              title="The Fields"
            >
              <MenuSprite src="/sprites/ui/menu/fields.png" Fallback={Wheat} className="w-12 h-12 text-green-400 group-hover:text-green-300 transition-colors" />
              <span className="text-[8px] font-bold text-green-400/80 group-hover:text-green-300 mt-0.5 tracking-wide">FIELDS</span>
            </div>
            <div
              onClick={() => navigate("/worldboss")}
              className="w-16 h-16 flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-all group"
              title="World Boss"
            >
              <MenuSprite src="/sprites/ui/menu/boss.png" Fallback={Skull} className="w-12 h-12 text-red-400 group-hover:text-red-300 transition-colors" />
              <span className="text-[8px] font-bold text-red-400/80 group-hover:text-red-300 mt-0.5 tracking-wide">BOSS</span>
            </div>
            </div>}
          </div>}
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