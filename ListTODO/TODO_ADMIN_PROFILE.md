# Add Profile and Logout Menu to Admin Page

## Steps:

- [x] 1. Create this TODO file
- [ ] 2. Edit frontend/src/App.js to allow admins access to /profile
- [x] 3. Edit frontend/src/Admin.js to add admin menu with Profile and Logout
- [ ] 4. Test the changes
- [ ] 5. Mark complete







import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // جلب بيانات المستخدم
  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const res = await axios.get("/api/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = res.data;
      setProfile(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setFormData({ name: userData.name || '', email: userData.email || '' });
    } catch (err) {
      console.error("Profile fetch error:", err);
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userData = JSON.parse(userStr);
        setProfile(userData);
        setFormData({ name: userData.name || '', email: userData.email || '' });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // تحديث البيانات
  const updateProfile = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in");
      setUploading(false);
      return;
    }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    if (fileInputRef.current?.files[0]) {
      data.append('profile_image', fileInputRef.current.files[0]);
    }

    try {
      const res = await axios.put("/api/profile", data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const updatedUser = res.data.user;
      setProfile(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setEditMode(false);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.message || err.message || 'Update failed');
    } finally {
      setUploading(false);
    }
  };

  // عرض الصورة المختارة فورياً
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMTAwIiBmaWxsPSIjOTk5OTk5Ii8+CjxwYXRoIGQ9Ik0xMjEgNjBDMTIxIDUyLjg5NzYgMTE0LjEwMiA0NSAxMDkgNDVDMTAzLjg5NyA0NSAxMDAgNTIuODk3NiAxMDAgNjBDMTAwIDY3LjEwMjQgMTAzLjg5NyA3NSAxMDkgNzVDMTE0LjEwMiA3NSAxMjEgNjcuMTAyNCAxMjEgNjBaIE0yMDMgNjBDMjAzIDUyLjg5NzYgMTk2LjEwMiA0NSAxOTEgNDVDMTg1Ljg5NyA0NSAxODIgNTIuODk3NiAxODIgNjBDMTgyIDY3LjEwMjQgMTg1Ljg5NyA3NSAxOTEgNzVDMTk2LjEwMiA3NSAyMDMgNjcuMTAyNCAyMDMgNjBaIiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik01MCAxMTBDNTAgOTguNDAyIDY1LjIwMiA4NSAxMDAlODVIMTcwQzE3MC45NzggODUgMTg2IDEwMC4yMDIgMTg2IDEyMEg1MEM1MCAxMTAgNTAgMTEwIDUwIDExMFoiIGZpbGw9IiNGRkZGRkYiLz4KPC9zdmc+";

  const avatarSrc = imagePreview 
    ? imagePreview 
    : profile?.profile_image 
      ? `/storage/${profile.profile_image}?t=${new Date().getTime()}` 
      : defaultAvatar;

  return (
    <div style={{ padding: "2rem", maxWidth: "500px", margin: "0 auto" }}>
      <h2>My Profile</h2>

      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <img 
          src={avatarSrc} 
          alt="Profile" 
          style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
          onClick={() => fileInputRef.current?.click()}
        />
      </div>

      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      <form onSubmit={updateProfile}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Name:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Email:</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleImageChange}
            accept="image/*"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: uploading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px"
          }}
        >
          {uploading ? "Updating..." : "Save Changes"}
        </button>
      </form>

      <button
        onClick={() => setEditMode(!editMode)}
        style={{ marginTop: "1rem", width: "100%", padding: "0.5rem" }}
      >
        {editMode ? "Cancel" : "Edit Profile"}
      </button>
    </div>
  );
}

export default Profile;