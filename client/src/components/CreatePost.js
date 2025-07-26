import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreatePost = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    shop_name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: ''
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('ไม่สามารถรับตำแหน่งปัจจุบันได้');
        }
      );
    } else {
      alert('เบราว์เซอร์ไม่รองรับ GPS');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      if (image) {
        formDataToSend.append('image', image);
      }

      const response = await axios.post(
        'http://localhost:5000/api/posts',
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.postId) {
        navigate('/');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'เกิดข้อผิดพลาดในการสร้างโพสต์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-container">
      <div className="create-post-card">
        <h2>แบ่งปันร้านค้าดีๆ</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="shop_name">ชื่อร้าน:</label>
            <input
              type="text"
              id="shop_name"
              name="shop_name"
              value={formData.shop_name}
              onChange={handleChange}
              required
              placeholder="ชื่อร้านค้า"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">รายละเอียด:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              placeholder="เล่าถึงร้านนี้ว่าเป็นยังไง อาหารอร่อยไหม บรรยากาศเป็นอย่างไร..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">ที่อยู่:</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="ที่อยู่ร้านค้า"
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">รูปภาพ:</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
            />
            
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/')}
              className="cancel-btn"
            >
              ยกเลิก
            </button>
            
            <button 
              type="submit" 
              disabled={loading}
              className="submit-btn"
            >
              {loading ? 'กำลังสร้างโพสต์...' : 'แบ่งปันร้านค้า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;