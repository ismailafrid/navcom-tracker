import React, { useState, useEffect } from "react";
import API_BASE_URL from "./api";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [view, setView] = useState("login");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [name, setName] = useState("");
  const [serial, setSerial] = useState("");
  const [category, setCategory] = useState("Radio Comms");

  const [checkoutLocation, setCheckoutLocation] = useState("");
  const [checkoutItemId, setCheckoutItemId] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/check-session`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      fetchItems();
      if (user.role === "admin") fetchAllUsers();
    }
  }, [user]);

  const fetchItems = () => {
    fetch(`${API_BASE_URL}/api/items`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
        else setItems([]);
      })
      .catch(() => setItems([]));
  };

  const fetchAllUsers = () => {
    fetch(`${API_BASE_URL}/api/admin/users`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAllUsers(data);
        else setAllUsers([]);
      })
      .catch(() => setAllUsers([]));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    }).then(async (res) => {
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        setUsername("");
        setPassword("");
      } else {
        alert(data.error || "Login failed");
      }
    });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    }).then(async (res) => {
      const data = await res.json();
      if (res.ok) {
        alert(
          "Registration successful! Please wait for an Admin to approve your account.",
        );
        setView("login");
        setUsername("");
        setPassword("");
      } else {
        alert(data.error || "Registration failed");
      }
    });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/api/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user.username,
        oldPassword,
        newPassword,
      }),
      credentials: "include",
    }).then(async (res) => {
      const data = await res.json();
      if (res.ok) {
        alert("Password changed successfully!");
        setOldPassword("");
        setNewPassword("");
        setView("dashboard");
      } else {
        alert(data.error || "Failed to update password");
      }
    });
  };

  const handleLogout = () => {
    fetch(`${API_BASE_URL}/api/logout`, {
      method: "POST",
      credentials: "include",
    }).then(() => setUser(null));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/api/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, serial_number: serial, category }),
      credentials: "include",
    }).then(() => {
      setName("");
      setSerial("");
      fetchItems();
    });
  };

  const submitCheckout = (id) => {
    fetch(`${API_BASE_URL}/api/items/${id}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location: checkoutLocation }),
      credentials: "include",
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) alert(data.error || "Checkout failed");
      setCheckoutItemId(null);
      setCheckoutLocation("");
      fetchItems();
    });
  };

  const handleReturn = (id) => {
    fetch(`${API_BASE_URL}/api/items/${id}/return`, {
      method: "POST",
      credentials: "include",
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) alert(data.error || "Return failed");
      fetchItems();
    });
  };

  const handleDeleteItem = (id) => {
    if (confirm("Delete this equipment record?")) {
      fetch(`${API_BASE_URL}/api/items/${id}`, {
        method: "DELETE",
        credentials: "include",
      }).then(() => fetchItems());
    }
  };

  const handleApproveUser = (id) => {
    fetch(`${API_BASE_URL}/api/admin/approve/${id}`, {
      method: "POST",
      credentials: "include",
    }).then(() => fetchAllUsers());
  };

  const handleDeleteUser = (id) => {
    if (confirm("Delete this user account?")) {
      fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      }).then(() => fetchAllUsers());
    }
  };

  if (loading)
    return (
      <div
        style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial" }}
      >
        Loading NavCom System...
      </div>
    );

  if (!user) {
    return (
      <div
        style={{
          maxWidth: "360px",
          width: "90%",
          margin: "60px auto",
          background: "white",
          padding: "25px",
          borderRadius: "8px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          fontFamily: "Arial",
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ color: "#0f172a", marginBottom: "5px" }}>
          NavCom Tracker
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", marginTop: 0 }}>
          Vessel Equipment & Tool Checkout
        </p>

        {view === "login" ? (
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
            />
            <button type="submit" style={btnBlue}>
              Login
            </button>
            <p
              style={{
                textAlign: "center",
                fontSize: "13px",
                marginTop: "15px",
              }}
            >
              Don't have an account?{" "}
              <span
                style={{
                  color: "#0284c7",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
                onClick={() => {
                  setView("register");
                  setUsername("");
                  setPassword("");
                }}
              >
                Register
              </span>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Choose Unique Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
              required
            />
            <input
              type="password"
              placeholder="Choose Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
            />
            <button type="submit" style={{ ...btnBlue, background: "#16a34a" }}>
              Submit Registration
            </button>
            <p
              style={{
                textAlign: "center",
                fontSize: "13px",
                marginTop: "15px",
              }}
            >
              Already approved?{" "}
              <span
                style={{
                  color: "#0284c7",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
                onClick={() => {
                  setView("login");
                  setUsername("");
                  setPassword("");
                }}
              >
                Login
              </span>
            </p>
          </form>
        )}
      </div>
    );
  }

  if (view === "reset") {
    return (
      <div
        style={{
          maxWidth: "360px",
          width: "90%",
          margin: "60px auto",
          background: "white",
          padding: "25px",
          borderRadius: "8px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          fontFamily: "Arial",
          boxSizing: "border-box",
        }}
      >
        <h3>Reset Password</h3>
        <form onSubmit={handleResetPassword}>
          <input
            type="password"
            placeholder="Current Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            style={inputStyle}
            required
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={inputStyle}
            required
          />
          <button type="submit" style={btnBlue}>
            Update Password
          </button>
          <button
            type="button"
            onClick={() => setView("dashboard")}
            style={{
              ...btnRed,
              width: "100%",
              marginTop: "10px",
              background: "#64748b",
            }}
          >
            Cancel
          </button>
        </form>
      </div>
    );
  }

  const pendingUsersList = allUsers.filter((u) => u.status === "pending");

  return (
    <div
      style={{
        maxWidth: "1000px",
        width: "95%",
        margin: "15px auto",
        background: "white",
        padding: "15px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        fontFamily: "Arial",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          borderBottom: "2px solid #e2e8f0",
          paddingBottom: "12px",
          marginBottom: "15px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#0f172a", fontSize: "18px" }}>
            NavCom & Bridge Equipment
          </h2>
          <small style={{ color: "#64748b" }}>
            Logged in as: <b>{user.username}</b> ({user.role.toUpperCase()})
          </small>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => setView("reset")}
            style={{
              padding: "6px 10px",
              background: "#d97706",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "12px",
            }}
          >
            Reset Password
          </button>
          <button
            onClick={handleLogout}
            style={{ ...btnRed, padding: "6px 10px", fontSize: "12px" }}
          >
            Logout
          </button>
        </div>
      </div>

      {user.role === "admin" && pendingUsersList.length > 0 && (
        <div
          style={{
            background: "#fef3c7",
            padding: "12px",
            borderRadius: "6px",
            border: "1px solid #f59e0b",
            marginBottom: "15px",
          }}
        >
          <h3
            style={{ margin: "0 0 8px 0", color: "#b45309", fontSize: "15px" }}
          >
            Pending Registrations ({pendingUsersList.length})
          </h3>
          {pendingUsersList.map((u) => (
            <div
              key={u.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "white",
                padding: "8px",
                marginBottom: "6px",
                borderRadius: "4px",
                fontSize: "13px",
                flexWrap: "wrap",
                gap: "5px",
              }}
            >
              <span>
                <b>{u.username}</b> requests access
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => handleApproveUser(u.id)}
                  style={{
                    padding: "4px 8px",
                    background: "#16a34a",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  style={{
                    padding: "4px 8px",
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {user.role === "admin" && (
        <div
          style={{
            background: "#f8fafc",
            padding: "12px",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            marginBottom: "15px",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", fontSize: "15px" }}>
            User Management
          </h3>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {allUsers.map((u) => (
              <div
                key={u.id}
                style={{
                  background: "white",
                  padding: "5px 8px",
                  borderRadius: "4px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                }}
              >
                <span>
                  <b>{u.username}</b> ({u.role})
                </span>
                {u.username !== "admin" && (
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "red",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {user.role === "admin" && (
        <div
          style={{
            background: "#f8fafc",
            padding: "12px",
            borderRadius: "6px",
            border: "1px dashed #cbd5e1",
            marginBottom: "15px",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", fontSize: "15px" }}>
            Add Equipment / Tool
          </h3>
          <form
            onSubmit={handleAddItem}
            style={{ display: "flex", gap: "8px", flexDirection: "column" }}
          >
            <input
              type="text"
              placeholder="Equipment Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ padding: "8px", width: "100%", boxSizing: "border-box" }}
              required
            />
            <input
              type="text"
              placeholder="Serial No. / Asset ID"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              style={{ padding: "8px", width: "100%", boxSizing: "border-box" }}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ padding: "8px", width: "100%", boxSizing: "border-box" }}
            >
              <option value="Radio Comms">Radio Comms</option>
              <option value="GMDSS / Safety">GMDSS / Safety</option>
              <option value="Navigation">Navigation</option>
              <option value="Tools">Tools</option>
              <option value="General">General</option>
            </select>
            <button type="submit" style={btnBlue}>
              Add Equipment
            </button>
          </form>
        </div>
      )}

      <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>Inventory List</h3>
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "650px",
          }}
        >
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <th style={thStyle}>Equipment Name</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Serial No.</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Holder & Location</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isAvailable = item.status === "Available";
              return (
                <tr key={item.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={tdStyle}>
                    <b>{item.name}</b>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        fontSize: "11px",
                        background: "#e2e8f0",
                        padding: "2px 5px",
                        borderRadius: "4px",
                      }}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td style={tdStyle}>{item.serial_number || "-"}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "3px 6px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "bold",
                        background: isAvailable ? "#dcfce7" : "#fee2e2",
                        color: isAvailable ? "#166534" : "#991b1b",
                      }}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td style={tdStyle}>{item.current_holder}</td>
                  <td style={tdStyle}>
                    <div
                      style={{
                        display: "flex",
                        gap: "5px",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      {isAvailable ? (
                        checkoutItemId === item.id ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "4px",
                              flexDirection: "column",
                            }}
                          >
                            <input
                              type="text"
                              placeholder="Location / Note"
                              value={checkoutLocation}
                              onChange={(e) =>
                                setCheckoutLocation(e.target.value)
                              }
                              style={{
                                padding: "4px",
                                width: "100px",
                                fontSize: "12px",
                              }}
                            />
                            <div style={{ display: "flex", gap: "4px" }}>
                              <button
                                onClick={() => submitCheckout(item.id)}
                                style={{
                                  padding: "4px 6px",
                                  background: "#16a34a",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                }}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setCheckoutItemId(null)}
                                style={{
                                  padding: "4px 6px",
                                  background: "#64748b",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                }}
                              >
                                X
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCheckoutItemId(item.id)}
                            style={{
                              padding: "5px 10px",
                              background: "#0284c7",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "bold",
                              fontSize: "12px",
                            }}
                          >
                            Checkout
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handleReturn(item.id)}
                          style={{
                            padding: "5px 10px",
                            background: "#d97706",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "12px",
                          }}
                        >
                          Return
                        </button>
                      )}
                      {user.role === "admin" && (
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          style={{
                            ...btnRed,
                            padding: "5px 8px",
                            fontSize: "12px",
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "12px",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: "4px",
  fontSize: "14px",
};
const btnBlue = {
  width: "100%",
  padding: "10px",
  background: "#0284c7",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: "14px",
};
const btnRed = {
  padding: "5px 10px",
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "bold",
};
const thStyle = {
  padding: "10px",
  textAlign: "left",
  fontSize: "12px",
  color: "#475569",
};
const tdStyle = { padding: "10px", fontSize: "13px" };
