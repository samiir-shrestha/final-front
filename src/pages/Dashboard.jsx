import { useEffect, useState } from "react";
import { downloadReport, downloadAllReport } from "../services/pdfReport";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

const FERT_COLORS = {
  Urea:           { bg: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-400"   },
  DAP:            { bg: "bg-purple-50",  text: "text-purple-700", dot: "bg-purple-400" },
  MOP:            { bg: "bg-orange-50",  text: "text-orange-700", dot: "bg-orange-400" },
  SSP:            { bg: "bg-yellow-50",  text: "text-yellow-700", dot: "bg-yellow-400" },
  NPK:            { bg: "bg-emerald-50", text: "text-emerald-700",dot: "bg-emerald-400"},
  Compost:        { bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-400"  },
  "Zinc Sulphate":{ bg: "bg-cyan-50",    text: "text-cyan-700",   dot: "bg-cyan-400"   },
};

const STAGE_ICONS = { Sowing: "🌱", Vegetative: "🌿", Flowering: "🌸", Harvest: "🌾" };
const SEASON_ICONS = { Summer: "☀️", Winter: "❄️", Spring: "🌤️" };

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    return data.display_name?.split(",").slice(0, 3).join(", ") || `${lat}, ${lon}`;
  } catch { return `${lat}, ${lon}`; }
}

