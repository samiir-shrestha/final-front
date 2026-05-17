import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";

const CROPS = ["Rice", "Wheat", "Maize", "Potato", "Cotton", "Sugarcane", "Tomato"];
const CROP_ICONS = { Rice: "🌾", Wheat: "🌿", Maize: "🌽", Potato: "🥔", Cotton: "☁️", Sugarcane: "🎋", Tomato: "🍅" };
const STAGES = ["Sowing", "Vegetative", "Flowering", "Harvest"];
const IRRIGATION = ["Canal", "Sprinkler", "Rainfed", "Drip"];
const SEASONS = ["Summer", "Winter", "Spring"];

const SegmentControl = ({ options, value, onChange }) => (
  <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
    {options.map((opt) => (
      <button
        key={opt}
        onClick={() => onChange(opt)}
        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
          value === opt
            ? "bg-white text-emerald-900 shadow-sm"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        {opt}
      </button>
    ))}
  </div>
);

const Recommend = () => {
  const [crop, setCrop] = useState("Rice");
  const [stage, setStage] = useState("Vegetative");
  const [irrigation, setIrrigation] = useState("Canal");
  const [season, setSeason] = useState("Summer");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [applicationDate, setApplicationDate] = useState("");

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLon(pos.coords.longitude.toFixed(4));
      },
      () => setError("Location access denied. Please enable location.")
    );
  }, []);

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const handleSubmit = async () => {
    if (!applicationDate) {
      setError("Please select a date for fertilizer application.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await API.post("/predict", {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        crop_type: crop,
        crop_growth_stage: stage,
        season,
        irrigation_type: irrigation,
        application_date: applicationDate,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to get recommendation. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs tracking-widest uppercase text-emerald-800 font-semibold mb-2">Fertilizer Analysis</p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
            Get <span className="text-emerald-800">Personalized</span> Recommendations
          </h1>
          <p className="text-gray-400 text-sm">Fill in your crop details and we'll do the rest.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* Form panel */}
          <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm sticky top-6">
            <h2 className="text-base font-bold text-gray-700 mb-6">Your Details</h2>

            {/* Location */}
            <div className="flex items-center gap-3 bg-emerald-50 rounded-xl px-4 py-3 mb-6 border border-emerald-100">
              <span className="text-xl">📍</span>
              <div>
                <p className="text-xs uppercase tracking-widest text-emerald-700 font-semibold">Location</p>
                <p className="text-sm text-gray-600 font-mono">
                  {lat && lon ? `${lat}°N, ${lon}°E` : "Detecting…"}
                </p>
              </div>
            </div>

            {/* Crop picker */}
            <div className="mb-6">
              <label className="block text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">Crop Type</label>
              <div className="grid grid-cols-4 gap-2">
                {CROPS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCrop(c)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      crop === c
                        ? "border-emerald-800 bg-emerald-50 text-emerald-900"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-lg">{CROP_ICONS[c]}</span>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Stage */}
            <div className="mb-5">
              <label className="block text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">Growth Stage</label>
              <SegmentControl options={STAGES} value={stage} onChange={setStage} />
            </div>

            {/* Irrigation */}
            <div className="mb-5">
              <label className="block text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">Irrigation</label>
              <select
                value={irrigation}
                onChange={(e) => setIrrigation(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10 transition"
              >
                {IRRIGATION.map((i) => <option key={i}>{i}</option>)}
              </select>
            </div>

            {/* Season */}
            <div className="mb-7">
              <label className="block text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">Season</label>
              <SegmentControl options={SEASONS} value={season} onChange={setSeason} />
            </div>

            {/* Application Date Picker */}
            <div className="mb-7">
              <label className="block text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">
                Planned Application Date
              </label>
              <input
                type="date"
                min={today}
                value={applicationDate}
                onChange={(e) => setApplicationDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10 transition"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Past dates are disabled. Select when you plan to apply the fertilizer.
              </p>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !lat}
              className="w-full py-3.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing…
                </>
              ) : "🔍 Get Recommendation"}
            </button>
          </div>

          {/* Results panel */}
          <div className="space-y-4">
            {!result ? (
              <div className="bg-white rounded-2xl p-14 text-center border-2 border-dashed border-gray-100">
                <p className="text-4xl mb-4">🌾</p>
                <h3 className="font-bold text-gray-700 mb-1">Results will appear here</h3>
                <p className="text-sm text-gray-400">Fill in your details and click "Get Recommendation"</p>
              </div>
            ) : (
              <>
                {/* Rain Alert — shown instead of recommendation when heavy rain forecast */}
                {result.rain_alert && (
                  <div className="bg-blue-950 rounded-2xl p-7 relative overflow-hidden">
                    <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-blue-400/10" />
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl">🌧️</span>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-blue-300/70 font-semibold">Rain Alert</p>
                        <h2 className="text-2xl font-bold text-white">Delay Application</h2>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-xl px-4 py-3 mb-4">
                      <p className="text-xs text-blue-300/60 uppercase tracking-widest mb-1">Forecast Rainfall (48hrs)</p>
                      <p className="text-3xl font-bold text-white">{result.rainfall_48h}
                        <span className="text-sm font-normal text-white/50 ml-1">mm</span>
                      </p>
                    </div>
                    <p className="text-blue-200/70 text-sm leading-relaxed">{result.message}</p>
                    <div className="mt-4 bg-white/5 rounded-xl px-4 py-3 flex gap-2">
                      <span className="text-sm mt-0.5">💡</span>
                      <p className="text-xs text-blue-200/50 leading-relaxed">
                        Fertilizer applied before heavy rain is washed into waterways before the crop can absorb it —
                        wasting your investment and polluting water sources. Check back when the forecast clears.
                      </p>
                    </div>
                  </div>
                )}

                {/* Fertilizer recommendation — hidden during rain alert */}
                {!result.rain_alert && <div className="bg-emerald-950 rounded-2xl p-7 relative overflow-hidden">
                  <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-emerald-400/10" />
                  <p className="text-xs uppercase tracking-widest text-emerald-400/70 font-semibold mb-2">
                    Recommended Fertilizer
                  </p>
                  <h2 className="text-4xl font-bold text-white mb-1">{result.fertilizer}</h2>
                  <p className="text-emerald-300/60 text-sm mb-1">{crop} · {stage} Stage</p>
                  {result.application_date && (
                    <p className="text-emerald-400/70 text-xs mb-6">
                      📅 Planned application: <span className="font-semibold text-emerald-300">{result.application_date}</span>
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 rounded-xl p-4">
                      <p className="text-xs text-emerald-300/60 uppercase tracking-widest mb-1">Dosage (Ropani)</p>
                      <p className="text-2xl font-bold text-white">{result.dosage_ropani}
                        <span className="text-sm font-normal text-white/50 ml-1">kg/ropani</span>
                      </p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4">
                      <p className="text-xs text-emerald-300/60 uppercase tracking-widest mb-1">Dosage (Hectare)</p>
                      <p className="text-2xl font-bold text-white">{result.dosage_ha}
                        <span className="text-sm font-normal text-white/50 ml-1">kg/ha</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 bg-white/5 rounded-xl px-4 py-3 flex gap-2">
                    <span className="text-sm mt-0.5">📋</span>
                    <p className="text-xs text-emerald-200/60 leading-relaxed">{result.basis}</p>
                  </div>
                </div>}

                {/* Weather */}
                {result.weather && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">🌦️</div>
                      <h2 className="font-bold text-gray-800">Weather Conditions</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon: "🌡️", val: `${Math.round(result.weather.Temperature)}°C`, label: "Temp" },
                        { icon: "💧", val: `${Math.round(result.weather.Humidity)}%`, label: "Humidity" },
                        { icon: "🌧️", val: `${Math.round(result.weather.Rainfall)}mm`, label: "Rainfall" },
                      ].map((s) => (
                        <div key={s.label} className="bg-stone-50 rounded-xl p-4 text-center">
                          <p className="text-xl mb-2">{s.icon}</p>
                          <p className="text-xl font-bold text-emerald-800 leading-none">{s.val}</p>
                          <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Soil */}
                {result.soil && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl">🌍</div>
                      <div>
                        <h2 className="font-bold text-gray-800">Soil Analysis</h2>
                        <p className="text-xs text-gray-400">{result.soil.Soil_Type} soil</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "pH",  val: result.soil.Soil_pH,          max: 14 },
                        { key: "N",   val: result.soil.Nitrogen_Level,    max: 200 },
                        { key: "P",   val: result.soil.Phosphorus_Level,  max: 200 },
                        { key: "K",   val: result.soil.Potassium_Level,   max: 200 },
                      ].map(({ key, val, max }) => (
                        <div key={key} className="bg-stone-50 rounded-xl p-4">
                          <div className="flex items-baseline justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{key}</span>
                            <span className="font-bold text-emerald-800 text-lg leading-none">{val}</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-700 to-emerald-400 rounded-full transition-all duration-700"
                              style={{ width: `${Math.min((parseFloat(val) / max) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommend;