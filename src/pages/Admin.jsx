import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import API from "../services/api";

const FERT_COLORS = {
  Urea:            "bg-blue-100 text-blue-700",
  DAP:             "bg-purple-100 text-purple-700",
  MOP:             "bg-orange-100 text-orange-700",
  SSP:             "bg-yellow-100 text-yellow-700",
  NPK:             "bg-emerald-100 text-emerald-700",
  Compost:         "bg-amber-100 text-amber-700",
  "Zinc Sulphate": "bg-cyan-100 text-cyan-700",
};

// ── User Recommendations Modal ────────────────────────────
const UserRecsModal = ({ user, onClose }) => {
  const [recs, setRecs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/admin/users/${user.id}/recommendations`)
      .then((res) => setRecs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-950 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-emerald-400/70 font-semibold">User Recommendations</p>
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <p className="text-emerald-300/60 text-xs">{user.email}</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition text-lg"
          >✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
              <span className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              Loading recommendations…
            </div>
          ) : recs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">🌾</p>
              <p className="text-gray-400 text-sm">No recommendations yet for this user.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recs.map((rec, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${FERT_COLORS[rec.fertilizer] || "bg-gray-100 text-gray-600"}`}>
                        {rec.fertilizer}
                      </span>
                      <span className="ml-2 text-sm font-semibold text-gray-800">{rec.crop}</span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono">{rec.created_at ? new Date(rec.created_at).toLocaleDateString() : "—"}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="bg-stone-50 rounded-lg p-2.5 text-center">
                      <p className="text-xs text-gray-400">Stage</p>
                      <p className="text-xs font-semibold text-gray-700">{rec.crop_growth_stage}</p>
                    </div>
                    <div className="bg-stone-50 rounded-lg p-2.5 text-center">
                      <p className="text-xs text-gray-400">Dosage</p>
                      <p className="text-xs font-semibold text-gray-700">{rec.dosage_ropani} kg/r</p>
                    </div>
                    <div className="bg-stone-50 rounded-lg p-2.5 text-center">
                      <p className="text-xs text-gray-400">Apply Date</p>
                      <p className="text-xs font-semibold text-gray-700">{rec.application_date || "—"}</p>
                    </div>
                  </div>
                  {rec.lat && rec.lon && (
                    <p className="text-xs text-gray-300 font-mono mt-2">{rec.lat}, {rec.lon}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="w-full py-2.5 bg-emerald-950 hover:bg-emerald-900 text-white text-sm font-semibold rounded-xl transition"
          >Close</button>
        </div>
      </div>
    </div>
  );
};

// ── Admin Page ────────────────────────────────────────────
const Admin = () => {
  const navigate              = useNavigate();
  const [users, setUsers]     = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch]   = useState("");
  const [confirm, setConfirm] = useState(null); // user to delete

  const token   = localStorage.getItem("token");
  const current = token ? jwtDecode(token) : null;

  useEffect(() => {
    // Check admin access
    API.get("/me")
      .then(() => {
        Promise.all([
          API.get("/admin/users"),
          API.get("/admin/stats"),
        ]).then(([usersRes, statsRes]) => {
          setUsers(usersRes.data);
          setStats(statsRes.data);
        }).catch(() => navigate("/dashboard"))
        .finally(() => setLoading(false));
      })
      .catch(() => navigate("/"));
  }, []);

  const handleDelete = async (user) => {
    try {
      await API.delete(`/admin/users/${user.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setConfirm(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Delete failed");
    }
  };

  const handleToggleAdmin = async (user) => {
    try {
      const res = await API.patch(`/admin/users/${user.id}/toggle-admin`);
      setUsers((prev) => prev.map((u) =>
        u.id === user.id ? { ...u, is_admin: res.data.is_admin } : u
      ));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update admin status");
    }
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="flex items-center gap-3 text-gray-400">
        <span className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        Loading admin panel…
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 font-sans">

      {/* Modals */}
      {selectedUser && <UserRecsModal user={selectedUser} onClose={() => setSelectedUser(null)} />}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <p className="text-lg font-bold text-gray-800 mb-2">Delete User?</p>
            <p className="text-sm text-gray-500 mb-5">
              This will permanently delete <strong>{confirm.name}</strong> and all their recommendations. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >Cancel</button>
              <button onClick={() => handleDelete(confirm)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition"
              >Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="bg-emerald-950 px-6 h-16 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">AgriPulse Admin</p>
            <p className="text-emerald-400/60 text-xs">Management Panel</p>
          </div>
        </div>
        <button onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-emerald-300/60 hover:text-white text-sm transition"
        >← Back to App</button>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-2xl mb-1">👥</p>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-2xl mb-1">📋</p>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">Total Recommendations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_recs}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm col-span-2">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">Top Fertilizers</p>
              <div className="flex flex-wrap gap-2">
                {stats.top_fertilizers.map((f) => (
                  <span key={f.name} className={`text-xs font-semibold px-3 py-1 rounded-full ${FERT_COLORS[f.name] || "bg-gray-100 text-gray-600"}`}>
                    {f.name} ({f.count})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Users</h2>
              <p className="text-xs text-gray-400 mt-0.5">{filtered.length} of {users.length} users</p>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-700 w-64 transition"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Email</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Recs</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Role</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id}
                    className={`border-b border-gray-50 hover:bg-stone-50 transition ${i % 2 === 0 ? "" : "bg-stone-50/30"}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <span className="text-emerald-700 font-bold text-sm">{u.name[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{u.name}</p>
                          <p className="text-xs text-gray-400">ID: {u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600 text-xs font-mono">{u.email}</td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition"
                      >
                        {u.rec_count} <span className="text-emerald-500">View →</span>
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {u.is_admin ? (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">Admin</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-lg">User</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Toggle admin — can't change own role */}
                        {u.id !== current?.id && (
                          <button
                            onClick={() => handleToggleAdmin(u)}
                            title={u.is_admin ? "Revoke admin" : "Make admin"}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                              u.is_admin
                                ? "bg-amber-50 hover:bg-amber-100 text-amber-700"
                                : "bg-gray-50 hover:bg-gray-100 text-gray-600"
                            }`}
                          >
                            {u.is_admin ? "Revoke" : "Make Admin"}
                          </button>
                        )}
                        {/* Delete — can't delete self or admin */}
                        {u.id !== current?.id && !u.is_admin && (
                          <button
                            onClick={() => setConfirm(u)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition"
                          >Delete</button>
                        )}
                        {u.id === current?.id && (
                          <span className="text-xs text-gray-300 italic">You</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm">No users match your search.</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          AgriPulse Admin Panel · Only accessible to admin accounts
        </p>
      </div>
    </div>
  );
};

export default Admin;