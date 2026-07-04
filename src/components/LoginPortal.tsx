import React, { useState } from "react";
import { registerUser, getUser, UserProfile } from "../firebase";
import { User, ShieldAlert, Phone, Mail, MapPin, Key, Loader2, ArrowLeft } from "lucide-react";

interface LoginPortalProps {
  initialRole?: "citizen" | "official";
  onLoginSuccess: (user: UserProfile) => void;
  onBack: () => void;
}

export default function LoginPortal({ initialRole = "citizen", onLoginSuccess, onBack }: LoginPortalProps) {
  const role = initialRole;
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp && role === "citizen") {
        // Sign Up Flow for Citizen
        if (!name.trim() || !number.trim() || !address.trim() || !password.trim()) {
          throw new Error("Please fill in all required fields.");
        }

        const uniqueId = number.trim();

        const userProfile: UserProfile = {
          id: uniqueId,
          name: name.trim(),
          number: number.trim(),
          address: address.trim(),
          password: password, // For mock authentication
          role: "citizen"
        };

        // Check if user already exists
        const existing = await getUser(uniqueId);
        if (existing) {
          throw new Error("An account already exists with this phone number.");
        }

        await registerUser(userProfile);
        onLoginSuccess(userProfile);
      } else {
        // Login Flow
        if (role === "official") {
          const loginId = email.toLowerCase().trim();
          if (!loginId || !password) {
            throw new Error("Please enter your official email and password.");
          }

          const profile = await getUser(loginId);
          if (!profile) {
            throw new Error("Municipal official account not found in records.");
          }

          if (profile.role !== "official") {
            throw new Error("This email is not registered as a municipal official.");
          }

          if (profile.password !== password) {
            throw new Error("Invalid password.");
          }

          onLoginSuccess(profile);
        } else {
          // Citizen Login
          const loginId = number.trim();
          if (!loginId || !password) {
            throw new Error("Please enter your phone number and password.");
          }

          const profile = await getUser(loginId);
          if (!profile) {
            throw new Error("Citizen account not found. Please register first.");
          }

          if (profile.role !== "citizen") {
            throw new Error("This number is not registered as a citizen.");
          }

          if (profile.password !== password) {
            throw new Error("Invalid password.");
          }

          onLoginSuccess(profile);
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-indigo-600 px-6 py-5 text-white relative">
        <button 
          onClick={onBack}
          className="absolute left-4 top-5 text-indigo-100 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold font-display tracking-tight">
            {role === "citizen" ? "Citizen Portal Access" : "Municipal Authority Sign In"}
          </h2>
          <p className="text-xs text-indigo-100 mt-1">
            {isSignUp ? "Create your smart credentials" : "Authenticate to access functions"}
          </p>
        </div>
      </div>

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-xl flex items-start gap-2 animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isSignUp && role === "citizen" && (
          <>
            {/* Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-3 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Residential Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Street, Ward No, Sector"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-3 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </>
        )}

        {/* Email (only for officials) */}
        {role === "official" && (
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Official Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                placeholder="name@city.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-3 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-sans"
                required
              />
            </div>
          </div>
        )}

        {/* Number (for both, but is unique ID for citizens) */}
        {role === "citizen" && (
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-3 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>
        )}

        {/* Password */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
          </div>
          <div className="relative">
            <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-3 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying credentials...</span>
            </>
          ) : (
            <span>{isSignUp ? "Sign Up & Register" : "Login Securely"}</span>
          )}
        </button>

        {/* Toggle signup/login for Citizens, and secure info display for Officials */}
        {role === "official" ? (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Authorized Personnel Only
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              Official accounts are securely provisioned and managed by the central municipal database. Please contact the municipal IT administration desk to request or modify credentials.
            </p>
            <div className="pt-2.5 border-t border-slate-200/65 text-left space-y-1.5 text-[11px] font-mono text-slate-400">
              <span className="block font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1">Contacts</span>
              <div className="flex flex-col gap-1">
                <div className="bg-white p-1.5 rounded border border-slate-100 flex justify-between">
                  <span>Email:<strong className="text-indigo-600">xyz@mail.com</strong></span>
                  <span>No.: <strong className="text-slate-600">1234567890</strong></span>
                </div>
                <div className="bg-white p-1.5 rounded border border-slate-100 flex justify-between">
                  <span>Email: <strong className="text-indigo-600">abc@mail.com</strong></span>
                  <span>No.: <strong className="text-slate-600">9xxxxxxxxx</strong></span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center pt-2 text-[11px] text-slate-500">
            <span>
              {isSignUp ? "Already have an account?" : "New to the Smart City Portal?"}
            </span>{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors cursor-pointer"
            >
              {isSignUp ? "Sign In Instead" : "Register Now"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
