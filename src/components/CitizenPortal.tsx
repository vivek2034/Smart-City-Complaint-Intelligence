import React, { useState, useEffect, useRef } from "react";
import { 
  createComplaint, 
  getCitizenComplaints, 
  registerUser, 
  checkAadhaarExists, 
  Complaint, 
  UserProfile 
} from "../firebase";
import { 
  PlusCircle, 
  Search, 
  MapPin, 
  Image as ImageIcon, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Loader2, 
  FileText,
  TrendingDown,
  ShieldCheck,
  Upload,
  UserCheck,
  Lock
} from "lucide-react";
import axios from "axios";
import { getFallbackAnalysis } from "../utils/fallbackAnalysis";

declare const L: any;

interface CitizenPortalProps {
  currentUser: UserProfile;
  allComplaints: Complaint[];
  onRefreshComplaints: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

export default function CitizenPortal({ currentUser, allComplaints, onRefreshComplaints, onUpdateUser }: CitizenPortalProps) {
  const [activeTab, setActiveTab] = useState<"submit" | "track" | "verify">("submit");
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
  const [loadingMy, setLoadingMy] = useState(false);

  // Aadhaar ID verification states
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
  const [savingVerifiedId, setSavingVerifiedId] = useState(false);
  const [idSaveSuccess, setIdSaveSuccess] = useState(false);

  // Submit form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("Roads & Traffic");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Accurate Location State
  const [selectedLat, setSelectedLat] = useState<number>(12.9716 + (Math.random() - 0.5) * 0.03);
  const [selectedLng, setSelectedLng] = useState<number>(77.5946 + (Math.random() - 0.5) * 0.03);
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  const pickerMapContainerRef = useRef<HTMLDivElement>(null);
  const pickerMapInstanceRef = useRef<any>(null);
  const pickerMarkerRef = useRef<any>(null);

  // AI analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{
    category: string;
    severity: "High" | "Medium" | "Low";
    sentiment: string;
    keywords: string[];
    source?: string;
  } | null>(null);

