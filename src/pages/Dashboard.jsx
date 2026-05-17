import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

const Dashboard = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [weather, setWeather] = useState(null);
  const [coords, setCoords] = useState({ lat: null, lon: null });

  const token = localStorage.getItem("token");
  const user = token ? jwtDecode(token) : null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => console.error(err)
    );
  }, []);

  useEffect(() => {
    if (!coords.lat || !coords.lon) return;
    API.get(`/data?lat=${coords.lat}&lon=${coords.lon}&crop=rice&season=Summer&stage=Vegetative&irrigation=Canal`)
      .then((res) => setWeather(res.data))
      .catch(console.error);
  }, [coords]);

  // Fixed: was calling /history, backend route is /recommendations
  useEffect(() => {
    if (!token) return;
    API.get("/recommendations")
      .then((res) => setHistory(res.data || []))
      .catch(console.log);
  }, [token]);

  const FERT_COLORS = {
    Urea: "bg-blue-50 text-blue-700",
    DAP: "bg-purple-50 text-purple-700",
    MOP: "bg-orange-50 text-orange-700",
    SSP: "bg-yellow-50 text-yellow-700",
    NPK: "bg-emerald-50 text-emerald-700",
    Compost: "bg-amber-50 text-amber-700",
    "Zinc Sulphate": "bg-cyan-50 text-cyan-700",
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{greeting} ☀️</p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Welcome, <span className="text-emerald-800">{user?.name}</span>
            </h1>
          </div>
          <button
            onClick={() => navigate("/recommend")}
            className="flex items-center gap-2 bg-emerald-950 hover:bg-emerald-900 text-white px-6 py-3 rounded-full text-sm font-semibold shadow transition hover:-translate-y-0.5 active:scale-95"
          >
            + New Recommendation
          </button>
        </div>

        {/* Top cards */}
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          {/* Weather */}
          <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-5">Current Conditions</p>
            {weather ? (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: "🌡️", val: `${Math.round(weather.Temperature)}°`, label: "Temp" },
                  { icon: "💧", val: `${Math.round(weather.Humidity)}%`, label: "Humidity" },
                  { icon: "🌧️", val: `${Math.round(weather.Rainfall)}mm`, label: "Rainfall" },
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

          {/* Promo card */}
          <div className="bg-emerald-950 rounded-2xl p-7 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full bg-emerald-400/10" />
            <div>
              <h2 className="text-xl font-bold text-white mb-2 leading-snug">Ready for a new recommendation?</h2>
              <p className="text-emerald-200/50 text-sm leading-relaxed">
                Analyze your soil and get precise fertilizer advice.
              </p>
            </div>
            <button
              onClick={() => navigate("/recommend")}
              className="mt-5 self-start flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 px-5 py-2.5 rounded-full text-sm font-bold transition hover:-translate-y-0.5 active:scale-95"
            >
              Start Now →
            </button>
          </div>
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recommendation History</h2>
            {history.length > 0 && (
              <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1 rounded-full">
                {history.length} records
              </span>
            )}
          </div>

          {history.length === 0 ? (
            <div className="text-center py-14 border-2 border-dashed border-gray-100 rounded-xl">
              <p className="text-3xl mb-3">🌾</p>
              <p className="text-gray-400 text-sm">No recommendations yet — get your first one above!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {history.map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:shadow-sm hover:-translate-y-0.5 transition-all">
                  {/* Fertilizer badge */}
                  <span className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold ${FERT_COLORS[item.fertilizer] || "bg-gray-100 text-gray-600"}`}>
                    {item.fertilizer}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{item.crop}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {item.crop_growth_stage} · {item.season} · {item.dosage_ropani} kg/ropani
                    </p>
                    {item.application_date && (
                      <p className="text-xs text-emerald-600 mt-0.5 font-medium">
                        📅 Apply on: {item.application_date}
                      </p>
                    )}
                    <p className="text-xs text-gray-300 font-mono mt-0.5">
                      Saved: {item.created_at ? new Date(item.created_at).toLocaleString() : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;