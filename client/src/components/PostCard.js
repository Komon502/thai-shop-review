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
      onUpdate(); // Update post count
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (rating) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/posts/${post.id}/rating`,
        { rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUserRating(rating);
      onUpdate(); // Update post ratings
    } catch (error) {
      console.error('Error adding rating:', error);
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

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-author">
          {post.author_image && (
            <img 
              src={`http://localhost:5000${post.author_image}`} 
              alt={post.author_name}
              className="author-avatar"
            />
          )}
          <div className="author-info">
            <h4>{post.author_name}</h4>
            <span className="post-date">{formatDate(post.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="post-content">
        <h3 className="shop-name">{post.shop_name}</h3>
        
        {post.image_url && (
          <img 
            src={`http://localhost:5000${post.image_url}`} 
            alt={post.shop_name}
            className="post-image"
          />
        )}
        
        <p className="post-description">{post.description}</p>
        
        {post.address && (
          <div className="post-location">
            <span className="location-icon">📍</span>
            <span>{post.address}</span>
          </div>
        )}

        <div className="post-stats">
          <div className="rating-display">
            {renderStars(Math.round(post.average_rating))}
            <span className="rating-text">
              {post.average_rating > 0 ? post.average_rating.toFixed(1) : 'ไม่มีคะแนน'} 
              ({post.total_ratings} คะแนน)
            </span>
          </div>
          
          <div className="comment-count">
            💬 {post.total_comments} ความคิดเห็น
          </div>
        </div>
      </div>

      <div className="post-actions">
        <div className="rating-section">
          <span>ให้คะแนน: </span>
          {renderStars(userRating, true)}
        </div>
        
        <button 
          className="toggle-comments-btn"
          onClick={() => setShowComments(!showComments)}
        >
          {showComments ? 'ซ่อนความคิดเห็น' : 'แสดงความคิดเห็น'}
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          <form onSubmit={handleAddComment} className="comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="เขียนความคิดเห็น..."
              rows="3"
            />
            <button type="submit" disabled={loading || !newComment.trim()}>
              {loading ? 'กำลังส่ง...' : 'ส่งความคิดเห็น'}
            </button>
          </form>

          <div className="comments-list">
            {comments.map(comment => (
              <div key={comment.id} className="comment">
                <div className="comment-header">
                  {comment.profile_image && (
                    <img 
                      src={`http://localhost:5000${comment.profile_image}`} 
                      alt={comment.username}
                      className="comment-avatar"
                    />
                  )}
                  <div className="comment-info">
                    <span className="comment-author">{comment.username}</span>
                    <span className="comment-date">{formatDate(comment.created_at)}</span>
                  </div>
                </div>
                <p className="comment-text">{comment.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;