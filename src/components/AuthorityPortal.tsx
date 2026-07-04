import React, { useState, useEffect } from "react";
import { updateComplaintStatus, Complaint, UserProfile } from "../firebase";
import { 
  CheckCircle, 
  User, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Shuffle, 
  RefreshCw, 
  Send, 
  MessageSquare,
  Sparkles,
  Search,
  Loader2
} from "lucide-react";

interface AuthorityPortalProps {
  currentUser: UserProfile;
  allComplaints: Complaint[];
  onRefreshComplaints: () => void;
}

export default function AuthorityPortal({ currentUser, allComplaints, onRefreshComplaints }: AuthorityPortalProps) {
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Assignment form state
  const [assignedDept, setAssignedDept] = useState("Road Operations Division");
  const [timeline, setTimeline] = useState("3 Days");
  const [reason, setReason] = useState("");

  // Feedback input
  const [agencyFeedback, setAgencyFeedback] = useState("");
  const [updatingFeedback, setUpdatingFeedback] = useState(false);

  // Custom Inline Alert & Confirmation States
  const [assignError, setAssignError] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);

  const selectedComplaint = allComplaints.find(c => c.id === selectedComplaintId);

  // Reset errors and resolve status whenever selected complaint changes
  useEffect(() => {
    setAssignError(null);
    setFeedbackError(null);
    setShowResolveConfirm(false);
  }, [selectedComplaintId]);

  // Sorting complaints: High severity first, then Medium, then Low!
  // This satisfies: "ai will analyze everything and give decide what is Severity of complaint and which one should be take action first"
  const getSeverityScore = (sev: string) => {
    if (sev === "High") return 3;
    if (sev === "Medium") return 2;
    return 1;
  };

  const sortedComplaints = [...allComplaints].sort((a, b) => {
    // High severity first, then newest first
    const scoreA = getSeverityScore(a.severity);
    const scoreB = getSeverityScore(b.severity);
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError(null);
    if (!selectedComplaintId || !reason.trim()) {
      setAssignError("Please specify a reason and action plan for assignment.");
      return;
    }

    setSubmitting(true);
    try {
      await updateComplaintStatus(selectedComplaintId, {
        status: "Assigned",
        assignedTo: assignedDept,
        timeline: timeline,
        timelineReason: reason.trim(),
        assignedAt: new Date().toISOString(),
        authorityFeedback: "Department notified. Awaiting crew dispatch."
      });
      setReason("");
      onRefreshComplaints();
    } catch (err) {
      console.error("Failed to assign:", err);
      setAssignError("Assignment failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Simulate authority feedback loop update
  const handleUpdateFeedback = async () => {
    setFeedbackError(null);
    if (!selectedComplaintId || !agencyFeedback.trim()) {
      setFeedbackError("Please enter field feedback log text.");
      return;
    }

    setUpdatingFeedback(true);
    try {
      await updateComplaintStatus(selectedComplaintId, {
        authorityFeedback: agencyFeedback.trim()
      });
      setAgencyFeedback("");
      onRefreshComplaints();
    } catch (err) {
      console.error("Failed to update feedback:", err);
      setFeedbackError("Failed to update feedback. Please try again.");
    } finally {
      setUpdatingFeedback(false);
    }
  };

  // Mark as Resolved confirmation trigger
  const handleResolve = () => {
    if (!selectedComplaintId) return;
    setShowResolveConfirm(true);
  };

  // Actual Resolution Function after confirmation
  const confirmAndResolve = async () => {
    if (!selectedComplaintId) return;

    setSubmitting(true);
    try {
      await updateComplaintStatus(selectedComplaintId, {
        status: "Resolved",
        resolvedAt: new Date().toISOString(),
        authorityFeedback: "Task completed successfully. Resolved and inspected by Chief City Engineer."
      });
      setShowResolveConfirm(false);
      onRefreshComplaints();
    } catch (err) {
      console.error("Failed to resolve:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar List of Complaints: Prioritized by AI (High Severity First!) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1 space-y-4">
        <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm font-display uppercase tracking-wider">Prioritized Tickets</h3>
            <p className="text-[10px] text-slate-400">AI-computed Severity (High Priority First)</p>
          </div>
          <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
            Triage Active
          </span>
        </div>

        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {sortedComplaints.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-10">No complaints logged in system.</p>
          ) : (
            sortedComplaints.map((c) => {
              const isHigh = c.severity === "High";
              const isPending = c.status === "Pending";

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedComplaintId(c.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 cursor-pointer relative ${
                    selectedComplaintId === c.id
                      ? "bg-indigo-50/50 border-indigo-200 shadow-sm"
                      : "bg-white border-slate-100 hover:border-slate-200"
                  }`}
                >
                  {isHigh && isPending && (
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      c.severity === "High" ? "bg-red-100 text-red-700" :
                      c.severity === "Medium" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                    }`}>
                      {c.severity} Severity
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
                    <span className="truncate">📍 {c.location.address}</span>
                  </p>
                  
                  {isHigh && isPending && (
                    <div className="text-[9px] font-semibold text-red-600 flex items-center gap-0.5 mt-0.5 bg-red-50 px-1.5 py-0.5 rounded-md self-start">
                      🔥 Action Advised
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Detail & Action Panel */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        {selectedComplaint ? (
          <div className="space-y-6 animate-fadeIn">
            {/* Header section with category and metadata */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    selectedComplaint.severity === "High" ? "bg-red-100 text-red-700" :
                    selectedComplaint.severity === "Medium" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                  }`}>
                    {selectedComplaint.severity} Severity
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono">
                    ID: {selectedComplaint.id}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-base font-display mt-1.5 leading-snug">{selectedComplaint.title}</h3>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <span>📍 {selectedComplaint.location.address}</span>
                  <span>•</span>
                  <span>Citizen: <strong className="text-slate-600 font-medium">{selectedComplaint.citizenName} ({selectedComplaint.citizenId})</strong></span>
                </p>
              </div>

              {selectedComplaint.image && (
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50">
                  <img 
                    src={selectedComplaint.image} 
                    alt="complaint snapshot" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* AI Diagnostics Overview */}
            <div className="bg-indigo-50/50 border border-indigo-100/60 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-indigo-700">
                <Sparkles className="w-4 h-4" />
                <h4 className="font-bold text-xs uppercase tracking-wider font-display">NVIDIA Mistral AI Diagnostics</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Category Recommendation</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedComplaint.category}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Computed Severity</p>
                  <p className={`font-bold mt-0.5 ${
                    selectedComplaint.severity === "High" ? "text-red-600" : "text-amber-600"
                  }`}>{selectedComplaint.severity}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Detected Sentiment</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedComplaint.sentiment}</p>
                </div>
              </div>
              {selectedComplaint.keywords && selectedComplaint.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-indigo-100/40">
                  {selectedComplaint.keywords.map((kw, i) => (
                    <span key={i} className="text-[9px] bg-white border border-indigo-100/50 px-2 py-0.5 rounded text-indigo-600 font-medium">
                      #{kw}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Main Text Content */}
            <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Citizen Statement</p>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{selectedComplaint.description}</p>
            </div>

            {/* Action 1: Assign to properly qualified department (SLA timeline Commitment) */}
            {selectedComplaint.status === "Pending" ? (
              <form onSubmit={handleAssign} className="bg-slate-50/30 border border-slate-200/60 p-5 rounded-xl space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-xs text-slate-800 font-display uppercase tracking-wider">
                    SLA Assignment & Commitment Form
                  </h4>
                  <p className="text-[10px] text-slate-400">Specify departmental division, commit to fix timeline and state technical action plan.</p>
                </div>

                {assignError && (
                  <div className="text-[11px] text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-xl flex items-center gap-1.5">
                    <span className="font-bold">⚠️</span>
                    <span>{assignError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Department selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Division</label>
                    <select
                      value={assignedDept}
                      onChange={(e) => setAssignedDept(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="Road Operations Division">Road Operations Division</option>
                      <option value="Municipal Sanitation Dept">Municipal Sanitation Dept</option>
                      <option value="Water Supply & Sewage Board (BWSSB)">Water Supply & Sewage Board (BWSSB)</option>
                      <option value="Electrical & Power Grid Repairs">Electrical & Power Grid Repairs</option>
                      <option value="City Public Safety & Hazards Team">City Public Safety & Hazards Team</option>
                      <option value="Social Services Welfare Committee">Social Services Welfare Committee</option>
                    </select>
                  </div>

                  {/* Specific Timeline */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Specific Timeline</label>
                    <select
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="12 Hours">12 Hours (Emergency SLA)</option>
                      <option value="24 Hours">24 Hours (Urgent SLA)</option>
                      <option value="3 Days">3 Days (Standard SLA)</option>
                      <option value="5 Days">5 Days (Moderate SLA)</option>
                      <option value="7 Days">7 Days (Standard project SLA)</option>
                    </select>
                  </div>
                </div>

                {/* Technical Reason / action plan */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Technical Action Plan / Reason</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    placeholder="Provide a specific plan of action to both field engineers and citizens. (e.g., Dispatching road roller crew to dig up and repave with fresh concrete)"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {submitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Commit Timeline & Assign Division"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Already Assigned or Resolved ticket logs */
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/50 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h4 className="font-bold text-xs text-slate-800 font-display uppercase tracking-wider">
                    SLA Commitment Log
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Assigned</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium">Assigned Authority</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedComplaint.assignedTo}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium">Resolution Timeline Commitment</span>
                    <p className="font-semibold text-indigo-600 mt-0.5">{selectedComplaint.timeline}</p>
                  </div>
                </div>

                <div className="text-xs bg-white p-3 rounded-lg border border-slate-200/50 leading-relaxed text-slate-600">
                  <strong>Technical Action Plan:</strong> {selectedComplaint.timelineReason}
                </div>

                {/* Continuous Feedback loop from authorities */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                    On-Ground Field Agency Updates & Feedback Loop
                  </span>
                  
                  <div className="bg-slate-100 p-3 rounded-lg italic text-xs text-slate-600 leading-normal">
                    "{selectedComplaint.authorityFeedback || "No logs posted by dispatch team yet."}"
                  </div>

                  {feedbackError && (
                    <div className="text-[11px] text-red-600 bg-red-50 border border-red-100 p-2 rounded-lg">
                      ⚠️ {feedbackError}
                    </div>
                  )}

                  {/* Simulate authority posting field updates */}
                  {selectedComplaint.status === "Assigned" && (
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={agencyFeedback}
                        onChange={(e) => setAgencyFeedback(e.target.value)}
                        placeholder="Log new field crew update... (e.g. Excavators arrived, materials dispatched)"
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                      />
                      <button
                        onClick={handleUpdateFeedback}
                        disabled={updatingFeedback || !agencyFeedback.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-3 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        {updatingFeedback ? "Updating..." : "Log Feedback"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Resolve Ticket Button */}
                {selectedComplaint.status === "Assigned" && (
                  <div className="pt-2 flex flex-col items-end gap-3 border-t border-slate-100 pt-3">
                    {showResolveConfirm ? (
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-left w-full space-y-3 animate-fadeIn">
                        <div className="flex items-start gap-2.5">
                          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-bold text-xs text-emerald-800">Confirm Ticket Resolution</h5>
                            <p className="text-[11px] text-emerald-600 mt-0.5">
                              Are you sure you want to mark this issue as resolved and close the ticket? This will notify the citizen.
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setShowResolveConfirm(false)}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1 rounded-lg transition-all cursor-pointer font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={confirmAndResolve}
                            disabled={submitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1"
                          >
                            {submitting ? "Resolving..." : "Yes, Close Ticket"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleResolve}
                        disabled={submitting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Resolved (Close Ticket)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-28 text-slate-400 gap-2 text-center max-w-sm mx-auto">
            <Search className="w-8 h-8 text-slate-300 animate-pulse" />
            <h4 className="font-semibold text-xs text-slate-700 mt-1">Select a Ticket</h4>
            <p className="text-[11px] text-slate-400">
              Select any submitted municipal complaint from the priority registry list on the left. The system ranks entries using AI analysis with High severity security threats prioritized first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
