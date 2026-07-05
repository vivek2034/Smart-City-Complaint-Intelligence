import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc,
  updateDoc,
  orderBy,
  Timestamp
} from "firebase/firestore";
import appletConfig from "../firebase-applet-config.json";

// Merge config with environment variables (ideal for Vercel / custom production deployments)
const env = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || appletConfig.apiKey || "",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || "",
  projectId: env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || "",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || "",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || "",
  appId: env.VITE_FIREBASE_APP_ID || appletConfig.appId || "",
  firestoreDatabaseId: env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId || "",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore
// Use the custom firestoreDatabaseId if configured
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

export interface UserProfile {
  id: string; // Phone number or Email as unique ID
  name: string;
  number: string;
  address: string;
  email?: string;
  password?: string;
  role: "citizen" | "official";
  aadhaarNumber?: string;
  aadhaarName?: string;
  isVerified?: boolean;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  image?: string; // Stored as base64 data URL ("image to bit or code")
  severity: "High" | "Medium" | "Low";
  sentiment: string;
  keywords: string[];
  status: "Pending" | "Assigned" | "Resolved";
  createdAt: string; // ISO String
  citizenId: string;
  citizenName: string;
  assignedTo?: string; // Department or Official name
  timeline?: string; // Expected duration (e.g. "5 days")
  timelineReason?: string; // Technical plan or reason
  authorityFeedback?: string; // Latest update from field authority
  assignedAt?: string;
  resolvedAt?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

// Collection Helpers
const USERS_COLLECTION = "users";
const COMPLAINTS_COLLECTION = "complaints";

// Recursive helper to sanitize objects before Firestore write
function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as any;
  }
  if (typeof obj === "object") {
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        newObj[key] = cleanUndefined(val);
      }
    }
    return newObj;
  }
  return obj;
}

// LocalStorage Fallback Helpers for robust offline capability
const LOCAL_USERS_KEY = "smartcity_fallback_users";
const LOCAL_COMPLAINTS_KEY = "smartcity_fallback_complaints";

