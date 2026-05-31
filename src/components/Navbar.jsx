import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect, useRef } from "react";
import API from "../services/api";

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser]       = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setUser(decoded);
          // Check admin status from backend
          const res = await API.get("/me");
          setIsAdmin(res.data.is_admin || false);
        } catch { setUser(null); setIsAdmin(false); }
      } else {
        setUser(null); setIsAdmin(false);
      }
    };
    checkUser();
    window.addEventListener("storage", checkUser);
    return () => window.removeEventListener("storage", checkUser);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null); setIsAdmin(false);
    setOpen(false);
    navigate("/");
  };

  const navTo = (path) => { navigate(path); setOpen(false); };

  const navLinks = user ? [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Recommend", path: "/recommend" },
    ...(isAdmin ? [{ label: "Admin", path: "/admin" }] : []),
  ] : [];

  return (
    <nav className={`w-full sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? "bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-100"
        : "bg-transparent"
    }`}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-emerald-950 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <span className="text-base">🌿</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-base font-black text-emerald-950 tracking-tight">Agri</span>
            <span className="text-base font-black text-emerald-600 tracking-tight">Pulse</span>
          </div>
        </Link>

        {/* Nav links */}
        {user && (
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, path }) => (
              <button key={path} onClick={() => navTo(path)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  label === "Admin"
                    ? "text-amber-700 hover:text-amber-900 hover:bg-amber-50"
                    : "text-gray-500 hover:text-emerald-900 hover:bg-emerald-50"
                }`}
              >
                {label === "Admin" && <span className="mr-1">🔧</span>}
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Right side */}
        {!user ? (
          <Link to="/auth"
            className="flex items-center gap-1.5 bg-emerald-950 hover:bg-emerald-800 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm"
          >
            Get Started
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setOpen(!open)}
              className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full border transition-all ${
                open ? "bg-gray-50 border-gray-200 shadow-sm" : "border-transparent hover:bg-gray-50 hover:border-gray-100"
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-800 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-gray-700 hidden sm:block">{user.name}</span>
              {isAdmin && <span className="text-xs bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-md">Admin</span>}
              <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              ><path d="M6 9l6 6 6-6" /></svg>
            </button>

            {open && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-br from-emerald-950 to-emerald-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-sm font-bold">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs text-white/60 leading-none mb-0.5">Signed in as</p>
                      <p className="text-sm font-bold text-white truncate max-w-[140px]">{user.name}</p>
                      {isAdmin && <p className="text-xs text-amber-300 font-semibold mt-0.5">Administrator</p>}
                    </div>
                  </div>
                </div>

                <div className="py-1.5">
                  <button onClick={() => navTo("/dashboard")}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-stone-50 hover:text-emerald-900 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-sm">📊</span>
                    Dashboard
                  </button>
                  <button onClick={() => navTo("/recommend")}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-stone-50 hover:text-emerald-900 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-sm">🌱</span>
                    Recommend
                  </button>
                  {isAdmin && (
                    <button onClick={() => navTo("/admin")}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition-colors"
                    >
                      <span className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-sm">🔧</span>
                      Admin Panel
                    </button>
                  )}
                </div>

                <div className="border-t border-gray-100 py-1.5">
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-sm">🚪</span>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;