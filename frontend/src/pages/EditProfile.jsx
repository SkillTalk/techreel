import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../utils/api";

const EditProfile = () => {
  const [user, setUser] = useState(null);
  const [editForm, setEditForm] = useState({ bio: "", website: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) return navigate("/login");

    const fetchUser = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/users/${storedUser._id}`);
        setUser(res.data.user);
        setEditForm({
          bio: res.data.user.bio || "",
          website: res.data.user.website || "",
        });
      } catch (err) {
        console.error("Error fetching user:", err);
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`${BASE_URL}/users/${user._id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/profile");
    } catch (err) {
      console.error("Update failed:", err);
      alert("Update failed.");
    }
  };

  return (
    <div>
      <h2>Edit Profile</h2>
      <input
        type="text"
        value={editForm.bio}
        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
        placeholder="Bio"
      /><br />
      <input
        type="text"
        value={editForm.website}
        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
        placeholder="Website"
      /><br />
      <button onClick={handleSave}>Save Changes</button>
    </div>
  );
};

export default EditProfile;

