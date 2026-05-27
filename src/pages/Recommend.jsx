import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";

const CROPS = ["Rice", "Wheat", "Maize", "Potato", "Cotton", "Sugarcane", "Tomato"];
const CROP_ICONS = { Rice: "🌾", Wheat: "🌿", Maize: "🌽", Potato: "🥔", Cotton: "☁️", Sugarcane: "🎋", Tomato: "🍅" };
const STAGES = ["Sowing", "Vegetative", "Flowering", "Harvest"];
const IRRIGATION = ["Canal", "Sprinkler", "Rainfed", "Drip"];
const SEASONS = ["Summer", "Winter", "Spring"];
const HISTORY_KEY = "agripulse_location_history";

const SegmentControl = ({ options, value, onChange }) => (
  <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
    {options.map((opt) => (
      <button key={opt} onClick={() => onChange(opt)}
        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
          value === opt ? "bg-white text-emerald-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
        }`}>{opt}</button>
    ))}
  </div>
);

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

const PopupMap = ({ lat, lon, onSelect }) => {
  const mapRef    = useRef(null);
  const mapObj    = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (mapObj.current || !window.L) return;
    const L    = window.L;
    const iLat = parseFloat(lat) || 27.7172;
    const iLon = parseFloat(lon) || 85.3240;
    const map  = L.map(mapRef.current, { zoomControl: true }).setView([iLat, iLon], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors", maxZoom: 19,
    }).addTo(map);
    const greenIcon = L.divIcon({
      html: `<div style="width:22px;height:22px;background:#2d6a4f;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
      iconSize: [22, 22], iconAnchor: [11, 11], className: "",
    });
    const marker = L.marker([iLat, iLon], { icon: greenIcon, draggable: true }).addTo(map);
    markerRef.current = marker;
    marker.on("dragend", async (e) => {
      const { lat: mLat, lng: mLon } = e.target.getLatLng();
      const label = await reverseGeocode(mLat, mLon);
      onSelect(mLat.toFixed(4), mLon.toFixed(4), label);
    });
    map.on("click", async (e) => {
      marker.setLatLng(e.latlng);
      const label = await reverseGeocode(e.latlng.lat, e.latlng.lng);
      onSelect(e.latlng.lat.toFixed(4), e.latlng.lng.toFixed(4), label);
    });
    mapObj.current = map;
  }, []);

  useEffect(() => {
    if (!mapObj.current || !markerRef.current || !lat || !lon) return;
    const latlng = window.L.latLng(parseFloat(lat), parseFloat(lon));
    markerRef.current.setLatLng(latlng);
    mapObj.current.flyTo(latlng, 14, { duration: 1 });
  }, [lat, lon]);

  return <div ref={mapRef} style={{ height: "100%", width: "100%" }} />;
};