  // Tracking details
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyComplaints();
    setFormError(null);
  }, [currentUser, activeTab]);

  const fetchMyComplaints = async () => {
    setLoadingMy(true);
    try {
      const list = await getCitizenComplaints(currentUser.id);
      setMyComplaints(list);
    } catch (err) {
      console.error("Error fetching citizen complaints:", err);
    } finally {
      setLoadingMy(false);
    }
  };

  // Convert uploaded image to base64 ("image to bit or code")
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Convert uploaded Government ID image to base64
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
      setIdVerifyError("Please upload or drag a copy of your Government ID first.");
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
      setIdVerifyResult(response.data);
    } catch (err: any) {
      console.error("[ID Verification Client] failed:", err);
      setIdVerifyError(err.response?.data?.error || err.message || "An error occurred while verifying the ID document.");
    } finally {
      setVerifyingId(false);
    }
  };

  const handleSaveVerifiedId = async () => {
    if (!idVerifyResult || !idVerifyResult.isVerified) {
      setIdVerifyError("Please successfully verify a valid ID first.");
      return;
    }

    setSavingVerifiedId(true);
    setIdVerifyError(null);

    try {
      // 1. Perform duplicate check in Firestore and local storage
      const exists = await checkAadhaarExists(idVerifyResult.idNumber, currentUser.id);
      if (exists) {
        throw new Error(`Security Exception: The extracted ${idVerifyResult.documentType} ID (${idVerifyResult.idNumber}) is already linked and saved to another citizen account.`);
      }

      // 2. Register user updates
      const updatedProfile: UserProfile = {
        ...currentUser,
        aadhaarNumber: idVerifyResult.idNumber,
        aadhaarName: idVerifyResult.idName,
        isVerified: true
      };

      if (idVerifyResult.idAddress) {
        updatedProfile.address = idVerifyResult.idAddress;
      }
      if (idVerifyResult.idPhone) {
        updatedProfile.number = idVerifyResult.idPhone;
      }

      await registerUser(updatedProfile);
      
      // 3. Notify parent app state to synchronize
      if (onUpdateUser) {
        onUpdateUser(updatedProfile);
      }
      
      setIdSaveSuccess(true);
    } catch (err: any) {
      console.error("[Save ID] failed:", err);
      setIdVerifyError(err.message || "An unexpected error occurred while linking your ID.");
    } finally {
      setSavingVerifiedId(false);
    }
  };

  const geocodeAddress = async () => {
    if (!address.trim()) {
      setGeocodingError("Please enter a specific address first.");
      return;
    }
    setGeocoding(true);
    setGeocodingError(null);

    const tryGeocode = async (query: string): Promise<{ lat: number; lng: number } | null> => {
      try {
        const response = await axios.get("https://nominatim.openstreetmap.org/search", {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "SmartCityComplaintApp/1.0"
          },
          params: {
            q: query,
            format: "json",
            limit: 1
          }
        });
        if (response.data && response.data.length > 0) {
          const result = response.data[0];
          return {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
          };
        }
      } catch (err) {
        console.error("Single geocode attempt failed for query:", query, err);
      }
      return null;
    };

    try {
      const fullQuery = address.trim();
      let coords = await tryGeocode(fullQuery);

      // Fallback 1: Strip leading plot or door numbers like "588, Maswanpur" -> "Maswanpur"
      if (!coords) {
        const strippedQuery = fullQuery.replace(/^\d+[\s,]+/, "");
        if (strippedQuery !== fullQuery && strippedQuery.trim().length > 3) {
          coords = await tryGeocode(strippedQuery);
        }
      }

      // Fallback 2: Drop the first comma-separated token, e.g., "588, Maswanpur, Kanpur" -> "Maswanpur, Kanpur"
      if (!coords) {
        const parts = fullQuery.split(",");
        if (parts.length > 1) {
          const simplifiedQuery = parts.slice(1).join(",").trim();
          if (simplifiedQuery.length > 3) {
            coords = await tryGeocode(simplifiedQuery);
          }
        }
      }

      // Fallback 3: Try searching just Kanpur or city reference if postal code is included
      if (!coords) {
        const matchPin = fullQuery.match(/\b\d{6}\b/);
        if (matchPin) {
          coords = await tryGeocode(matchPin[0]);
        }
      }

      if (coords) {
        setSelectedLat(coords.lat);
        setSelectedLng(coords.lng);
        setGeocodingError(null);
      } else {
        setGeocodingError("Could not find precise coordinates on map for this address. Try placing the marker manually.");
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
      setGeocodingError("Failed to look up address. Please drag or click on the map to pin.");
    } finally {
      setGeocoding(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await axios.get("https://nominatim.openstreetmap.org/reverse", {
        params: {
          lat,
          lon: lng,
          format: "json"
        }
      });
      if (response.data && response.data.display_name) {
        // Use a simpler or shorter address if available
        setAddress(response.data.display_name);
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeocodingError("Geolocation is not supported by your browser/iframe context.");
      return;
    }
    setLocating(true);
    setGeocodingError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setSelectedLat(lat);
        setSelectedLng(lng);
        reverseGeocode(lat, lng);
        setLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setGeocodingError("Could not automatically detect your GPS location. Please enter it or select on map manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Map mounting hook for Location Picker
  useEffect(() => {
    if (activeTab !== "submit" || submitSuccess || typeof L === "undefined") {
      if (pickerMapInstanceRef.current) {
        pickerMapInstanceRef.current.remove();
        pickerMapInstanceRef.current = null;
        pickerMarkerRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!pickerMapContainerRef.current) return;

      if (pickerMapInstanceRef.current) {
        pickerMapInstanceRef.current.remove();
        pickerMapInstanceRef.current = null;
        pickerMarkerRef.current = null;
      }

      const map = L.map(pickerMapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([selectedLat, selectedLng], 14);

      pickerMapInstanceRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20
      }).addTo(map);

      const customIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 border-white bg-indigo-600 transition-transform hover:scale-110">
            <span class="text-white text-xs font-bold font-mono">📍</span>
            <div class="absolute -bottom-1 w-2 h-2 rotate-45 border-r border-b border-white bg-indigo-600"></div>
          </div>
        `,
        className: "custom-picker-pin",
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([selectedLat, selectedLng], {
        icon: customIcon,
        draggable: true
      }).addTo(map);

      pickerMarkerRef.current = marker;

      marker.on("dragend", () => {
        const position = marker.getLatLng();
        setSelectedLat(position.lat);
        setSelectedLng(position.lng);
        reverseGeocode(position.lat, position.lng);
      });

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        setSelectedLat(lat);
        setSelectedLng(lng);
        marker.setLatLng([lat, lng]);
        reverseGeocode(lat, lng);
      });
    }, 150);

    return () => {
      clearTimeout(timer);
      if (pickerMapInstanceRef.current) {
        pickerMapInstanceRef.current.remove();
        pickerMapInstanceRef.current = null;
        pickerMarkerRef.current = null;
      }
    };
  }, [activeTab, submitSuccess]);

  // Sync state changes back to map view & marker
  useEffect(() => {
    if (pickerMapInstanceRef.current && pickerMarkerRef.current) {
      const markerLatLng = pickerMarkerRef.current.getLatLng();
      if (Math.abs(markerLatLng.lat - selectedLat) > 0.00001 || Math.abs(markerLatLng.lng - selectedLng) > 0.00001) {
        pickerMarkerRef.current.setLatLng([selectedLat, selectedLng]);
        pickerMapInstanceRef.current.setView([selectedLat, selectedLng], pickerMapInstanceRef.current.getZoom());
      }
    }
  }, [selectedLat, selectedLng]);

  const runAiAnalysis = async () => {
    setFormError(null);
    if (!title.trim() || !description.trim()) {
      setFormError("Please enter a title and description before running AI analysis.");
      return;
    }
    setAnalyzing(true);
    try {
      const response = await axios.post("/api/analyze", { 
        title, 
        description, 
        image: imageBase64 || undefined 
      });
      setAiResult({
        category: response.data.category,
        severity: response.data.severity,
        sentiment: response.data.sentiment,
        keywords: response.data.keywords || [],
        source: response.data.source
      });
      // Automatically prefill category based on AI recommendations!
      if (response.data.category) {
        setCategory(response.data.category);
      }
    } catch (err) {
      console.warn("AI Analysis API failed or unreachable. Falling back to client-side analyzer:", err);
      // Fallback gracefully using our local smart client-side analyzer
      const localResult = getFallbackAnalysis(title, description);
      setAiResult({
        category: localResult.category,
        severity: localResult.severity,
        sentiment: localResult.sentiment,
        keywords: localResult.keywords,
        source: "client_local_fallback"
      });
      if (localResult.category) {
        setCategory(localResult.category);
      }
      setFormError("AI cloud service is offline. Successfully ran local client-side analysis instead!");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim() || !description.trim() || !address.trim()) {
      setFormError("Please fill in all required fields (Title, Description, and Address).");
      return;
    }

    setSubmitting(true);
    try {
      // Determine final severity (use AI recommendation or default to Low/Medium)
      const finalSeverity = aiResult?.severity || "Medium";
      const finalSentiment = aiResult?.sentiment || "Neutral / Concerned";
      const finalKeywords = aiResult?.keywords || ["citizen report"];

      const newComplaint: Omit<Complaint, "id"> = {
        title: title.trim(),
        description: description.trim(),
        category: category,
        image: imageBase64 || undefined,
        severity: finalSeverity,
        sentiment: finalSentiment,
        keywords: finalKeywords,
        status: "Pending",
        createdAt: new Date().toISOString(),
        citizenId: currentUser.id,
        citizenName: currentUser.name,
        location: {
          lat: selectedLat,
          lng: selectedLng,
          address: address.trim()
        }
      };

      await createComplaint(newComplaint);
      setSubmitSuccess(true);
      
      // Reset form
      setTitle("");
      setDescription("");
      setAddress("");
      setImageBase64("");
      setAiResult(null);
      onRefreshComplaints();
    } catch (err) {
      console.error("Failed to submit complaint:", err);
      setFormError("Submission failed. The municipal database could not be reached. Please check connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab("submit");
            setSubmitSuccess(false);
          }}
          className={`pb-3 text-sm font-semibold border-b-2 px-4 cursor-pointer transition-all ${
            activeTab === "submit"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Submit New Complaint
        </button>
        <button
          onClick={() => {
            setActiveTab("track");
            fetchMyComplaints();
          }}
          className={`pb-3 text-sm font-semibold border-b-2 px-4 cursor-pointer transition-all ${
            activeTab === "track"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Track My Complaints ({myComplaints.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("verify");
            setIdVerifyError(null);
            setIdVerifyResult(null);
            setIdSaveSuccess(false);
          }}
          className={`pb-3 text-sm font-semibold border-b-2 px-4 flex items-center gap-1.5 cursor-pointer transition-all ${
            activeTab === "verify"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Verify Gov ID (Aadhaar)
          {currentUser.isVerified ? (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">Verified</span>
          ) : (
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">Unverified</span>
          )}
        </button>
      </div>

      {activeTab === "submit" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Box */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
            {submitSuccess ? (
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">✓</div>
                <div>
                  <h3 className="text-base font-bold text-emerald-800 font-display">Complaint Logged Securely!</h3>
                  <p className="text-xs text-slate-500 mt-1">Our NVIDIA Mistral AI has triaged the severity and dispatched the ticket to the municipal council. You can track status updates in real-time.</p>
                </div>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  File Another Complaint
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-800 text-sm font-display uppercase tracking-wider">Complaint Information</h3>
                  <p className="text-[11px] text-slate-400">Describe the issue in detail. Fill in all fields for quick AI triage.</p>
                </div>

                {formError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3.5 rounded-xl flex items-start gap-2 animate-shake">
                    <span className="font-bold text-sm leading-none shrink-0 mt-0.5">⚠️</span>
                    <span>{formError}</span>
                  </div>
                )}

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Complaint Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Hazardous pothole at central market junction"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Detailed Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Explain the issue, when it happened, and how it is affecting local residents..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Location Address */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Specific Location / Address</label>
                    <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      Coordinates: {selectedLat.toFixed(5)}, {selectedLng.toFixed(5)}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. Sector 4, opposite Block B Enclave gate, next to high school"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-sans"
                        required
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={geocodeAddress}
                      disabled={geocoding || !address.trim()}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 font-semibold text-xs px-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 min-w-[110px]"
                      title="Geocode typed address to retrieve precise lat/lng coordinates"
                    >
                      {geocoding ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      ) : (
                        "Find on Map"
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={detectCurrentLocation}
                      disabled={locating}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-xs px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                      title="Pin your current device GPS coordinates"
                    >
                      {locating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                      ) : (
                        "🎯 My GPS"
                      )}
                    </button>
                  </div>

                  {geocodingError && (
                    <p className="text-[10px] text-rose-500 font-medium">⚠️ {geocodingError}</p>
                  )}

                  {/* Interactive Map Picker Container */}
                  <div className="space-y-1 mt-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Interactive Precision Pin (Drag/Click to adjust)
                      </span>
                      <span className="text-[9px] text-indigo-600 bg-indigo-50 font-bold px-2 py-0.5 rounded-full">
                        Accurate Location Mapping
                      </span>
                    </div>
                    <div className="relative w-full h-44 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-sm z-10">
                      <div ref={pickerMapContainerRef} className="w-full h-full" style={{ minHeight: "176px" }}></div>
                    </div>
                  </div>
                </div>

                {/* Category Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Roads & Traffic">Roads & Traffic</option>
                      <option value="Sanitation & Waste">Sanitation & Waste</option>
                      <option value="Water & Sewage">Water & Sewage</option>
                      <option value="Electricity & Power">Electricity & Power</option>
                      <option value="Public Safety">Public Safety</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  {/* Image input: encodes to bit/code text string base64 */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attach Image (Optional)</label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-all">
                        <ImageIcon className="w-4 h-4 text-slate-500" />
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      {imageBase64 && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          ✓ Image encoded text base64
                          <button 
                            type="button" 
                            onClick={() => setImageBase64("")} 
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Core AI Analysis Trigger */}
                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-indigo-100 rounded-md text-indigo-600">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800 font-display">AI Intelligent Categorizer</h4>
                        <p className="text-[10px] text-slate-400">Instantly finds category, severity, sentiment, and tags</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={runAiAnalysis}
                      disabled={analyzing || !title.trim() || !description.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        "Run AI Triage"
                      )}
                    </button>
                  </div>

                  {aiResult && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-indigo-100/50 text-xs animate-fadeIn">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Category Recommendation</p>
                        <p className="font-semibold text-slate-800 mt-0.5">{aiResult.category}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Estimated Severity</p>
                        <p className={`font-bold mt-0.5 ${
                          aiResult.severity === "High" ? "text-red-600" :
                          aiResult.severity === "Medium" ? "text-orange-500" : "text-green-600"
                        }`}>{aiResult.severity}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Detected Sentiment</p>
                        <p className="font-semibold text-slate-800 mt-0.5">{aiResult.sentiment}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Extracted Keywords</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {aiResult.keywords.map((kw, i) => (
                            <span key={i} className="text-[9px] bg-slate-100 px-1 py-0.5 rounded text-slate-500 font-medium">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Submit buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 flex items-center gap-1 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Logging complaint...
                      </>
                    ) : (
                      "Submit Complaint Ticket"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Guidelines Sidebar */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="border-b border-slate-100 pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm font-display uppercase tracking-wider">Filing Guidelines</h3>
            </div>
            
            <ul className="space-y-3 text-xs text-slate-600 leading-normal">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 shrink-0 font-bold">•</span>
                <span>**Provide specific landmarks** in the location field so maintenance trucks can find the spot immediately.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 shrink-0 font-bold">•</span>
                <span>**Attach clean close-up photographs**. Photos are encoded directly to secure database records, validating authenticity.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 shrink-0 font-bold">•</span>
                <span>Our AI model evaluates **safety hazards and public priority** to compute the overall Severity (High/Medium/Low).</span>
              </li>
            </ul>

            {imageBase64 && (
              <div className="pt-3 border-t border-slate-100">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Image Code String Preview</h5>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-40 overflow-hidden relative">
                  <p className="text-[9px] font-mono break-all text-slate-400 h-28 overflow-y-auto pr-1">
                    {imageBase64.slice(0, 1500)}...
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 to-transparent"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "track" && (
        /* Track My Complaints Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Complaints List Panel */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1 space-y-3">
            <h3 className="font-bold text-slate-800 text-sm font-display uppercase tracking-wider border-b border-slate-100 pb-2">
              My Submissions ({myComplaints.length})
            </h3>

            {loadingMy ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="text-xs">Loading submissions...</span>
              </div>
            ) : myComplaints.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                You haven't filed any complaints yet. Use the Submit tab to log your first concern.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {myComplaints.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedTrackId(c.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 cursor-pointer ${
                      selectedTrackId === c.id
                        ? "bg-indigo-50/50 border-indigo-200 shadow-sm"
                        : "bg-white border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        c.severity === "High" ? "bg-red-100 text-red-700" :
                        c.severity === "Medium" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                      }`}>
                        {c.severity}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        c.status === "Resolved" ? "bg-green-100 text-green-700" :
                        c.status === "Assigned" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-800 line-clamp-1 leading-snug">{c.title}</h4>
                    <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <span>📁 {c.category}</span>
                      <span>•</span>
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Live Timeline Tracker Panel */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
            {selectedTrackId ? (
              (() => {
                const ticket = myComplaints.find(c => c.id === selectedTrackId);
                if (!ticket) return null;

                // Status mapping to timeline index
                const stepIndex = ticket.status === "Resolved" ? 4 : ticket.status === "Assigned" ? 2 : 1;

                return (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            ticket.severity === "High" ? "bg-red-100 text-red-700" :
                            ticket.severity === "Medium" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                          }`}>
                            {ticket.severity} Severity
                          </span>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono">
                            ID: {ticket.id}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-base font-display mt-1.5 leading-snug">{ticket.title}</h3>
                        <p className="text-[10px] text-slate-400 mt-1">📍 {ticket.location.address}</p>
                      </div>

                      {ticket.image && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50">
                          <img 
                            src={ticket.image} 
                            alt="submission preview" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {/* Complaint Details */}
                    <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Complaint Description</p>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{ticket.description}</p>
                    </div>

                    {/* Visual Timeline Tracker */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-xs text-slate-800 font-display uppercase tracking-wider">
                        Live Tracking Timeline & SLA Logs
                      </h4>

                      <div className="space-y-5 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                        {/* Stage 1: Submitted */}
                        <div className="relative">
                          <span className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-white ring-4 ${
                            stepIndex >= 1 ? "bg-indigo-600 ring-indigo-100" : "bg-slate-300 ring-slate-100"
                          }`}></span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h5 className="font-bold text-xs text-slate-800">1. Complaint Submitted Securely</h5>
                              <span className="text-[9px] text-slate-400 font-mono">
                                {new Date(ticket.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Successfully registered in Smart City records. AI evaluated category as **{ticket.category}** and detected citizen sentiment as **{ticket.sentiment}**.
                            </p>
                          </div>
                        </div>

                        {/* Stage 2: Assigned */}
                        <div className="relative">
                          <span className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-white ring-4 ${
                            stepIndex >= 2 ? "bg-indigo-600 ring-indigo-100" : "bg-slate-300 ring-slate-100"
                          }`}></span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h5 className="font-bold text-xs text-slate-800">2. Dispatched to Authority Division</h5>
                              {ticket.assignedAt && (
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {new Date(ticket.assignedAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                            {ticket.assignedTo ? (
                              <div className="text-[11px] text-slate-500 mt-0.5 space-y-1">
                                <p>Assigned to: <strong className="text-slate-700">{ticket.assignedTo}</strong></p>
                                <p>Action Plan Timeline: <strong className="text-slate-700">{ticket.timeline || "Pending Details"}</strong></p>
                                <p className="bg-amber-50/50 border border-amber-100/30 p-2 rounded-lg text-amber-800 leading-normal">
                                  <strong>Technical Action Plan:</strong> {ticket.timelineReason || "Initial diagnostics in progress."}
                                </p>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Awaiting evaluation by city administrators for routing to proper division. High-severity issues are auto-routed in 12 hours.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Stage 3: On-ground Feedback */}
                        {ticket.status === "Assigned" && (
                          <div className="relative">
                            <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-white ring-4 bg-blue-600 ring-blue-100"></span>
                            <div>
                              <h5 className="font-bold text-xs text-slate-800">3. Continuous Field Diagnostics</h5>
                              <div className="text-[11px] text-slate-500 mt-0.5 bg-indigo-50/50 border border-indigo-100/50 p-2.5 rounded-xl space-y-1">
                                <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  Live On-Ground Feedback
                                </span>
                                <p className="italic text-slate-600 leading-relaxed">
                                  "{ticket.authorityFeedback || "Field diagnostics team is dispatching to inspect the spot."}"
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Stage 4: Resolved */}
                        <div className="relative">
                          <span className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-white ring-4 ${
                            ticket.status === "Resolved" ? "bg-emerald-600 ring-emerald-100" : "bg-slate-300 ring-slate-100"
                          }`}></span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h5 className="font-bold text-xs text-slate-800">4. Resolved & Verified</h5>
                              {ticket.resolvedAt && (
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {new Date(ticket.resolvedAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                            {ticket.status === "Resolved" ? (
                              <div className="text-[11px] text-slate-500 mt-0.5 space-y-1">
                                <p className="text-emerald-700 font-semibold">✓ Issue resolved by repair division</p>
                                <p className="bg-emerald-50/50 border border-emerald-100/30 p-2.5 rounded-lg text-emerald-800 leading-normal">
                                  <strong>Technical Resolution Report:</strong> {ticket.authorityFeedback || "Fitted and inspected successfully by Municipal Engineers."}
                                </p>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Resolution documentation will be logged here once the field team finishes work.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-2 text-center max-w-sm mx-auto">
                <Search className="w-8 h-8 text-slate-300 animate-pulse" />
                <h4 className="font-semibold text-xs text-slate-700 mt-1">Timeline Tracker</h4>
                <p className="text-[11px] text-slate-400">Select any complaint from the list on the left to review its live tracking, department assignments, and resolution timeline logs.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "verify" && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-bold text-slate-800 font-display">Government Identity Inspector</h2>
              </div>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                Protect your smart city profile and prevent fraudulent filings. Verify your national identity document (Aadhaar/PAN/Voter ID) securely with Gemini Vision.
              </p>
            </div>
            {currentUser.isVerified && (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Fully Verified
              </span>
            )}
          </div>

          {/* Verification Status Card */}
          {currentUser.isVerified ? (
            <div className="space-y-6">
              {/* Glowing Holographic Aadhaar Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/20 max-w-md mx-auto aspect-[1.6/1] flex flex-col justify-between group">
                {/* Holographic background shines */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>

                {/* Top header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-indigo-300 tracking-wider uppercase block">Government of India</span>
                    <span className="text-[11px] font-bold tracking-tight block">MUNICIPAL DIGITAL CERTIFICATE</span>
                  </div>
                  <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-indigo-300 border border-white/5 font-bold text-[10px] font-mono">
                    ID
                  </div>
                </div>

                {/* Middle details */}
                <div className="flex items-center gap-4 my-auto">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30">
                    <UserCheck className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-indigo-300 font-medium">Verified Citizen Name</div>
                    <div className="text-sm font-bold tracking-wide text-slate-100 font-sans">{currentUser.aadhaarName || currentUser.name}</div>
                  </div>
                </div>

                {/* Bottom details */}
                <div className="flex items-end justify-between border-t border-white/10 pt-3 mt-auto">
                  <div>
                    <div className="text-[8px] text-indigo-300 uppercase font-mono">Unique National ID</div>
                    <div className="text-base font-bold font-mono tracking-widest text-indigo-200 mt-0.5">
                      {currentUser.aadhaarNumber || "XXXX XXXX XXXX"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[9px] font-bold">
                    <Lock className="w-2.5 h-2.5" /> SECURE LINKED
                  </div>
                </div>
              </div>

              {/* Secure Info Alert */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex gap-3 text-xs leading-relaxed text-slate-600 max-w-lg mx-auto">
                <Lock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800">Account Access Protected</h4>
                  <p>
                    Your citizen identity is locked to this phone number (**{currentUser.number}**). No other citizen can submit complaints or register accounts using this Government ID. You can also log in securely using either your Phone number or this Verified Aadhaar ID.
                  </p>
                </div>
              </div>
            </div>
          ) : idSaveSuccess ? (
            <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl text-center space-y-4 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">✓</div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-emerald-900 font-display">Identity Verified & Saved Successfully!</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your Government ID credentials have been permanently secured and linked to your smart city profile. You are now a verified citizen, prioritizing your complaints in our municipal dashboard!
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab("submit");
                  setIdSaveSuccess(false);
                  setIdVerifyResult(null);
                  setIdImageBase64("");
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/10"
              >
                Go Submit Complaint
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Image upload area */}
              {!idImageBase64 ? (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Upload Copy of Government ID / Aadhaar Card</label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-8 text-center transition-all cursor-pointer relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIdImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-all border border-indigo-100">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Drag & drop or click to upload ID card</p>
                        <p className="text-[10px] text-slate-400 mt-1">Supports PNG, JPG, JPEG up to 10MB. Image encoded directly to secure sandbox.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Left: Card Upload Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Uploaded Document Copy</label>
                      <button
                        onClick={() => {
                          setIdImageBase64("");
                          setIdVerifyResult(null);
                          setIdVerifyError(null);
                        }}
                        className="text-xs text-rose-500 hover:underline flex items-center gap-0.5 cursor-pointer font-semibold"
                      >
                        <X className="w-3.5 h-3.5" /> Remove file
                      </button>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-center aspect-[1.6/1] relative overflow-hidden group">
                      <img
                        src={idImageBase64}
                        alt="Gov ID Document"
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full rounded-lg object-contain shadow-md transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                  </div>

                  {/* Right: Inspection Triage Board */}
                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">AI Inspection Control Panel</h4>
                      </div>

                      {/* Not verified yet */}
                      {!idVerifyResult && !verifyingId && (
                        <div className="space-y-3">
                          <p className="text-xs text-slate-600 leading-normal">
                            Click below to run real-time document inspection. Our server-side Gemini Vision AI will analyze the card layout, extract legal text fields, and verify formatting integrity.
                          </p>
                          <button
                            onClick={handleVerifyId}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" /> Run AI ID Inspection
                          </button>
                        </div>
                      )}

                      {/* Loading Inspector */}
                      {verifyingId && (
                        <div className="space-y-4 py-3">
                          <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                            <span className="text-xs font-bold text-slate-700">Gemini Vision OCR Active</span>
                            <span className="text-[10px] text-slate-400">Inspecting layout, validating government holograms & extracting metadata...</span>
                          </div>
                          {/* Animated scanner bar */}
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden relative">
                            <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 h-full w-1/3 rounded-full animate-pulse absolute left-0 right-0"></div>
                          </div>
                        </div>
                      )}

                      {/* Inspection Results displayed */}
                      {idVerifyResult && (
                        <div className="space-y-4 animate-fadeIn">
                          {idVerifyResult.isVerified ? (
                            <div className="space-y-3.5">
                              <div className="bg-emerald-50 border border-emerald-200/50 p-3.5 rounded-xl flex gap-2.5 text-xs text-emerald-800">
                                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                  <h5 className="font-bold">ID Validated Successfully</h5>
                                  <p className="text-[11px] mt-0.5">{idVerifyResult.verificationReason}</p>
                                </div>
                              </div>

                              <div className="space-y-2 border-t border-slate-200 pt-3">
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document Class</p>
                                    <p className="font-bold text-slate-700 mt-0.5">{idVerifyResult.documentType}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Extracted ID Number</p>
                                    <p className="font-mono font-bold text-slate-800 mt-0.5">{idVerifyResult.idNumber}</p>
                                  </div>
                                </div>
                                <div className="text-xs pt-1">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Extracted Legal Name</p>
                                  <p className="font-bold text-slate-700 mt-0.5">{idVerifyResult.idName}</p>
                                </div>
                                {idVerifyResult.idAddress && (
                                  <div className="text-xs pt-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Extracted Address</p>
                                    <p className="font-bold text-slate-700 mt-0.5">{idVerifyResult.idAddress}</p>
                                  </div>
                                )}
                                {idVerifyResult.idPhone && (
                                  <div className="text-xs pt-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Extracted Phone Number</p>
                                    <p className="font-bold text-slate-700 mt-0.5">{idVerifyResult.idPhone}</p>
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={handleSaveVerifiedId}
                                disabled={savingVerifiedId}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                              >
                                {savingVerifiedId ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Securing Certificate...
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-4 h-4" /> Link Verified ID to Profile
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="bg-rose-50 border border-rose-200/50 p-3.5 rounded-xl flex gap-2.5 text-xs text-rose-800">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                  <h5 className="font-bold">AI Inspection Rejected</h5>
                                  <p className="text-[11px] mt-0.5">{idVerifyResult.verificationReason}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setIdImageBase64("");
                                  setIdVerifyResult(null);
                                  setIdVerifyError(null);
                                }}
                                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                Try Different Image
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error messages displayed */}
              {idVerifyError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex gap-3 text-xs leading-normal">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="font-bold">Security Alert</h5>
                    <p>{idVerifyError}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