function getLocalUsers(): Record<string, UserProfile> {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalUser(profile: UserProfile) {
  try {
    const users = getLocalUsers();
    users[profile.id] = profile;
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error("Local storage save user failed:", err);
  }
}

function getLocalComplaints(): Complaint[] {
  try {
    const raw = localStorage.getItem(LOCAL_COMPLAINTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalComplaints(list: Complaint[]) {
  try {
    localStorage.setItem(LOCAL_COMPLAINTS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Local storage save complaints failed:", err);
  }
}

// De-duplicate complaints to ensure no duplication on UI (matches by ID, or by combination of Title + Description)
function deduplicateComplaints(list: Complaint[]): Complaint[] {
  const seen = new Set<string>();
  const result: Complaint[] = [];
  for (const c of list) {
    if (!c) continue;
    const idKey = c.id || "";
    const titleKey = (c.title || "").trim();
    const descKey = (c.description || "").trim();
    const contentKey = `${titleKey}_${descKey}`;

    if ((idKey && seen.has(idKey)) || (contentKey && seen.has(contentKey))) {
      continue;
    }
    if (idKey) seen.add(idKey);
    if (contentKey) seen.add(contentKey);
    result.push(c);
  }
  return result;
}


// User Functions
export async function registerUser(profile: UserProfile): Promise<void> {
  // Always update local cache first
  saveLocalUser(profile);
  
  try {
    const userRef = doc(db, USERS_COLLECTION, profile.id);
    const cleaned = cleanUndefined(profile);
    await setDoc(userRef, cleaned);
  } catch (err) {
    console.warn("[Firebase] registerUser failed (client offline or database unprovisioned), using local fallback:", err);
  }
}

export async function getUser(id: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, id);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data() as UserProfile;
      saveLocalUser(data); // update cache
      return data;
    }
  } catch (err) {
    console.warn("[Firebase] getUser failed (client offline or database unprovisioned), using local fallback:", err);
  }
  
  // Fallback to offline cache
  const localUsers = getLocalUsers();
  return localUsers[id] || null;
}

export async function getUserByAadhaar(aadhaarNumber: string): Promise<UserProfile | null> {
  try {
    const q = query(collection(db, USERS_COLLECTION), where("aadhaarNumber", "==", aadhaarNumber));
    const querySnapshot = await getDocs(q);
    let found: UserProfile | null = null;
    querySnapshot.forEach((doc) => {
      found = doc.data() as UserProfile;
    });
    if (found) {
      saveLocalUser(found);
      return found;
    }
  } catch (err) {
    console.warn("[Firebase] getUserByAadhaar failed, falling back to local storage:", err);
  }

  // Local storage fallback
  const localUsers = getLocalUsers();
  for (const userId of Object.keys(localUsers)) {
    if (localUsers[userId].aadhaarNumber === aadhaarNumber) {
      return localUsers[userId];
    }
  }
  return null;
}

export async function checkAadhaarExists(aadhaarNumber: string, currentUserId?: string): Promise<boolean> {
  try {
    const q = query(collection(db, USERS_COLLECTION), where("aadhaarNumber", "==", aadhaarNumber));
    const querySnapshot = await getDocs(q);
    let exists = false;
    querySnapshot.forEach((doc) => {
      if (currentUserId && doc.id !== currentUserId) {
        exists = true;
      } else if (!currentUserId) {
        exists = true;
      }
    });
    if (exists) return true;
  } catch (err) {
    console.warn("[Firebase] checkAadhaarExists failed, falling back to local storage:", err);
  }

  // Fallback to offline cache
  const localUsers = getLocalUsers();
  for (const userId of Object.keys(localUsers)) {
    if (currentUserId && userId === currentUserId) continue;
    if (localUsers[userId].aadhaarNumber === aadhaarNumber) {
      return true;
    }
  }
  return false;
}

// Complaint Functions
export async function createComplaint(complaint: Omit<Complaint, "id">): Promise<string> {
  const mockId = "comp_" + Math.random().toString(36).substring(2, 11);
  const data: Complaint = {
    ...complaint,
    id: mockId,
    createdAt: complaint.createdAt || new Date().toISOString()
  };

  // Add to local cache first
  const localList = getLocalComplaints();
  localList.unshift(data);
  saveLocalComplaints(localList);

  try {
    const complaintsRef = collection(db, COMPLAINTS_COLLECTION);
    const dataWithTimestamp = {
      ...complaint,
      createdAt: complaint.createdAt || new Date().toISOString()
    };
    const cleaned = cleanUndefined(dataWithTimestamp);
    const docRef = await addDoc(complaintsRef, cleaned);
    
    // Save document ID inside the object
    await updateDoc(docRef, { id: docRef.id });
    
    // Update local storage record with the real Firestore ID
    const updatedLocal = getLocalComplaints().map(item => 
      item.id === mockId ? { ...item, id: docRef.id } : item
    );
    saveLocalComplaints(updatedLocal);
    
    return docRef.id;
  } catch (err) {
    console.warn("[Firebase] createComplaint failed (client offline or database unprovisioned), using local fallback:", err);
    return mockId;
  }
}

export async function getAllComplaints(): Promise<Complaint[]> {
  try {
    const complaintsRef = collection(db, COMPLAINTS_COLLECTION);
    const q = query(complaintsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const list: Complaint[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Complaint);
    });
    
    // De-duplicate immediately
    const uniqueList = deduplicateComplaints(list);

    // Update local cache
    if (uniqueList.length > 0) {
      saveLocalComplaints(uniqueList);
    }
    return uniqueList;
  } catch (err) {
    console.warn("[Firebase] getAllComplaints failed (client offline or database unprovisioned), using local fallback:", err);
    const local = getLocalComplaints();
    const uniqueLocal = deduplicateComplaints(local);
    return uniqueLocal.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function getCitizenComplaints(citizenId: string): Promise<Complaint[]> {
  try {
    const complaintsRef = collection(db, COMPLAINTS_COLLECTION);
    const q = query(complaintsRef, where("citizenId", "==", citizenId));
    const querySnapshot = await getDocs(q);
    const list: Complaint[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Complaint);
    });
    const uniqueList = deduplicateComplaints(list);
    return uniqueList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.warn("[Firebase] getCitizenComplaints failed (client offline or database unprovisioned), using local fallback:", err);
    const local = getLocalComplaints();
    const filtered = local.filter(c => c.citizenId === citizenId);
    const uniqueFiltered = deduplicateComplaints(filtered);
    return uniqueFiltered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function updateComplaintStatus(
  id: string, 
  updates: Partial<Pick<Complaint, "status" | "assignedTo" | "timeline" | "timelineReason" | "authorityFeedback" | "assignedAt" | "resolvedAt">>
): Promise<void> {
  // Update local cache first
  const local = getLocalComplaints();
  const updatedLocal = local.map(item => 
    item.id === id ? { ...item, ...updates } : item
  );
  saveLocalComplaints(updatedLocal);

  try {
    const complaintRef = doc(db, COMPLAINTS_COLLECTION, id);
    const cleaned = cleanUndefined(updates);
    await updateDoc(complaintRef, cleaned);
  } catch (err) {
    console.warn("[Firebase] updateComplaintStatus failed (client offline or database unprovisioned), using local fallback:", err);
  }
}

// Seed Initial Mock Complaints if database is empty
export async function seedInitialComplaintsIfEmpty(): Promise<void> {
  try {
    // 1. Seed official users to local cache so they are always available offline
    const defaultOfficials: UserProfile[] = [
      {
        id: "admin@city.gov.in",
        name: "Commissioner Kanpur",
        number: "1234567890",
        address: "Municipal Corporation, Kanpur",
        email: "admin@city.gov.in",
        password: "password123",
        role: "official"
      },
      {
        id: "official@city.gov.in",
        name: "Municipal Inspector",
        number: "0987654321",
        address: "Municipal Corporation, Kanpur",
        email: "official@city.gov.in",
        password: "officialpass",
        role: "official"
      }
    ];

    for (const off of defaultOfficials) {
      saveLocalUser(off);
      try {
        const existing = await getUser(off.id);
        if (!existing) {
          await registerUser(off);
        }
      } catch (e) {
        console.warn(`[Firebase Seed] Failed to seed official ${off.id} to cloud:`, e);
      }
    }

    // 2. Check complaints
    let complaintsList: Complaint[] = [];
    try {
      complaintsList = await getAllComplaints();
    } catch (e) {
      console.warn("[Firebase Seed] Failed to fetch complaints for seed check, falling back to local:", e);
      complaintsList = getLocalComplaints();
    }

    const localList = getLocalComplaints();
    if (complaintsList.length > 0 || localList.length > 0) {
      // Also ensure that if they had duplicates, we overwrite with the deduplicated lists!
      if (complaintsList.length > 0) {
        saveLocalComplaints(deduplicateComplaints(complaintsList));
      } else if (localList.length > 0) {
        saveLocalComplaints(deduplicateComplaints(localList));
      }
      return;
    }

    const mockComplaints: Omit<Complaint, "id">[] = [
      {
        title: "Deep Pothole near Main Market Intersection",
        description: "There is an extremely deep pothole near the Main Market clock tower. Yesterday, a scooter rider almost crashed. It is heavily flooded and invisible during the rain.",
        category: "Roads & Traffic",
        severity: "High",
        sentiment: "Angry / Anxious",
        keywords: ["pothole", "accident", "traffic", "clock tower", "flooded"],
        status: "Pending",
        createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
        citizenId: "9876543210",
        citizenName: "Ramesh Kumar",
        location: {
          lat: 12.9716,
          lng: 77.5946,
          address: "Main Market Road, Sector 4, near Clock Tower"
        }
      },
      {
        title: "Overflowing Garbage Bin spreading bad smell",
        description: "The community dumpster hasn't been cleared for over a week. Strays are scattering the plastic waste everywhere and the smell is unbearable. School children pass through here daily.",
        category: "Sanitation & Waste",
        severity: "Medium",
        sentiment: "Disgusted",
        keywords: ["garbage", "stray dogs", "smell", "dumpster", "sanitation"],
        status: "Assigned",
        createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), // 5 days ago
        citizenId: "9876543210",
        citizenName: "Ramesh Kumar",
        assignedTo: "Waste Management Division",
        timeline: "2 Days",
        timelineReason: "Deploying a secondary municipal waste collector vehicle to clean and sanitize the spot.",
        authorityFeedback: "Vehicle dispatched. Clearance in progress.",
        assignedAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
        location: {
          lat: 12.9800,
          lng: 77.6000,
          address: "Street 7, Sector 2, opposite City High School"
        }
      },
      {
        title: "Broken Street Light - Major Safety Hazard",
        description: "The entire lane is completely dark at night because three consecutive street lights are broken. Girls and elderly feel unsafe walking past 7 PM.",
        category: "Electricity & Power",
        severity: "High",
        sentiment: "Scared / Concerned",
        keywords: ["street light", "darkness", "broken", "safety", "hazard"],
        status: "Resolved",
        createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(), // 10 days ago
        citizenId: "9876543210",
        citizenName: "Ramesh Kumar",
        assignedTo: "Electrical Works Dept",
        timeline: "4 Days",
        timelineReason: "Replacement of LED panels and faulty underground cabling.",
        authorityFeedback: "All bulbs replaced. Underground cable joint repaired.",
        assignedAt: new Date(Date.now() - 3600000 * 24 * 9).toISOString(),
        resolvedAt: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
        location: {
          lat: 12.9600,
          lng: 77.5850,
          address: "Block B, Lane 3, Residential Enclave"
        }
      },
      {
        title: "Broken Water Pipe with Drinking Water Leaking",
        description: "Fresh drinking water has been gushing out of a fractured pipe on the main street since early morning. Hundreds of gallons of clean water are being wasted while our houses have low pressure.",
        category: "Water & Sewage",
        severity: "High",
        sentiment: "Frustrated / Shocked",
        keywords: ["water leakage", "drinking water", "pipe leak", "water waste"],
        status: "Pending",
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(), // 6 hours ago
        citizenId: "8765432109",
        citizenName: "Anjali Sharma",
        location: {
          lat: 12.9650,
          lng: 77.5900,
          address: "Opposite Grand Mall Main Entrance, Central Avenue"
        }
      }
    ];

    for (const c of mockComplaints) {
      await createComplaint(c);
    }
    console.log("[Firebase Seed] Seeded initial complaints successfully.");
  } catch (err) {
    console.error("[Firebase Seed] Error seeding:", err);
  }
}
