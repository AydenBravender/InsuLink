import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import InsuLinkLogo from "../assets/InsuLinkLogo.png";

type Profile = {
  firstName: string;
  lastName: string;
  gender: string;
  weight: string;
  height: string;
  age: string;
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
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
    <>
      <div className="navbar bg-base-200 shadow-xl mb-10 px-4 rounded-2xl">
        <div className="flex justify-between w-full items-center">
          {/* Logo on the left */}
          <div className="flex-1 flex items-center">
            <Link to="/app">
              <img
                src={InsuLinkLogo}
                alt="InsuLink logo"
                className="w-30 drop-shadow-xl cursor-pointer"
              />
            </Link>
          </div>

          {/* Notifications & Profile on the right */}
          <div className="flex-none flex items-center gap-2">
            {/* Notification Button */}
            <button className="btn btn-ghost btn-circle">
              <div className="indicator">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="badge badge-xs badge-primary indicator-item"></span>
              </div>
            </button>

            {/* Profile Dropdown */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar"
                onClick={() => setOpen(true)}
              >
                <div className="w-10 rounded-full">
                  <img
                    alt="Profile"
                    src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                  />
                </div>
              </div>
              <ul
                tabIndex={-1}
                className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
              >
                <li>
                  <button
                    onClick={() => setOpen(true)}
                    className="justify-between w-full text-left"
                  >
                    Profile
                    {profile && <span className="badge">New</span>}
                  </button>
                </li>
                <li>
                  <a>Logout</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <dialog className={`modal ${open ? "modal-open" : ""}`}>
        <div className="modal-box bg-base-200">
          <h3 className="font-bold text-lg mb-4">Profile</h3>

          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <label className="form-control">
                <span className="label-text">First Name</span>
                <input
                  className="input input-bordered"
                  value={editing.firstName}
                  onChange={(e) =>
                    setEditing({ ...editing, firstName: e.target.value })
                  }
                />
              </label>
              <label className="form-control">
                <span className="label-text">Last Name</span>
                <input
                  className="input input-bordered"
                  value={editing.lastName}
                  onChange={(e) =>
                    setEditing({ ...editing, lastName: e.target.value })
                  }
                />
              </label>
              <label className="form-control">
                <span className="label-text">Gender</span>
                <input
                  className="input input-bordered"
                  value={editing.gender}
                  onChange={(e) =>
                    setEditing({ ...editing, gender: e.target.value })
                  }
                />
              </label>
              <label className="form-control">
                <span className="label-text">Weight (kg)</span>
                <input
                  className="input input-bordered"
                  type="number"
                  value={editing.weight}
                  onChange={(e) =>
                    setEditing({ ...editing, weight: e.target.value })
                  }
                />
              </label>
              <label className="form-control">
                <span className="label-text">Height (cm)</span>
                <input
                  className="input input-bordered"
                  type="number"
                  value={editing.height}
                  onChange={(e) =>
                    setEditing({ ...editing, height: e.target.value })
                  }
                />
              </label>
              <label className="form-control">
                <span className="label-text">Age</span>
                <input
                  className="input input-bordered"
                  type="number"
                  value={editing.age}
                  onChange={(e) =>
                    setEditing({ ...editing, age: e.target.value })
                  }
                />
              </label>
            </div>
          )}

          {profile && (
            <div className="mt-4 text-sm opacity-70">
              Saved: {profile.firstName} {profile.lastName} · {profile.gender} ·{" "}
              {profile.age}y · {profile.height}cm · {profile.weight}kg
            </div>
          )}

          <div className="modal-action">
            <button
              className="btn btn-secondary"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
            <button className="btn btn-primary" onClick={save}>
              Save
            </button>
          </div>
        </div>
        <form
          method="dialog"
          className="modal-backdrop"
          onClick={() => setOpen(false)}
        >
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
