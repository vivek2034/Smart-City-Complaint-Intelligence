import React, { useState } from "react";
import { registerUser, getUser, getUserByAadhaar, checkAadhaarExists, UserProfile } from "../firebase";
import { User, ShieldAlert, Phone, Mail, MapPin, Key, Loader2, ArrowLeft, ShieldCheck, Upload, Sparkles, CheckCircle, AlertTriangle } from "lucide-react";
import axios from "axios";

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

  // Identity document upload state during registration
  const [idImageBase64, setIdImageBase64] = useState<string>("");
  const [verifyingId, setVerifyingId] = useState(false);
  const [idVerifyResult, setIdVerifyResult] = useState<{
    isVerified: boolean;
    idNumber: string;
    idName: string;
    documentType: string;
    verificationReason: string;
  } | null>(null);
  const [idVerifyError, setIdVerifyError] = useState<string | null>(null);

  const handleIdImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIdVerifyError(null);
    setIdVerifyResult(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setIdImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleVerifyId = async () => {
    if (!idImageBase64) {
      setIdVerifyError("Please upload an ID copy first.");
      return;
    }

    setVerifyingId(true);
    setIdVerifyError(null);
    setIdVerifyResult(null);

    try {
      const response = await axios.post("/api/verify-id", { image: idImageBase64 });
      if (response.data && response.data.error) {
        throw new Error(response.data.error);
      }
      
      const resData = response.data;
      setIdVerifyResult(resData);
      if (resData.isVerified) {
        if (resData.idName) {
          setName(resData.idName);
        }
        if (resData.idAddress) {
          setAddress(resData.idAddress);
        }
        if (resData.idPhone) {
          setNumber(resData.idPhone);
        }
      }
    } catch (err: any) {
      console.error("[LoginPortal ID Verification] failed:", err);
      setIdVerifyError(err.response?.data?.error || err.message || "An error occurred during verification.");
    } finally {
      setVerifyingId(false);
    }
  };

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

        // If they verified an ID, add it to the user profile
        if (idVerifyResult && idVerifyResult.isVerified) {
          const exists = await checkAadhaarExists(idVerifyResult.idNumber);
          if (exists) {
            throw new Error(`Security Exception: The verified ${idVerifyResult.documentType} ID (${idVerifyResult.idNumber}) is already linked to another citizen account.`);
          }
          userProfile.aadhaarNumber = idVerifyResult.idNumber;
          userProfile.aadhaarName = idVerifyResult.idName;
          userProfile.isVerified = true;
        }

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
            throw new Error("Please enter your phone number or verified Aadhaar ID, and password.");
          }

          let profile = await getUser(loginId);
          if (!profile) {
            // Check if the user entered their verified Aadhaar number
            profile = await getUserByAadhaar(loginId);
          }

          if (!profile) {
            throw new Error("Citizen account not found. Please register first.");
          }

          if (profile.role !== "citizen") {
            throw new Error("This identifier is not registered as a citizen.");
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

            {/* Optional Government ID Upload & Verification (Aadhaar / Voter ID) */}
            <div className="space-y-2 border-t border-slate-100 pt-3 mt-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Verify Government ID (Aadhaar/PAN)
                </label>
                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase">Highly Recommended</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Verify your identity card with Gemini Vision to auto-fill your name and secure your profile immediately.
              </p>

              {!idImageBase64 ? (
                <div className="border border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-slate-50/50 rounded-xl p-4 text-center transition-all cursor-pointer relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIdImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="space-y-1 flex flex-col items-center">
                    <Upload className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-slate-600">Click to upload ID copy</span>
                    <span className="text-[9px] text-slate-400">PNG, JPG, JPEG</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-slate-600 truncate max-w-[180px]">ID Card Selected</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIdImageBase64("");
                        setIdVerifyResult(null);
                        setIdVerifyError(null);
                      }}
                      className="text-rose-500 hover:underline font-semibold cursor-pointer"
                    >
                      Change image
                    </button>
                  </div>
                  
                  {/* Miniature Preview */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-center h-24 overflow-hidden">
                    <img
                      src={idImageBase64}
                      alt="ID Preview"
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full rounded object-contain shadow-sm"
                    />
                  </div>

                  {!idVerifyResult && !verifyingId && (
                    <button
                      type="button"
                      onClick={handleVerifyId}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold text-[10px] py-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-300" /> Verify with Gemini Vision
                    </button>
                  )}

                  {verifyingId && (
                    <div className="flex items-center justify-center gap-2 py-1.5 text-slate-500 text-[10px] font-bold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      <span>Gemini is reading document...</span>
                    </div>
                  )}

                  {idVerifyResult && (
                    <div className="space-y-2">
                      {idVerifyResult.isVerified ? (
                        <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl space-y-1.5">
                          <div className="flex gap-1.5 text-[10px] text-emerald-800 font-bold">
                            <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                            <span>ID Verified & Extracted!</span>
                          </div>
                          <div className="text-[9px] text-slate-600 space-y-0.5 border-t border-emerald-200/40 pt-1.5 font-mono">
                            <div><strong>Type:</strong> {idVerifyResult.documentType}</div>
                            <div><strong>Legal Name:</strong> {idVerifyResult.idName}</div>
                            <div><strong>Number:</strong> {idVerifyResult.idNumber}</div>
                          </div>
                          <div className="text-[9px] text-emerald-700 italic">
                            ✓ Your profile name was automatically updated.
                          </div>
                        </div>
                      ) : (
                        <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-xl flex gap-1.5 text-[10px] text-rose-800">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                          <div>
                            <span className="font-bold block">Verification Failed</span>
                            <span className="text-[9px] block text-rose-600">{idVerifyResult.verificationReason}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {idVerifyError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-2.5 rounded-xl flex gap-1.5 text-[10px] leading-relaxed">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{idVerifyError}</span>
                </div>
              )}
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
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isSignUp ? "Phone Number" : "Phone Number or Verified Aadhaar ID"}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder={isSignUp ? "10-digit mobile number" : "10-digit mobile number or Aadhaar ID"}
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
              <span className="block font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1">Database Official Logins:</span>
              <div className="flex flex-col gap-1">
                <div className="bg-white p-1.5 rounded border border-slate-100 flex justify-between">
                  <span>ID: <strong className="text-indigo-600">admin@city.gov.in</strong></span>
                  <span>Pass: <strong className="text-slate-600">password123</strong></span>
                </div>
                <div className="bg-white p-1.5 rounded border border-slate-100 flex justify-between">
                  <span>ID: <strong className="text-indigo-600">official@city.gov.in</strong></span>
                  <span>Pass: <strong className="text-slate-600">officialpass</strong></span>
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
