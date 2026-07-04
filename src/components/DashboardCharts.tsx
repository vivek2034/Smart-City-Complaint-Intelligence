import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  CartesianGrid 
} from "recharts";
import { Complaint } from "../firebase";

interface DashboardChartsProps {
  complaints: Complaint[];
}

export default function DashboardCharts({ complaints }: DashboardChartsProps) {
  // 1. Complaint Categories
  const categoriesMap: { [key: string]: number } = {
    "Roads & Traffic": 0,
    "Sanitation & Waste": 0,
    "Water & Sewage": 0,
    "Electricity & Power": 0,
    "Public Safety": 0,
    "Others": 0
  };

  complaints.forEach((c) => {
    const cat = c.category || "Others";
    if (categoriesMap[cat] !== undefined) {
      categoriesMap[cat]++;
    } else {
      categoriesMap["Others"]++;
    }
  });

  const categoryData = Object.keys(categoriesMap).map((key) => ({
    name: key,
    value: categoriesMap[key]
  })).filter(item => item.value > 0);

  const CATEGORY_COLORS = ["#6366f1", "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#94a3b8"];

  // 2. Severity
  const severityMap = { High: 0, Medium: 0, Low: 0 };
  complaints.forEach((c) => {
    const sev = c.severity || "Low";
    if (severityMap[sev] !== undefined) {
      severityMap[sev]++;
    }
  });

  const severityData = [
    { name: "High", count: severityMap.High, fill: "#ef4444" },
    { name: "Medium", count: severityMap.Medium, fill: "#f97316" },
    { name: "Low", count: severityMap.Low, fill: "#22c55e" }
  ];

  // 3. Monthly Trend (Using last 6 months or simple dynamic trend)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyMap: { [key: string]: { total: number; resolved: number } } = {};

  // Build last 6 months list dynamically to cover mock data beautifully
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mLabel = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
    monthlyMap[mLabel] = { total: 0, resolved: 0 };
  }

  complaints.forEach((c) => {
    const date = new Date(c.createdAt);
    const mLabel = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
    if (monthlyMap[mLabel]) {
      monthlyMap[mLabel].total++;
      if (c.status === "Resolved") {
        monthlyMap[mLabel].resolved++;
      }
    }
  });

  const trendData = Object.keys(monthlyMap).map((key) => ({
    month: key,
    "Submitted": monthlyMap[key].total,
    "Resolved": monthlyMap[key].resolved
  }));

  // 4. Ward-wise Complaints (Grouped by Sector / Location terms)
  const wardMap: { [key: string]: number } = {
    "Sector 1": 0,
    "Sector 2": 0,
    "Sector 3": 0,
    "Sector 4": 0,
    "Sectors (Other)": 0
  };

  complaints.forEach((c) => {
    const address = (c.location.address || "").toLowerCase();
    if (address.includes("sector 1")) {
      wardMap["Sector 1"]++;
    } else if (address.includes("sector 2")) {
      wardMap["Sector 2"]++;
    } else if (address.includes("sector 3")) {
      wardMap["Sector 3"]++;
    } else if (address.includes("sector 4")) {
      wardMap["Sector 4"]++;
    } else {
      wardMap["Sectors (Other)"]++;
    }
  });

  const wardData = Object.keys(wardMap).map((key) => ({
    name: key,
    "Complaints": wardMap[key]
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Chart 1: Category Breakdown */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[320px]">
        <h4 className="font-semibold text-sm text-slate-800 mb-2 font-display uppercase tracking-wider">
          Complaint Categories
        </h4>
        <div className="flex-1 min-h-0">
          {categoryData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
              No complaint category data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid #f1f5f9" }}
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ fontSize: "10px", color: "#64748b" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chart 2: Severity Levels */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[320px]">
        <h4 className="font-semibold text-sm text-slate-800 mb-2 font-display uppercase tracking-wider">
          Severity Breakdown
        </h4>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={severityData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: "rgba(241, 245, 249, 0.4)" }}
                contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid #f1f5f9" }}
              />
              <Bar dataKey="count" name="Complaints" radius={[6, 6, 0, 0]} maxBarSize={45}>
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Monthly Trends */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[320px]">
        <h4 className="font-semibold text-sm text-slate-800 mb-2 font-display uppercase tracking-wider">
          Monthly Intake Trend
        </h4>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid #f1f5f9" }}
              />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Line type="monotone" dataKey="Submitted" stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Resolved" stroke="#10b981" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 4: Ward-wise distribution */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[320px]">
        <h4 className="font-semibold text-sm text-slate-800 mb-2 font-display uppercase tracking-wider">
          Sector Distribution
        </h4>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wardData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: "rgba(241, 245, 249, 0.4)" }}
                contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid #f1f5f9" }}
              />
              <Bar dataKey="Complaints" fill="#818cf8" radius={[6, 6, 0, 0]} maxBarSize={45} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
