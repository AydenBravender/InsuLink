import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

type Profile = {
  firstName: string;
  lastName: string;
  gender: string;
  weight: string;
  height: string;
  age: string;
};

export default function AppShell() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("insulinkProfile");
    if (raw) {
      const p: Profile = JSON.parse(raw);
      setProfile(p);
      setEditing(p);
    }
  }, []);

  const save = () => {
    if (!editing) return;
    localStorage.setItem("insulinkProfile", JSON.stringify(editing));
    setProfile(editing);
    setOpen(false);
  };

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      {/* Top bar */}
      <div className="navbar bg-base-200/60 backdrop-blur border-b border-base-300">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost text-xl">InsuLink</Link>
        </div>

        <div className="flex-none gap-2">
          <button className="btn btn-primary" onClick={() => navigate("/questionnaire")}>
            Start Questionnaire
          </button>
          <button className="btn btn-circle btn-ghost" onClick={() => setOpen(true)} aria-label="Profile">
            {/* simple user icon */}
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.761 0 5-2.686 5-6s-2.239-6-5-6-5 2.686-5 6 2.239 6 5 6zm0 2c-5.33 0-8 3.582-8 6v2h16v-2c0-2.418-2.67-6-8-6z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Main area placeholder for future tabs/sections */}
      <div className="p-6 grid gap-6 md:grid-cols-2">
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Current State</h2>
            <p>Metrics cards will go here (Sleep, Fitness, Heart, Insights)…</p>
          </div>
        </div>
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Next Actions</h2>
            <p>Routines / Notifications quick view…</p>
          </div>
        </div>
      </div>

      {/* Profile modal */}
      <dialog className={`modal ${open ? "modal-open" : ""}`}>
        <div className="modal-box bg-base-200">
          <h3 className="font-bold text-lg mb-4">Profile</h3>

          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <label className="form-control">
                <span className="label-text">First Name</span>
                <input className="input input-bordered"
                  value={editing.firstName}
                  onChange={(e)=>setEditing({...editing, firstName: e.target.value})}/>
              </label>
              <label className="form-control">
                <span className="label-text">Last Name</span>
                <input className="input input-bordered"
                  value={editing.lastName}
                  onChange={(e)=>setEditing({...editing, lastName: e.target.value})}/>
              </label>
              <label className="form-control">
                <span className="label-text">Gender</span>
                <input className="input input-bordered"
                  value={editing.gender}
                  onChange={(e)=>setEditing({...editing, gender: e.target.value})}/>
              </label>
              <label className="form-control">
                <span className="label-text">Weight (kg)</span>
                <input className="input input-bordered" type="number"
                  value={editing.weight}
                  onChange={(e)=>setEditing({...editing, weight: e.target.value})}/>
              </label>
              <label className="form-control">
                <span className="label-text">Height (cm)</span>
                <input className="input input-bordered" type="number"
                  value={editing.height}
                  onChange={(e)=>setEditing({...editing, height: e.target.value})}/>
              </label>
              <label className="form-control">
                <span className="label-text">Age</span>
                <input className="input input-bordered" type="number"
                  value={editing.age}
                  onChange={(e)=>setEditing({...editing, age: e.target.value})}/>
              </label>
            </div>
          )}

          {profile && (
            <div className="mt-4 text-sm opacity-70">
              Saved: {profile.firstName} {profile.lastName} · {profile.gender} · {profile.age}y · {profile.height}cm · {profile.weight}kg
            </div>
          )}

          <div className="modal-action">
            <button className="btn btn-secondary" onClick={()=>setOpen(false)}>Close</button>
            <button className="btn btn-primary" onClick={save}>Save</button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop" onClick={()=>setOpen(false)}>
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
