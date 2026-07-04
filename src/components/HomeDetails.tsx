import { useState } from "react";
import { 
  Building2, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Layers, 
  ExternalLink, 
  ChevronRight, 
  ShieldAlert,
  Info,
  Calendar
} from "lucide-react";
import { Complaint } from "../firebase";
import MapComponent from "./MapComponent";
import DashboardCharts from "./DashboardCharts";
import AiAssistant from "./AiAssistant";

interface HomeDetailsProps {
  complaints: Complaint[];
  onSelectComplaint?: (c: Complaint) => void;
  selectedComplaint?: Complaint | null;
  onNavigateToLogin: (role?: "citizen" | "official") => void;
}

export default function HomeDetails({
  complaints,
  onSelectComplaint,
  selectedComplaint,
  onNavigateToLogin
}: HomeDetailsProps) {
  const [activeTab, setActiveTab] = useState<"map" | "analytics">("map");

  // Calculate Metrics
  const totalCount = complaints.length;
  const resolvedCount = complaints.filter(c => c.status === "Resolved").length;
  const pendingCount = complaints.filter(c => c.status === "Pending").length;
  const assignedCount = complaints.filter(c => c.status === "Assigned").length;
  const activePending = pendingCount + assignedCount;

  const todayStr = new Date().toDateString();
  const todayCount = complaints.filter(c => {
    try {
      return new Date(c.createdAt).toDateString() === todayStr;
    } catch {
      return false;
    }
  }).length;

  // Average Resolution Time Calculation (mocked or computed from actual resolved tickets)
  const avgResolutionTime = "3.2 Days";

  // Useful government portals
  const governmentLinks = [
    { name: "Municipal Corporation Portal", desc: "Local city administration services", url: "https://www.digitalindia.gov.in" },
    { name: "State Water Supply Board", desc: "Water connection, sewage clearance", url: "https://www.digitalindia.gov.in" },
    { name: "Electricity Distribution Corp", desc: "Grid management & transformer reporting", url: "https://www.digitalindia.gov.in" },
    { name: "City Traffic Police & Hazards", desc: "Real-time traffic hazard warnings", url: "https://www.digitalindia.gov.in" },
    { name: "National Cyber Crime Reporting", desc: "Centralized cyber safety registry", url: "https://www.digitalindia.gov.in" },
    { name: "National Grievance Redressal (CPGRAMS)", desc: "Central government feedback cell", url: "https://pgportal.gov.in" }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-10 text-white shadow-xl overflow-hidden border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)]"></div>
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300">
            <Building2 className="w-3.5 h-3.5" />
            Smart City Municipal Council
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold font-display tracking-tight leading-tight">
            Smart City Complaint <span className="text-indigo-400">Intelligence</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl">
            A state-of-the-art dual portal for citizens and authorities. Report civic concerns with photos, instantly categorized and triaged with NVIDIA Mistral-Large AI, committed to strict resolution timelines and continuous feedback loops.
          </p>
          <div className="flex flex-wrap gap-3.5 pt-2">
            <button
              onClick={() => onNavigateToLogin("citizen")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 flex items-center gap-1 cursor-pointer"
            >
              Citizen Portal <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateToLogin("official")}
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border border-slate-700 flex items-center gap-1 cursor-pointer"
            >
              Authorities Portal <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Key Metrics Section */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Total Reports</span>
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 font-mono">{totalCount}</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Logged in system</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Today's Intake</span>
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 font-mono">{todayCount}</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Reported today</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Pending Inspection</span>
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 font-mono">{activePending}</h3>
            <p className="text-[10px] text-rose-500 font-semibold mt-0.5">
              {pendingCount} unassigned
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Resolved Tickets</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 font-mono">{resolvedCount}</h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              {totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0}% success rate
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Avg Resolution Time</span>
            <div className="p-1.5 bg-sky-50 rounded-lg text-sky-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 font-mono">{avgResolutionTime}</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">SLA achievement target</p>
          </div>
        </div>
      </div>

      {/* Main Core Section: Interactive Hotspots Map & AI Chat assistant side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map & Analytics Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-800 font-display">City Command Dashboard</h2>
            </div>
            
            {/* Map/Analytics toggle */}
            <div className="bg-slate-100 p-0.5 rounded-lg flex gap-1">
              <button
                onClick={() => setActiveTab("map")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === "map" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Hotspots Map
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === "analytics" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                City Analytics
              </button>
            </div>
          </div>

          <div className="h-[420px]">
            {activeTab === "map" ? (
              <MapComponent 
                complaints={complaints} 
                onSelectComplaint={onSelectComplaint}
                selectedComplaintId={selectedComplaint?.id}
              />
            ) : (
              <div className="overflow-y-auto h-full pr-1">
                <DashboardCharts complaints={complaints} />
              </div>
            )}
          </div>

          {/* If a complaint is selected on map, show quick floating detail card */}
          {selectedComplaint && (
            <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-4 flex gap-4 animate-fadeIn relative">
              <button 
                onClick={() => onSelectComplaint && onSelectComplaint(null as any)}
                className="absolute top-2 right-3 text-slate-400 hover:text-slate-600 font-mono text-xs font-bold"
              >
                ✕
              </button>
              {selectedComplaint.image && (
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-indigo-200/50 bg-white">
                  <img 
                    src={selectedComplaint.image} 
                    alt="complaint visual" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    selectedComplaint.severity === "High" ? "bg-red-100 text-red-700" :
                    selectedComplaint.severity === "Medium" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                  }`}>
                    {selectedComplaint.severity} Severity
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">
                    {selectedComplaint.category}
                  </span>
                </div>
                <h4 className="font-semibold text-xs text-slate-900">{selectedComplaint.title}</h4>
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{selectedComplaint.description}</p>
                <p className="text-[10px] text-slate-400 font-medium">📍 {selectedComplaint.location.address}</p>
              </div>
            </div>
          )}
        </div>

        {/* AI Assistant Sidebar */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 font-display mb-4 flex items-center gap-1.5">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            AI Portal Assistant
          </h2>
          <AiAssistant />
        </div>
      </div>

      {/* Grid: Nearby complaints & Government Portal Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Nearby complaints */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-800 font-display uppercase tracking-wider">
              Recent Complaints Registry
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">Total {totalCount} registered</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-1">
            {complaints.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No complaints submitted yet.</p>
            ) : (
              complaints.slice(0, 5).map((c) => (
                <div key={c.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        c.severity === "High" ? "bg-red-500" :
                        c.severity === "Medium" ? "bg-orange-500" : "bg-green-500"
                      }`}></span>
                      <h4 className="font-semibold text-xs text-slate-800 truncate">{c.title}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{c.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="font-medium">📁 {c.category}</span>
                      <span>•</span>
                      <span>📍 {c.location.address}</span>
                      <span>•</span>
                      <span className="font-mono">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.status === "Resolved" ? "bg-green-100 text-green-700" :
                      c.status === "Assigned" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {c.status}
                    </span>
                    <button
                      onClick={() => onSelectComplaint && onSelectComplaint(c)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      Locate Pin 📍
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Useful Government Portals */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-800 font-display uppercase tracking-wider">
              Government Useful Portals
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">External Links</span>
          </div>

          <div className="space-y-3">
            {governmentLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="group block p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                    {link.name}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">{link.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
