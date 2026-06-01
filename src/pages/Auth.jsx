import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

// ── Replace this import with your actual image ──
import farmImage from "../assets/ferti.jpg";
// const farmImage = ""; // placeholder — swap with your image path

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard");
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.detail || "Login failed");
    }
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/signup", { name, email, password });
      alert("Account created. Please login.");
      setIsLogin(true);
    } catch (err) {
      alert(err.response?.data?.detail || "Signup failed");
    }
    setLoading(false);
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10 transition";

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* ── Left decorative panel ── */}
      <div className="hidden md:flex w-1/2 flex-col justify-end p-14 relative overflow-hidden bg-emerald-950">

        {/* ── Background image — replace `farmImage` with your own import ── */}
        <img
          src={farmImage}
          alt="Farm background"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />

        {/* Overlay gradient on top of image */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/60 to-transparent" />

        {/* Content */}
        <div className="relative z-10">
          <span className="text-xs tracking-widest uppercase text-emerald-400 font-semibold">
            Smart Farming Platform
          </span>
          <h2 className="mt-4 text-4xl font-bold text-white leading-tight">
            Grow more.<br />
            <em className="text-emerald-400 not-italic">Spend less.</em>
          </h2>
          <p className="mt-4 text-white/40 text-sm leading-relaxed max-w-xs">
            AI-powered fertilizer recommendations combining real-time soil data and weather conditions.
          </p>
          
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 bg-emerald-950 rounded-xl flex items-center justify-center text-lg">🌱</div>
            <span className="text-lg font-bold text-emerald-950 tracking-tight">AgriPulse</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {isLogin ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            {isLogin ? "Sign in to your farming dashboard" : "Start your smart farming journey"}
          </p>

          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Full Name</label>
                <input className={inputClass} placeholder="Jane Farmsworth" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Email</label>
              <input type="email" className={inputClass} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Password</label>
              <input type="password" className={inputClass} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl bg-emerald-950 text-white text-sm font-semibold hover:bg-emerald-900 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Please wait…" : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-emerald-800 font-semibold underline underline-offset-2 hover:text-emerald-950 transition"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;