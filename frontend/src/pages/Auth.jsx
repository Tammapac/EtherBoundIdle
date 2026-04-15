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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <Shield className="w-10 h-10 text-cyan-400" />
            <h1 className="font-orbitron text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent tracking-wider">
              EtherBound
            </h1>
          </motion.div>
          <p className="text-muted-foreground text-sm tracking-wide">
            {mode === "reset" ? "Reset your password" : mode === "login" ? "Welcome back, Adventurer" : "Begin your journey"}
          </p>
        </div>

        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 shadow-lg shadow-cyan-500/5">
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

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-2"
              >
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <p className="text-green-400 text-sm">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={mode === "reset" ? handleResetPassword : mode === "login" ? handleLogin : handleRegister} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="bg-muted/50 border-border/50 focus:border-primary/50"
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
                  <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" /> Username
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your hero name"
                    className="bg-muted/50 border-border/50 focus:border-primary/50"
                    maxLength={20}
                    required={mode === "register"}
                    disabled={isLoading}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {mode !== "reset" && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-muted/50 border-border/50 focus:border-primary/50"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
                {mode === "register" && (
                  <p className="text-xs text-muted-foreground mt-1">Minimum 6 characters</p>
                )}
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => { setMode("reset"); setError(""); setSuccess(""); }}
                    className="text-xs text-primary hover:text-primary/80 mt-1"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            )}

            {mode === "reset" && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <KeyRound className="w-4 h-4" /> New Password
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="bg-muted/50 border-border/50 focus:border-primary/50"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">Minimum 6 characters</p>
              </div>
            )}

            <div className="flex justify-center">
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

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {mode === "reset" ? "Remember your password?" : mode === "login" ? "No account yet?" : "Already have an account?"}
            </p>
            <Button
              variant="link"
              onClick={() => {
                setMode(mode === "reset" ? "login" : mode === "login" ? "register" : "login");
                setError("");
                setSuccess("");
              }}
              className="text-primary hover:text-primary/80 font-medium"
              disabled={isLoading}
            >
              {mode === "reset" ? "Back to Login" : mode === "login" ? "Create one" : "Login instead"}
            </Button>
          </div>
        </div>

        <p className="text-center text-muted-foreground/50 text-xs mt-8 tracking-wide">
          All rights reserved and copyright by Tammapac
        </p>
      </motion.div>
    </div>
  );
}