// ── Detail Modal ──────────────────────────────────────────
const DetailModal = ({ item, onClose }) => {
  const [locationLabel, setLocationLabel] = useState(`${item.lat}, ${item.lon}`);

  useEffect(() => {
    if (!item.lat || !item.lon) return;
    reverseGeocode(item.lat, item.lon).then(setLocationLabel);
  }, [item.lat, item.lon]);

  if (!item) return null;
  const c = FERT_COLORS[item.fertilizer] || { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-950 px-7 pt-7 pb-6 relative overflow-hidden">
          <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-emerald-400/10" />
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs uppercase tracking-widest text-emerald-400/70 font-semibold">Recommended Fertilizer</p>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white/70 hover:text-white transition text-lg font-bold">✕</button>
          </div>
          <h2 className="text-3xl font-bold text-white mb-1">{item.fertilizer}</h2>
          <p className="text-emerald-300/60 text-sm">
            {item.crop} · {STAGE_ICONS[item.crop_growth_stage]} {item.crop_growth_stage} · {SEASON_ICONS[item.season]} {item.season}
          </p>
        </div>

        {/* Dosage */}
        <div className="grid grid-cols-2 gap-0 border-b border-gray-100">
          <div className="p-5 border-r border-gray-100">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">Dosage (Ropani)</p>
            <p className="text-2xl font-bold text-emerald-900">{item.dosage_ropani} <span className="text-sm font-normal text-gray-400">kg/ropani</span></p>
          </div>
          <div className="p-5">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">Dosage (Hectare)</p>
            <p className="text-2xl font-bold text-emerald-900">{item.dosage_ha} <span className="text-sm font-normal text-gray-400">kg/ha</span></p>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-0 border-b border-gray-100">
          <div className="p-5 border-r border-gray-100">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">Planned Application</p>
            <p className="text-sm font-semibold text-gray-800">{item.application_date || "—"}</p>
          </div>
          <div className="p-5">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">Saved On</p>
            <p className="text-sm font-semibold text-gray-800">
              {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>

        {/* Basis */}
        <div className="px-5 py-4 bg-stone-50 border-b border-gray-100 flex gap-3">
          <span className="text-base mt-0.5 shrink-0">📋</span>
          <p className="text-xs text-gray-500 leading-relaxed">{item.basis}</p>
        </div>

        {/* Soil */}
        {item.soil && (
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">Soil Data · {item.soil.Soil_Type}</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: "pH", val: item.soil.Soil_pH,           max: 14  },
                { key: "N",  val: item.soil.Nitrogen_Level,    max: 200 },
                { key: "P",  val: item.soil.Phosphorus_Level,  max: 200 },
                { key: "K",  val: item.soil.Potassium_Level,   max: 200 },
              ].map(({ key, val, max }) => (
                <div key={key} className="bg-stone-50 rounded-xl p-3 text-center border border-gray-100">
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">{key}</p>
                  <p className="text-base font-bold text-emerald-800">{val}</p>
                  <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((parseFloat(val)/max)*100,100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weather */}
        {item.weather && (
          <div className="px-5 py-4">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">Weather at Time of Recommendation</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: "🌡️", val: `${Math.round(item.weather.Temperature)}°C`, label: "Temp" },
                { icon: "💧", val: `${Math.round(item.weather.Humidity)}%`,      label: "Humidity" },
                { icon: "🌧️", val: `${Math.round(item.weather.Rainfall)}mm`,    label: "Rainfall" },
              ].map((s) => (
                <div key={s.label} className="bg-stone-50 rounded-xl p-3 text-center border border-gray-100">
                  <p className="text-lg mb-1">{s.icon}</p>
                  <p className="text-sm font-bold text-gray-800">{s.val}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-xs text-gray-400 truncate">{locationLabel}</p>
          </div>
          <div className="flex gap-2 shrink-0 ml-3">
            <button onClick={() => downloadReport({ ...item, location_label: locationLabel })}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-gray-700 text-sm font-semibold rounded-xl transition flex items-center gap-1.5"
            >⬇️ Download Report</button>
            <button onClick={onClose}
              className="px-5 py-2 bg-emerald-950 hover:bg-emerald-900 text-white text-sm font-semibold rounded-xl transition"
            >Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};
// ── Dashboard ─────────────────────────────────────────────
const Dashboard = () => {
  const navigate           = useNavigate();
  const [history, setHistory]   = useState([]);
  const [weather, setWeather]   = useState(null);
  const [selected, setSelected] = useState(null);

  const token = localStorage.getItem("token");
  const user  = token ? jwtDecode(token) : null;
  const hour  = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Fetch weather using stored coords or skip
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        API.get(`/data?lat=${lat}&lon=${lon}&crop=rice&season=Summer&stage=Vegetative&irrigation=Canal`)
          .then((res) => setWeather(res.data))
          .catch(() => {});
      },
      () => {}
    );
  }, []);

  useEffect(() => {
    if (!token) return;
    API.get("/recommendations")
      .then((res) => setHistory(res.data || []))
      .catch(() => {});
  }, [token]);

  // Stats
  const totalRecs   = history.length;
  const lastFert    = history[0]?.fertilizer || "—";
  const uniqueCrops = [...new Set(history.map((h) => h.crop))].length;
  const nextDate    = history
    .filter((h) => h.application_date && new Date(h.application_date) >= new Date())
    .sort((a, b) => new Date(a.application_date) - new Date(b.application_date))[0]?.application_date;

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <Navbar />

      {selected && <DetailModal item={selected} onClose={() => setSelected(null)} />}

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{greeting} ☀️</p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Welcome, <span className="text-emerald-800">{user?.name}</span>
            </h1>
          </div>

        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: "📋", label: "Total Records",   val: totalRecs },
            { icon: "🌾", label: "Crops Tracked",   val: uniqueCrops },
            { icon: "🧪", label: "Last Fertilizer", val: lastFert },
            { icon: "📅", label: "Next Application",val: nextDate || "None scheduled" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xl mb-2">{s.icon}</p>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">{s.label}</p>
              <p className="text-lg font-bold text-gray-900 truncate">{s.val}</p>
            </div>
          ))}
        </div>

        {/* Weather + CTA */}
        <div className="grid md:grid-cols-2 gap-5 mb-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4">Current Conditions</p>
            {weather ? (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: "🌡️", val: `${Math.round(weather.Temperature)}°C`, label: "Temp" },
                  { icon: "💧", val: `${Math.round(weather.Humidity)}%`,      label: "Humidity" },
                  { icon: "🌧️", val: `${Math.round(weather.Rainfall)}mm`,    label: "Rainfall" },
                ].map((s) => (
                  <div key={s.label} className="bg-stone-50 rounded-xl p-4 text-center">
                    <p className="text-xl mb-2">{s.icon}</p>
                    <p className="text-xl font-bold text-emerald-800 leading-none">{s.val}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <div className="w-4 h-4 border-2 border-gray-200 border-t-emerald-700 rounded-full animate-spin" />
                Fetching weather…
              </div>
            )}
          </div>

          <div className="bg-emerald-950 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-emerald-400/10" />
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Ready for a new recommendation?</h2>
              <p className="text-emerald-200/50 text-sm leading-relaxed">Analyze your soil and get precise fertilizer advice.</p>
            </div>
            <button onClick={() => navigate("/recommend")}
              className="mt-5 self-start bg-emerald-400 hover:bg-emerald-300 text-emerald-950 px-5 py-2.5 rounded-full text-sm font-bold transition hover:-translate-y-0.5"
            >Start Now →</button>
          </div>
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recommendation History</h2>
              <p className="text-xs text-gray-400 mt-0.5">Click any record to view full details</p>
            </div>
            {history.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1 rounded-full">{history.length} records</span>
                <button
                  onClick={() => downloadAllReport(history, user?.name)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 transition"
                >⬇️ Download All</button>
              </div>
            )}
          </div>

          {history.length === 0 ? (
            <div className="text-center py-14 border-2 border-dashed border-gray-100 rounded-xl">
              <p className="text-3xl mb-3">🌾</p>
              <p className="text-gray-400 text-sm">No recommendations yet — get your first one above!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {history.map((item, i) => {
                const c = FERT_COLORS[item.fertilizer] || { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400" };
                return (
                  <button key={i} onClick={() => setSelected(item)}
                    className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-md hover:-translate-y-0.5 transition-all text-left w-full group"
                  >
                    {/* Fertilizer badge */}
                    <div className={`shrink-0 px-3 py-2 rounded-xl ${c.bg} flex flex-col items-center min-w-[64px]`}>
                      <span className={`text-xs font-bold ${c.text}`}>{item.fertilizer}</span>
                      <span className={`mt-1 w-1.5 h-1.5 rounded-full ${c.dot}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-bold text-gray-800 text-sm">{item.crop}</p>
                        <span className="text-xs text-gray-300 group-hover:text-emerald-600 transition">View →</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {STAGE_ICONS[item.crop_growth_stage]} {item.crop_growth_stage} &nbsp;·&nbsp;
                        {SEASON_ICONS[item.season]} {item.season} &nbsp;·&nbsp;
                        {item.dosage_ropani} kg/ropani
                      </p>
                      {item.application_date && (
                        <p className="text-xs text-emerald-600 mt-1 font-medium">📅 {item.application_date}</p>
                      )}
                      <p className="text-xs text-gray-300 font-mono mt-0.5">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;