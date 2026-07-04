import { useState, useEffect } from "react";
import { 
  seedInitialComplaintsIfEmpty, 
  getAllComplaints, 
  Complaint, 
  UserProfile 
} from "./firebase";
import HomeDetails from "./components/HomeDetails";
import LoginPortal from "./components/LoginPortal";
import CitizenPortal from "./components/CitizenPortal";
import AuthorityPortal from "./components/AuthorityPortal";
import { Building2, Home, User, Users, LogOut, Loader2, Info } from "lucide-react";

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [activeTab, setActiveTab] = useState<"home" | "citizen">("home");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  // Monitor popstate for browser back/forward and path updates
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };

  // Read session from localStorage on mount & seed initial data
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      try {
        // 1. Seed initial data if empty so the map and analytics aren't blank
        await seedInitialComplaintsIfEmpty();
        
        // 2. Fetch all complaints
        const list = await getAllComplaints();
        setComplaints(list);

        // 3. Load user session
        const storedUser = localStorage.getItem("smartcity_user");
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }

        // 4. Set tab based on pathname on load
        const path = window.location.pathname.toLowerCase();
        if (path === "/citizen") {
          setActiveTab("citizen");
        } else {
          setActiveTab("home");
        }
      } catch (err) {
        console.error("App initialization error:", err);
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  const refreshComplaintsList = async () => {
    try {
      const list = await getAllComplaints();
      setComplaints(list);
    } catch (err) {
      console.error("Failed to refresh complaints list:", err);
    }
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem("smartcity_user", JSON.stringify(user));
    // Automatically transition to the correct portal tab or path
    if (user.role === "citizen") {
      setActiveTab("citizen");
      navigateTo("/citizen");
    } else {
      navigateTo("/Authority");
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem("smartcity_user");
    setActiveTab("home");
    navigateTo("/");
  };

  const handleSelectComplaint = (c: Complaint) => {
    setSelectedComplaint(c);
    // If selecting a complaint, make sure we show the map visually on the home screen
    setActiveTab("home");
    navigateTo("/");
  };

  const isAuthorityRoute = currentPath.toLowerCase() === "/authority";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div 
          onClick={() => {
            setActiveTab("home");
            navigateTo("/");
          }}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/10 transition-transform group-hover:scale-105">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block font-display leading-none">
              Smart City Node
            </span>
            <h1 className="font-extrabold text-sm md:text-base text-slate-800 tracking-tight leading-tight font-display">
              Complaint Intelligence
            </h1>
          </div>
        </div>

        {/* Navigation Tabs (Only Citizen and Home visible for public citizens) */}
        {!isAuthorityRoute && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setActiveTab("home");
                navigateTo("/");
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "home"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              Home Command
            </button>

            <button
              onClick={() => {
                setActiveTab("citizen");
                navigateTo("/citizen");
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "citizen"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Citizen Portal
            </button>
          </nav>
        )}

        {/* Separate Authority Specific Header status */}
        {isAuthorityRoute && (
          <div className="hidden md:flex items-center gap-2 bg-indigo-50 border border-indigo-100/50 px-4 py-2 rounded-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            <span className="text-xs font-bold text-indigo-700 font-display uppercase tracking-wider">
              Secure Municipal Desk (/Authority)
            </span>
          </div>
        )}

        {/* User Session Indicators */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:block text-right">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block leading-none">
                  Logged as {currentUser.role}
                </span>
                <span className="text-xs font-semibold text-slate-700 block mt-0.5">
                  {currentUser.name}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-xs">
                {currentUser.name[0].toUpperCase()}
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (isAuthorityRoute) {
                    // Do nothing or keep on authority
                  } else {
                    setActiveTab("citizen");
                    navigateTo("/citizen");
                  }
                }}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-xs px-3.5 py-2 rounded-xl border border-indigo-100 transition-all cursor-pointer"
              >
                {isAuthorityRoute ? "Admin Restricted" : "Sign In"}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      {!isAuthorityRoute && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 py-2 flex justify-around sticky top-[61px] z-40 shadow-sm">
          <button
            onClick={() => {
              setActiveTab("home");
              navigateTo("/");
            }}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-semibold transition-all cursor-pointer ${
              activeTab === "home" ? "text-indigo-600" : "text-slate-400 hover:text-slate-700"
            }`}
          >
            <Home className="w-4 h-4" />
            Home
          </button>

          <button
            onClick={() => {
              setActiveTab("citizen");
              navigateTo("/citizen");
            }}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-semibold transition-all cursor-pointer ${
              activeTab === "citizen" ? "text-indigo-600" : "text-slate-400 hover:text-slate-700"
            }`}
          >
            <User className="w-4 h-4" />
            Citizen
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 md:py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-80 gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-xs font-semibold">Contacting smart city records...</span>
          </div>
        ) : (
          (() => {
            // Check if user is trying to access secure Authority path link
            if (isAuthorityRoute) {
              if (currentUser && currentUser.role === "official") {
                return (
                  <AuthorityPortal
                    currentUser={currentUser}
                    allComplaints={complaints}
                    onRefreshComplaints={refreshComplaintsList}
                  />
                );
              } else {
                return (
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="text-center space-y-2">
                      <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <h2 className="text-xl font-bold text-slate-800">Secure Municipal Desk</h2>
                      <p className="text-xs text-slate-500">Authorized personnel secure login route.</p>
                    </div>
                    <LoginPortal
                      initialRole="official"
                      onLoginSuccess={handleLoginSuccess}
                      onBack={() => {
                        navigateTo("/");
                        setActiveTab("home");
                      }}
                    />
                  </div>
                );
              }
            }

            // Normal Citizen/Public views
            switch (activeTab) {
              case "home":
                return (
                  <HomeDetails
                    complaints={complaints}
                    onSelectComplaint={handleSelectComplaint}
                    selectedComplaint={selectedComplaint}
                    onNavigateToLogin={(role) => {
                      if (role === "official") {
                        navigateTo("/Authority");
                      } else {
                        setActiveTab("citizen");
                        navigateTo("/citizen");
                      }
                    }}
                  />
                );

              case "citizen":
                if (currentUser && currentUser.role === "citizen") {
                  return (
                    <CitizenPortal
                      currentUser={currentUser}
                      allComplaints={complaints}
                      onRefreshComplaints={refreshComplaintsList}
                    />
                  );
                } else {
                  return (
                    <LoginPortal
                      initialRole="citizen"
                      onLoginSuccess={handleLoginSuccess}
                      onBack={() => {
                        navigateTo("/");
                        setActiveTab("home");
                      }}
                    />
                  );
                }

              default:
                return null;
            }
          })()
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 px-4 md:px-8 py-6 text-xs mt-auto">
        <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-slate-800 rounded text-slate-300">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-semibold font-display text-slate-300">
              Smart City Command & SLA Redressal Bureau
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateTo("/Authority")}
              className="text-slate-400 hover:text-white hover:underline font-bold transition-all cursor-pointer"
            >
              🔒 Municipal Desk (/Authority)
            </button>
            <div className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dual Access Portal. Certified by Digital India & Municipal Act.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