const LocationPicker = ({ lat, lon, locationLabel, onLocationSelect }) => {
  const [open, setOpen]             = useState(false);
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState([]);
  const [searching, setSearching]   = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError]     = useState(false);
  const [history, setHistory]       = useState([]);
  const [mapLat, setMapLat]         = useState(lat || "27.7172");
  const [mapLon, setMapLon]         = useState(lon || "85.3240");
  const [pendingLabel, setPendingLabel] = useState("");
  const inputRef = useRef(null);
  const popupRef = useRef(null);
  const debounce = useRef(null);

  useEffect(() => {
    if (!open) return;
    try { setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]")); } catch { setHistory([]); }
  }, [open]);

  useEffect(() => { if (lat) setMapLat(lat); if (lon) setMapLon(lon); }, [lat, lon]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (popupRef.current && !popupRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 120); }, [open]);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounce.current);
    if (!val.trim()) { setResults([]); return; }
    debounce.current = setTimeout(() => doSearch(val), 400);
  };

  const doSearch = async (q) => {
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`, { headers: { "Accept-Language": "en" } });
      setResults(await res.json());
    } catch { setResults([]); }
    finally { setSearching(false); }
  };

  const saveHistory = (label, sLat, sLon) => {
    const entry   = { label, lat: sLat, lon: sLon };
    const updated = [entry, ...history.filter((h) => h.label !== label)].slice(0, 5);
    setHistory(updated);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch {}
  };

  const confirmLocation = (sLat, sLon, label) => {
    setMapLat(sLat); setMapLon(sLon);
    onLocationSelect(sLat, sLon, label);
    saveHistory(label, sLat, sLon);
    setOpen(false); setQuery(""); setResults([]);
  };

  const handleMapSelect = (sLat, sLon, label) => {
    setMapLat(sLat); setMapLon(sLon);
    setPendingLabel(label);
    onLocationSelect(sLat, sLon, label);
  };

  const useGPS = async () => {
    setGpsLoading(true);
    setGpsError(false);
    try {
      const permission = await navigator.permissions.query({ name: "geolocation" });
      if (permission.state === "denied") {
        setGpsLoading(false); setGpsError(true);
        setTimeout(() => setGpsError(false), 4000);
        return;
      }
    } catch {}
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const sLat  = pos.coords.latitude.toFixed(4);
        const sLon  = pos.coords.longitude.toFixed(4);
        const label = await reverseGeocode(sLat, sLon);
        confirmLocation(sLat, sLon, label);
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false); setGpsError(true);
        setTimeout(() => setGpsError(false), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="mb-6 relative">
      <label className="block text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">Field Location</label>
      <button onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-left transition hover:border-emerald-500 focus:outline-none"
      >
        <span className="text-base">📍</span>
        <span className={`flex-1 truncate ${locationLabel ? "text-gray-800 font-medium" : "text-gray-400"}`}>
          {locationLabel || "Search or select your field location…"}
        </span>
        {lat && lon && <span className="text-xs text-gray-400 font-mono shrink-0 hidden sm:block">{lat}, {lon}</span>}
        <span className="text-gray-400 text-xs shrink-0">▾</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div ref={popupRef} className="bg-white rounded-2xl shadow-2xl w-full flex overflow-hidden" style={{ maxWidth: "900px", height: "560px" }}>

            {/* Left panel */}
            <div className="w-72 shrink-0 flex flex-col border-r border-gray-100">
              <div className="px-5 pt-5 pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800">Choose Location</h3>
                  <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">✕</button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input ref={inputRef} type="text" value={query} onChange={handleQueryChange} placeholder="Search places…"
                    className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 transition"
                  />
                  {searching && <span className="absolute right-3 top-1/2 -translate-y-1/2"><span className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin inline-block" /></span>}
                  {query && !searching && <button onClick={() => { setQuery(""); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-1">
                {results.length > 0 && (
                  <>
                    <p className="px-5 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-widest">Results</p>
                    {results.map((r, i) => {
                      const parts = r.display_name.split(",");
                      const sLat  = parseFloat(r.lat).toFixed(4);
                      const sLon  = parseFloat(r.lon).toFixed(4);
                      const label = parts.slice(0, 3).join(", ");
                      return (
                        <button key={i} onClick={() => confirmLocation(sLat, sLon, label)}
                          className="w-full flex items-start gap-3 px-5 py-3 hover:bg-emerald-50 transition text-left group"
                        >
                          <span className="mt-0.5 text-emerald-600 shrink-0">📍</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate group-hover:text-emerald-800">{parts[0]}</p>
                            <p className="text-xs text-gray-400 truncate">{parts.slice(1, 3).join(",")}</p>
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}

                {query.trim() && !searching && results.length === 0 && (
                  <div className="px-5 py-10 text-center">
                    <p className="text-2xl mb-2">🔍</p>
                    <p className="text-sm text-gray-400">No results for "{query}"</p>
                  </div>
                )}

                {!query.trim() && (
                  <>
                    <p className="px-5 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-widest">Current</p>
                    <button onClick={useGPS} disabled={gpsLoading}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-emerald-50 transition text-left disabled:opacity-60"
                    >
                      <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        {gpsLoading ? <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /> : <span>🎯</span>}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Use current location</p>
                        <p className="text-xs text-gray-400">Detect via GPS</p>
                      </div>
                    </button>

                    {gpsError && (
                      <div className="mx-5 mb-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                        <span className="text-sm">🔒</span>
                        <div>
                          <p className="text-xs font-semibold text-red-600">Location access blocked</p>
                          <p className="text-xs text-red-400">Enable location in browser settings or search manually.</p>
                        </div>
                      </div>
                    )}

                    {history.length > 0 && (
                      <>
                        <p className="px-5 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-widest">Recent</p>
                        {history.map((h, i) => (
                          <button key={i} onClick={() => confirmLocation(h.lat, h.lon, h.label)}
                            className="w-full flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition text-left"
                          >
                            <span className="mt-0.5 text-gray-400 shrink-0">🕐</span>
                            <div className="min-w-0">
                              <p className="text-sm text-gray-700 truncate">{h.label}</p>
                              <p className="text-xs text-gray-400 font-mono">{h.lat}, {h.lon}</p>
                            </div>
                          </button>
                        ))}
                      </>
                    )}

                    {history.length === 0 && !lat && (
                      <div className="px-5 py-8 text-center">
                        <p className="text-xs text-gray-300 leading-relaxed">Search a location or click on the map</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="px-5 py-4 border-t border-gray-100">
                <button
                  onClick={() => { if (pendingLabel) saveHistory(pendingLabel, mapLat, mapLon); setOpen(false); }}
                  disabled={!mapLat || !mapLon}
                  className="w-full py-2.5 bg-emerald-950 hover:bg-emerald-900 text-white text-sm font-semibold rounded-xl transition disabled:opacity-40"
                >Confirm Location</button>
              </div>
            </div>

            {/* Right panel: map */}
            <div className="flex-1 relative overflow-hidden rounded-r-2xl">
              <PopupMap lat={mapLat} lon={mapLon} onSelect={handleMapSelect} />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-md text-xs text-gray-600 font-mono pointer-events-none whitespace-nowrap">
                {mapLat && mapLon ? `${mapLat}°N  ${mapLon}°E` : "Click map to pin location"}
              </div>
              <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-500 pointer-events-none">
                📍 Click or drag to move pin
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Recommend = () => {
  const [crop, setCrop]                       = useState("Rice");
  const [stage, setStage]                     = useState("Vegetative");
  const [irrigation, setIrrigation]           = useState("Canal");
  const [season, setSeason]                   = useState("Summer");
  const [lat, setLat]                         = useState("");
  const [lon, setLon]                         = useState("");
  const [locationLabel, setLocationLabel]     = useState("");
  const [applicationDate, setApplicationDate] = useState("");
  const [result, setResult]                   = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const sLat  = pos.coords.latitude.toFixed(4);
      const sLon  = pos.coords.longitude.toFixed(4);
      const label = await reverseGeocode(sLat, sLon);
      setLat(sLat); setLon(sLon); setLocationLabel(label);
    }, () => {});
  }, []);

  const handleLocationSelect = (sLat, sLon, label) => {
    setLat(sLat); setLon(sLon); setLocationLabel(label);
  };

  const handleSubmit = async () => {
    if (!lat || !lon)     { setError("Please select a location."); return; }
    if (!applicationDate) { setError("Please select a planned application date."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await API.post("/predict", {
        lat: parseFloat(lat), lon: parseFloat(lon),
        crop_type: crop, crop_growth_stage: stage,
        season, irrigation_type: irrigation,
        application_date: applicationDate,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to get recommendation. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-10">
          <p className="text-xs tracking-widest uppercase text-emerald-800 font-semibold mb-2">Fertilizer Analysis</p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">Get <span className="text-emerald-800">Personalized</span> Recommendations</h1>
          <p className="text-gray-400 text-sm">Search your field location, select your crop, and get a science-backed recommendation.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
            <h2 className="text-base font-bold text-gray-700 mb-6">Your Details</h2>

            <LocationPicker lat={lat} lon={lon} locationLabel={locationLabel} onLocationSelect={handleLocationSelect} />

            <div className="mb-6">
              <label className="block text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">Crop Type</label>
              <div className="grid grid-cols-4 gap-2">
                {CROPS.map((c) => (
                  <button key={c} onClick={() => setCrop(c)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      crop === c ? "border-emerald-800 bg-emerald-50 text-emerald-900" : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  ><span className="text-lg">{CROP_ICONS[c]}</span>{c}</button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">Growth Stage</label>
              <SegmentControl options={STAGES} value={stage} onChange={setStage} />
            </div>

            <div className="mb-5">
              <label className="block text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">Irrigation</label>
              <select value={irrigation} onChange={(e) => setIrrigation(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-emerald-800 transition"
              >{IRRIGATION.map((i) => <option key={i}>{i}</option>)}</select>
            </div>

            <div className="mb-5">
              <label className="block text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">Season</label>
              <SegmentControl options={SEASONS} value={season} onChange={setSeason} />
            </div>

            <div className="mb-7">
              <label className="block text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">Planned Application Date</label>
              <input type="date" min={today} value={applicationDate} onChange={(e) => setApplicationDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-emerald-800 transition"
              />
              <p className="text-xs text-gray-400 mt-1.5">Past dates are disabled.</p>
            </div>

            {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

            <button onClick={handleSubmit} disabled={loading || !lat}
              className="w-full py-3.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing…</> : "🔍 Get Recommendation"}
            </button>
          </div>

          <div className="space-y-4">
            {!result ? (
              <div className="bg-white rounded-2xl p-14 text-center border-2 border-dashed border-gray-100">
                <p className="text-4xl mb-4">🌾</p>
                <h3 className="font-bold text-gray-700 mb-1">Results will appear here</h3>
                <p className="text-sm text-gray-400">Select your field location and click "Get Recommendation"</p>
              </div>
            ) : (
              <>
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
                      <p className="text-3xl font-bold text-white">{result.rainfall_48h}<span className="text-sm font-normal text-white/50 ml-1">mm</span></p>
                    </div>
                    <p className="text-blue-200/70 text-sm leading-relaxed">{result.message}</p>
                  </div>
                )}

                {!result.rain_alert && (
                  <div className="bg-emerald-950 rounded-2xl p-7 relative overflow-hidden">
                    <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-emerald-400/10" />
                    <p className="text-xs uppercase tracking-widest text-emerald-400/70 font-semibold mb-2">Recommended Fertilizer</p>
                    <h2 className="text-4xl font-bold text-white mb-1">{result.fertilizer}</h2>
                    <p className="text-emerald-300/60 text-sm mb-1">{crop} · {stage} Stage</p>
                    {result.application_date && (
                      <p className="text-emerald-400/70 text-xs mb-6">📅 Planned: <span className="font-semibold text-emerald-300">{result.application_date}</span></p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/10 rounded-xl p-4">
                        <p className="text-xs text-emerald-300/60 uppercase tracking-widest mb-1">Dosage (Ropani)</p>
                        <p className="text-2xl font-bold text-white">{result.dosage_ropani}<span className="text-sm font-normal text-white/50 ml-1">kg/ropani</span></p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4">
                        <p className="text-xs text-emerald-300/60 uppercase tracking-widest mb-1">Dosage (Hectare)</p>
                        <p className="text-2xl font-bold text-white">{result.dosage_ha}<span className="text-sm font-normal text-white/50 ml-1">kg/ha</span></p>
                      </div>
                    </div>
                    <div className="mt-4 bg-white/5 rounded-xl px-4 py-3 flex gap-2">
                      <span className="text-sm mt-0.5">📋</span>
                      <p className="text-xs text-emerald-200/60 leading-relaxed">{result.basis}</p>
                    </div>
                  </div>
                )}

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
                        { key: "pH", val: result.soil.Soil_pH, max: 14 },
                        { key: "N",  val: result.soil.Nitrogen_Level, max: 200 },
                        { key: "P",  val: result.soil.Phosphorus_Level, max: 200 },
                        { key: "K",  val: result.soil.Potassium_Level, max: 200 },
                      ].map(({ key, val, max }) => (
                        <div key={key} className="bg-stone-50 rounded-xl p-4">
                          <div className="flex items-baseline justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{key}</span>
                            <span className="font-bold text-emerald-800 text-lg leading-none">{val}</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-700 to-emerald-400 rounded-full transition-all duration-700"
                              style={{ width: `${Math.min((parseFloat(val) / max) * 100, 100)}%` }} />
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