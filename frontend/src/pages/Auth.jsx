import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { apiFetch } from "@/api/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import PixelButton from "@/components/game/PixelButton";
import { Input } from "@/components/ui/input";
import { Shield, Mail, User, Lock, ChevronRight, CheckCircle, AlertCircle, KeyRound } from "lucide-react";

export default function Auth() {
  const { register, login } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register" | "reset"
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email) { setError("Please enter your email."); return; }
    if (!newPassword || newPassword.length < 6) { setError("New password must be at least 6 characters."); return; }
    setIsLoading(true);
    try {
      const res = await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, newPassword }),
      });
      if (res?.success) {
        setSuccess(res.data?.message || "Password reset successfully! You can now login.");
        setNewPassword("");
        setTimeout(() => { setMode("login"); setSuccess(""); }, 3000);
      } else {
        setError(res?.error || "Reset failed.");
      }
    } catch (err) {
      setError("Reset failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || "Login failed. Check your credentials.");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!username.trim()) {
      setError("Please enter a username.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(email, password, username.trim());
      if (!result.success) {
        setError(result.error || "Registration failed.");
      }
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const pixelLabel = "font-['Press_Start_2P'] text-[8px] tracking-wide mb-2 flex items-center gap-2";
  const pixelInput = "rounded-none border-2 border-cyan-800 bg-[#0d0d2b] text-cyan-100 placeholder:text-cyan-900/60 focus:border-cyan-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none font-mono";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#05050f] relative overflow-hidden">
      {/* Pixel-art scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 4px)" }}
      />
      {/* Ambient glow blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-xl relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-3 mb-3"
          >
            <Shield className="w-10 h-10 text-cyan-400" />
            <h1 className="font-['Press_Start_2P'] text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent tracking-wider">
              EtherBound
            </h1>
          </motion.div>
          <p className="font-['Press_Start_2P'] text-[10px] text-muted-foreground tracking-wide leading-6">
            {mode === "reset" ? "Reset your password" : mode === "login" ? "Welcome back, Adventurer" : "Begin your journey"}
          </p>
        </div>

        {/* Pixel-art card */}
        <div
          className="p-8 md:p-12"
          style={{
            background: "#0a0a1e",
            border: "3px solid #22d3ee",
            boxShadow: "0 0 0 3px #0a0a1e, 0 0 0 6px #7c3aed60, 6px 6px 0 6px #7c3aed30",
          }}
        >
          {/* Tab buttons */}
          <div className="flex gap-2 mb-6">
            <PixelButton
              variant="ok"
              label="LOGIN"
              onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
              className="flex-1"
            />
            <PixelButton
              variant="ok"
              label="REGISTER"
              onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
              className="flex-1"
            />
          </div>

          {/* Error / success banners */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-red-950/40 border-2 border-red-500/60 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="font-['Press_Start_2P'] text-[8px] text-red-400 leading-relaxed">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-green-950/40 border-2 border-green-500/60 flex items-start gap-2"
              >
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <p className="font-['Press_Start_2P'] text-[8px] text-green-400 leading-relaxed">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={mode === "reset" ? handleResetPassword : mode === "login" ? handleLogin : handleRegister} className="space-y-5">
            <div>
              <label className={`${pixelLabel} text-cyan-300/70`}>
                <Mail className="w-3 h-3" /> EMAIL
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={pixelInput}
                required
                disabled={isLoading}
              />
            </div>

            <AnimatePresence>
              {mode === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className={`${pixelLabel} text-cyan-300/70`}>
                    <User className="w-3 h-3" /> USERNAME
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your hero name"
                    className={pixelInput}
                    maxLength={20}
                    required={mode === "register"}
                    disabled={isLoading}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {mode !== "reset" && (
              <div>
                <label className={`${pixelLabel} text-cyan-300/70`}>
                  <Lock className="w-3 h-3" /> PASSWORD
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={pixelInput}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
                {mode === "register" && (
                  <p className="font-['Press_Start_2P'] text-[7px] text-cyan-900 mt-1">MIN 6 CHARACTERS</p>
                )}
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => { setMode("reset"); setError(""); setSuccess(""); }}
                    className="font-['Press_Start_2P'] text-[7px] text-purple-400 hover:text-purple-300 mt-2 block transition-colors"
                  >
                    FORGOT PASSWORD?
                  </button>
                )}
              </div>
            )}

            {mode === "reset" && (
              <div>
                <label className={`${pixelLabel} text-cyan-300/70`}>
                  <KeyRound className="w-3 h-3" /> NEW PASSWORD
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className={pixelInput}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
                <p className="font-['Press_Start_2P'] text-[7px] text-cyan-900 mt-1">MIN 6 CHARACTERS</p>
              </div>
            )}

            <div className="flex justify-center pt-1">
              <PixelButton
                variant="ok"
                label={
                  isLoading
                    ? (mode === "reset" ? "RESETTING..." : mode === "login" ? "LOGGING IN..." : "CREATING...")
                    : (mode === "reset" ? "RESET PASSWORD" : mode === "login" ? "LOGIN" : "CREATE ACCOUNT")
                }
                disabled={isLoading}
              />
            </div>
          </form>

          {/* Switch mode */}
          <div className="mt-6 text-center space-y-2">
            <p className="font-['Press_Start_2P'] text-[7px] text-cyan-900">
              {mode === "reset" ? "REMEMBER YOUR PASSWORD?" : mode === "login" ? "NO ACCOUNT YET?" : "ALREADY HAVE AN ACCOUNT?"}
            </p>
            <Button
              variant="link"
              onClick={() => {
                setMode(mode === "reset" ? "login" : mode === "login" ? "register" : "login");
                setError("");
                setSuccess("");
              }}
              className="font-['Press_Start_2P'] text-[8px] text-yellow-400 hover:text-yellow-300 no-underline hover:no-underline p-0 h-auto"
              disabled={isLoading}
            >
              {mode === "reset" ? "BACK TO LOGIN" : mode === "login" ? "CREATE ONE" : "LOGIN INSTEAD"}
            </Button>
          </div>
        </div>

        <p className="text-center font-['Press_Start_2P'] text-[6px] text-cyan-950/70 mt-6 tracking-widest">
          ALL RIGHTS RESERVED &copy; TAMMAPAC
        </p>
      </motion.div>
    </div>
  );
}
