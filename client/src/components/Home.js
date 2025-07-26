import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PostCard from './PostCard';

const Home = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('ไม่สามารถโหลดโพสต์ได้');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>กำลังโหลดโพสต์...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="home-container" style={{ maxWidth: 900, margin: 'auto', padding: 16 }}>
      <h1>ร้านค้าแนะนำ</h1>
      <p>ค้นหาและแบ่งปันร้านค้าดีๆ ในไทย</p>

      {posts.length === 0 ? (
        <div>
          <p>ยังไม่มีโพสต์ร้านค้า</p>
          <p>เป็นคนแรกที่แบ่งปันร้านค้าดีๆ กันเถอะ!</p>
        </div>
      ) : (
        posts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            currentUser={user} 
            onUpdate={fetchPosts} 
          />
        ))
      )}
    </div>
  );
};

export default Home;
