import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PostCard = ({ post, currentUser, onUpdate }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  // เพิ่ม useEffect สำหรับดึงคะแนนของผู้ใช้
  useEffect(() => {
    if (currentUser) {
      fetchUserRating();
    }
  }, [post.id, currentUser]);

  const fetchUserRating = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get(
        `http://localhost:5000/api/posts/${post.id}/user-rating`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserRating(response.data.rating);
    } catch (error) {
      console.error('Error fetching user rating:', error);
      // ถ้าไม่สามารถดึงได้ (เช่น ไม่ได้ล็อกอิน) ให้ใช้ค่า 0
      setUserRating(0);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/posts/${post.id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/posts/${post.id}/comments`,
        { comment: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNewComment('');
      fetchComments();
      onUpdate(); // Refresh posts or ratings if needed
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (rating) => {
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบเพื่อให้คะแนน');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/posts/${post.id}/rating`,
        { rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUserRating(rating);
      onUpdate(); // Refresh posts or ratings if needed
    } catch (error) {
      console.error('Error adding rating:', error);
      alert('ไม่สามารถให้คะแนนได้ กรุณาลองอีกครั้ง');
    }
  };

  const renderStars = (rating, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= rating ? 'filled' : 'empty'} ${interactive ? 'interactive' : ''}`}
          onClick={interactive ? () => handleRating(i) : undefined}
          style={{ 
            cursor: interactive && currentUser ? 'pointer' : 'default', 
            color: i <= rating ? '#f39c12' : '#ccc', 
            fontSize: 20,
            opacity: interactive && !currentUser ? 0.5 : 1
          }}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const ratingValue = Number(post.average_rating);
  const displayRating = isNaN(ratingValue) ? 'ไม่มีคะแนน' : ratingValue.toFixed(1);

  return (
    <div className="post-card" style={{ border: '1px solid #ddd', padding: 16, marginBottom: 20, borderRadius: 8 }}>
      <div className="post-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        {post.author_image && (
          <img 
            src={`http://localhost:5000${post.author_image}`} 
            alt={post.author_name}
            style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 10 }}
          />
        )}
        <div>
          <h4 style={{ margin: 0 }}>{post.author_name}</h4>
          <small style={{ color: '#666' }}>{formatDate(post.created_at)}</small>
        </div>
      </div>

      <h3 className="shop-name">{post.shop_name}</h3>
      
      {post.image_url && (
        <img 
          src={`http://localhost:5000${post.image_url}`} 
          alt={post.shop_name}
          style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }}
        />
      )}
      
      <p>{post.description}</p>
      
      {post.address && (
        <div className="post-location" style={{ marginBottom: 12 }}>
          <span role="img" aria-label="location">📍</span> {post.address}
        </div>
      )}

      <div className="post-stats" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="rating-display" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {renderStars(Math.round(ratingValue))}
          <span>{displayRating} ({post.total_ratings || 0} คะแนน)</span>
        </div>
        <div className="comment-count">
          💬 {post.total_comments || 0} ความคิดเห็น
        </div>
      </div>

      <div className="post-actions" style={{ marginBottom: 12 }}>
        <div className="rating-section" style={{ marginBottom: 8 }}>
          <span>ให้คะแนน: </span>
          {renderStars(userRating, true)}
          {userRating > 0 && (
            <small style={{ marginLeft: 8, color: '#666' }}>
              (คุณให้คะแนน {userRating} ดาว)
            </small>
          )}
          {!currentUser && (
            <small style={{ marginLeft: 8, color: '#999' }}>
              (เข้าสู่ระบบเพื่อให้คะแนน)
            </small>
          )}
        </div>
        
        <button 
          onClick={() => setShowComments(!showComments)}
          style={{ cursor: 'pointer', background: '#007bff', color: '#fff', padding: '6px 12px', border: 'none', borderRadius: 4 }}
        >
          {showComments ? 'ซ่อนความคิดเห็น' : 'แสดงความคิดเห็น'}
        </button>
      </div>

      {showComments && (
        <div className="comments-section" style={{ marginTop: 12 }}>
          {currentUser && (
            <form onSubmit={handleAddComment} style={{ marginBottom: 12 }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="เขียนความคิดเห็น..."
                rows="3"
                style={{ width: '100%', padding: 8, resize: 'vertical' }}
                required
              />
              <button 
                type="submit" 
                disabled={loading || !newComment.trim()}
                style={{ marginTop: 8, padding: '8px 16px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'กำลังส่ง...' : 'ส่งความคิดเห็น'}
              </button>
            </form>
          )}

          <div className="comments-list">
            {comments.length === 0 ? (
              <p>ยังไม่มีความคิดเห็น</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} style={{ borderBottom: '1px solid #eee', paddingBottom: 8, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    {comment.profile_image && (
                      <img 
                        src={`http://localhost:5000${comment.profile_image}`} 
                        alt={comment.username}
                        style={{ width: 30, height: 30, borderRadius: '50%', marginRight: 8 }}
                      />
                    )}
                    <strong>{comment.username}</strong>
                    <small style={{ marginLeft: 'auto', color: '#999' }}>{formatDate(comment.created_at)}</small>
                  </div>
                  <p style={{ margin: 0 }}>{comment.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;