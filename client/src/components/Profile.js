import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    profile_image: ''
  });
  const [formData, setFormData] = useState({
    username: ''
  });
  const [newImage, setNewImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProfileData(response.data);
      setFormData({ username: response.data.username });
      
      if (response.data.profile_image) {
        setImagePreview(`http://localhost:5000${response.data.profile_image}`);
      }
    } catch (error) {
      setError('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUpdating(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      formDataToSend.append('username', formData.username);
      
      if (newImage) {
        formDataToSend.append('profile_image', newImage);
      }

      const response = await axios.put(
        'http://localhost:5000/api/profile',
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.message) {
        setSuccess('อัปเดตโปรไฟล์เรียบร้อยแล้ว');
        
        // Update user data in parent component
        const updatedUser = {
          ...user,
          username: formData.username
        };
        
        if (newImage) {
          // Refresh profile to get new image URL
          await fetchProfile();
        }
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="loading">กำลังโหลดโปรไฟล์...</div>;
  }

  return (
    <div className="create-post-container">
      <div className="create-post-card">
        <h2>แก้ไขโปรไฟล์</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>รูปโปรไฟล์ปัจจุบัน:</label>
            <div className="current-profile-image">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Profile" 
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #ddd'
                  }}
                />
              ) : (
                <div 
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    border: '3px solid #ddd'
                  }}
                >
                  👤
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="profile_image">เปลี่ยนรูปโปรไฟล์:</label>
            <input
              type="file"
              id="profile_image"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">ชื่อผู้ใช้:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="ชื่อผู้ใช้"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">อีเมล:</label>
            <input
              type="email"
              id="email"
              value={profileData.email}
              disabled
              style={{
                backgroundColor: '#f5f5f5',
                cursor: 'not-allowed'
              }}
            />
            <small style={{ color: '#666', fontSize: '0.8rem' }}>
              อีเมลไม่สามารถแก้ไขได้
            </small>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && (
            <div style={{
              color: '#28a745',
              textAlign: 'center',
              margin: '1rem 0',
              padding: '0.5rem',
              background: '#d4edda',
              borderRadius: '5px',
              border: '1px solid #c3e6cb'
            }}>
              {success}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/')}
              className="cancel-btn"
            >
              กลับ
            </button>
            
            <button 
              type="submit" 
              disabled={updating}
              className="submit-btn"
            >
              {updating ? 'กำลังอัปเดต...' : 'อัปเดตโปรไฟล์'}
            </button>
          </div>
        </form>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px',
          border: '1px solid #dee2e6'
        }}>
          <h4 style={{ marginBottom: '1rem', color: '#333' }}>ข้อมูลบัญชี</h4>
          <p><strong>อีเมล:</strong> {profileData.email}</p>
          <p><strong>สมาชิกเมื่อ:</strong> {new Date().toLocaleDateString('th-TH')}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;