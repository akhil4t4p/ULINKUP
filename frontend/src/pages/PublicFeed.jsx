import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import NeomorphicCard from '../components/NeomorphicCard';
import GroupChat from '../components/community/GroupChat';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

export default function PublicFeed() {
  const { user, isAuthenticated } = useContext(AuthContext);

  // States
  const [posts, setPosts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null); // Filter feed by group
  const [businessProfile, setBusinessProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, IMAGE, YOUTUBE, LINK, TEXT
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Create Post States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSocialMediaModal, setShowSocialMediaModal] = useState(false);
  const [postCaption, setPostCaption] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [postGroupId, setPostGroupId] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);

  // Create Group States
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupCategory, setGroupCategory] = useState('General');
  const [isCustomGroupCategory, setIsCustomGroupCategory] = useState(false);
  const [groupLocation, setGroupLocation] = useState('');
  const [groupRules, setGroupRules] = useState('');
  const [submittingGroup, setSubmittingGroup] = useState(false);

  // Group Members Modal States
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [membersGroup, setMembersGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Debounce link preview check
  const previewTimeoutRef = useRef(null);

  // Group categories list
  const GROUP_CATEGORIES = [
    'General',
    'Local Neighborhood',
    'Social & Meetups',
    'Buy & Sell',
    'Sports & Fitness',
    'Hobbies & Pets',
    'Professional & Business',
    'Education'
  ];

  // Load Groups
  const fetchGroups = async (searchVal = searchQuery) => {
    setLoadingGroups(true);
    try {
      let url = '/api/community/groups/';
      const params = [];
      if (searchVal) {
        params.push(`search=${encodeURIComponent(searchVal)}`);
      }
      if (selectedCategoryFilter) {
        params.push(`category=${encodeURIComponent(selectedCategoryFilter)}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      const res = await api.get(url);
      setGroups(res.data.results || res.data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Load Posts
  const fetchPosts = async (searchVal = searchQuery) => {
    setLoadingPosts(true);
    try {
      let url = '/api/community/posts/';
      const params = [];
      if (activeGroup) {
        params.push(`community=${activeGroup.id}`);
      }
      if (activeTab !== 'ALL') {
        params.push(`type=${activeTab}`);
      }
      if (searchVal) {
        params.push(`search=${encodeURIComponent(searchVal)}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      const res = await api.get(url);
      setPosts(res.data.results || res.data);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Search Form Handlers
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPosts(searchQuery);
    fetchGroups(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchPosts('');
    fetchGroups('');
  };

  useEffect(() => {
    if (user && user.role === 'BUSINESS') {
      api.get('/api/businesses/me/').then(res => setBusinessProfile(res.data)).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    fetchGroups(searchQuery);
  }, [selectedCategoryFilter]);

  useEffect(() => {
    fetchPosts(searchQuery);
  }, [activeGroup, activeTab]);

  // Fetch link preview on url change
  useEffect(() => {
    if (!postUrl) {
      setPreviewData(null);
      return;
    }

    // Basic URL validation
    if (!postUrl.startsWith('http://') && !postUrl.startsWith('https://')) {
      return;
    }

    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    setLoadingPreview(true);
    previewTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/api/community/link-preview/?url=${encodeURIComponent(postUrl)}`);
        setPreviewData(res.data);
      } catch (err) {
        console.error('Error resolving link preview:', err);
        setPreviewData(null);
      } finally {
        setLoadingPreview(false);
      }
    }, 1000);

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [postUrl]);

  // Join / Leave Group handlers
  const handleJoinLeaveGroup = async (group) => {
    if (!user) {
      alert('Please sign in to join groups.');
      return;
    }
    if (businessProfile?.is_restricted) {
      alert('Your business profile has reached its free limit. Please upgrade to Silver or Gold plan to use Groups and AI Chat.');
      return;
    }

    try {
      if (group.is_member) {
        const res = await api.post(`/api/community/groups/${group.id}/leave/`);
        if (res.data.left) {
          // Update groups list
          setGroups(prev => prev.map(g => g.id === group.id ? { ...g, is_member: false, member_count: res.data.member_count } : g));
          if (activeGroup?.id === group.id) {
            setActiveGroup(prev => ({ ...prev, is_member: false, member_count: res.data.member_count }));
          }
        }
      } else {
        const res = await api.post(`/api/community/groups/${group.id}/join/`);
        if (res.data.joined) {
          // Update groups list
          setGroups(prev => prev.map(g => g.id === group.id ? { ...g, is_member: true, member_count: res.data.member_count } : g));
          if (activeGroup?.id === group.id) {
            setActiveGroup(prev => ({ ...prev, is_member: true, member_count: res.data.member_count }));
          }
        }
      }
    } catch (err) {
      console.error('Error join/leave group:', err);
    }
  };

  // View Members handler
  const handleViewMembers = async (group) => {
    setMembersGroup(group);
    setShowMembersModal(true);
    setLoadingMembers(true);
    try {
      const res = await api.get(`/api/community/groups/${group.id}/members/`);
      setGroupMembers(res.data);
    } catch (err) {
      console.error('Error fetching members:', err);
      setGroupMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Like Post handler
  const handleLikePost = async (post) => {
    if (!isAuthenticated) {
      alert('Please sign in to like posts.');
      return;
    }

    try {
      const res = await api.post(`/api/community/posts/${post.id}/like/`);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_liked: res.data.liked, like_count: res.data.like_count } : p));
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  // Delete Post handler
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.delete(`/api/community/posts/${postId}/`);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Could not delete post.');
    }
  };

  // Image Selection change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPostImage(null);
      setImagePreview(null);
    }
  };

  // Create Post Submit
  const handleCreatePostSubmit = async (e) => {
    e.preventDefault();
    if (!postCaption.trim() && !postUrl.trim() && !postImage) {
      alert('Please provide some caption, image, or link.');
      return;
    }

    setSubmittingPost(true);
    try {
      const formData = new FormData();
      formData.append('caption', postCaption);
      formData.append('url', postUrl);
      if (postImage) {
        formData.append('image', postImage);
        formData.append('post_type', 'IMAGE');
      } else if (postUrl) {
        if (previewData?.type === 'YOUTUBE') {
          formData.append('post_type', 'YOUTUBE');
        } else {
          formData.append('post_type', 'LINK');
        }
      } else {
        formData.append('post_type', 'TEXT');
      }

      if (postGroupId) {
        formData.append('community', postGroupId);
      }

      const res = await api.post('/api/community/posts/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Insert new post at top of feed
      setPosts(prev => [res.data, ...prev]);

      // Reset Create Post Form
      setPostCaption('');
      setPostUrl('');
      setPostImage(null);
      setImagePreview(null);
      setPostGroupId('');
      setShowCreateModal(false);
      setShowSocialMediaModal(false);
      fetchPosts();
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Failed to share post.');
    } finally {
      setSubmittingPost(false);
    }
  };

  // Create Group Submit
  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    if (businessProfile?.is_restricted) {
      alert('Your business profile has reached its free limit. Please upgrade to Silver or Gold plan to use Groups and AI Chat.');
      return;
    }
    if (!groupName.trim()) {
      alert('Group name is required.');
      return;
    }

    setSubmittingGroup(true);
    try {
      const res = await api.post('/api/community/groups/', {
        name: groupName,
        description: groupDesc,
        category: groupCategory,
        location: groupLocation,
        rules: groupRules,
        is_public: true
      });
      // Add group to list
      setGroups(prev => [res.data, ...prev]);
      // Reset form
      setGroupName('');
      setGroupDesc('');
      setGroupCategory('General');
      setIsCustomGroupCategory(false);
      setGroupLocation('');
      setGroupRules('');
      setShowCreateGroupModal(false);
      alert(`Group "${res.data.name}" created successfully!`);
    } catch (err) {
      console.error('Error creating group:', err);
      alert(err.response?.data?.name?.[0] || 'Failed to create group.');
    } finally {
      setSubmittingGroup(false);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ fontFamily: 'var(--font-family)' }}>
      {/* Page Header */}
      <div className="row mb-4 align-items-center">
        <div className="col-12 col-md-6">
          <h1 className="fw-extrabold mb-1">
            <span className="text-primary"><i className="bi bi-people-fill me-2"></i>Public Community</span> Feed
          </h1>
          <p className="text-secondary mb-0">
            Share images, pamphlets, videos, and links. Join groups and connect with the community.
          </p>
        </div>
        <div className="col-12 col-md-6 text-md-end mt-3 mt-md-0">
          {isAuthenticated ? (
            <div className="d-flex justify-content-md-end gap-3">
              <button 
                onClick={() => setShowCreateGroupModal(true)} 
                className="neo-btn"
              >
                <i className="bi bi-plus-circle-fill me-2 text-success"></i>Create Group
              </button>
              <button 
                onClick={() => {
                  setPostGroupId(activeGroup ? activeGroup.id : '');
                  setShowCreateModal(true);
                }} 
                className="neo-btn-accent"
              >
                <i className="bi bi-pencil-square me-2"></i>Share Pamphlet / Link
              </button>
            </div>
          ) : (
            <Link to="/login" className="neo-btn-accent text-decoration-none d-inline-block">
              <i className="bi bi-box-arrow-in-right me-2"></i>Sign In to Share & Join Groups
            </Link>
          )}
        </div>
      </div>

      {/* Search and Category Filter Row */}
      <NeomorphicCard elevation="inset" className="mb-4 p-3 border-0">
        <form onSubmit={handleSearchSubmit} className="row g-3 align-items-center">
          <div className="col-12 col-md-5 col-lg-6">
            <div className="position-relative d-flex align-items-center">
              <i className="bi bi-search text-muted position-absolute ms-3" style={{ pointerEvents: 'none' }}></i>
              <input 
                type="text"
                className="form-control neo-input w-100 ps-5"
                placeholder="Search community posts, pamphlets, groups, locations, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-sm-6 col-md-4 col-lg-3">
            <select
              className="form-select neo-input w-100"
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            >
              <option value="">Filter Groups by Category</option>
              {GROUP_CATEGORIES.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-sm-6 col-md-3 col-lg-3 d-flex gap-2">
            <button type="submit" className="neo-btn-accent w-100 py-2">
              Search
            </button>
            {(searchQuery || selectedCategoryFilter) && (
              <button 
                type="button" 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategoryFilter('');
                  fetchPosts('');
                  // Note: Since setSelectedCategoryFilter is async, we call fetchGroups directly with clear values
                  setGroups(null); // triggers reload effect
                  fetchGroups('');
                }} 
                className="neo-btn w-50 py-2 border-0 bg-transparent text-danger"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </NeomorphicCard>

      <div className="row g-4">
        {/* Left Column: Groups / Communities List */}
        <div className="col-12 col-lg-3">
          <NeomorphicCard elevation="convex" className="h-100 p-3">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
              <h5 className="mb-0 fw-bold"><i className="bi bi-hash text-muted"></i> Communities</h5>
              <span className="badge neo-badge">{groups.length}</span>
            </div>

            {loadingGroups ? (
              <div className="text-center py-4 text-muted">
                <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                <div>Loading groups...</div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                <button
                  onClick={() => setActiveGroup(null)}
                  className={`text-start w-100 neo-btn px-3 py-2 border-0 d-flex align-items-center justify-content-between ${!activeGroup ? 'active' : ''}`}
                >
                  <span className="fw-bold"><i className="bi bi-globe me-2 text-primary"></i>Global Board</span>
                  <i className="bi bi-chevron-right text-muted small"></i>
                </button>

                {groups.map((group) => (
                  <div 
                    key={group.id} 
                    className={`neo-flat p-2 d-flex flex-column gap-2 border-0 transition-all ${activeGroup?.id === group.id ? 'neo-inset' : ''}`}
                    style={{ borderRadius: '12px' }}
                  >
                    <div 
                      onClick={() => setActiveGroup(group)}
                      className="d-flex align-items-start gap-2 cursor-pointer w-100"
                    >
                      <div className="neo-badge p-2 bg-light d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', borderRadius: '50%' }}>
                        <span className="fw-bold text-dark">{group.name[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="fw-bold text-truncate text-primary mb-0" style={{ fontSize: '0.95rem' }}>{group.name}</div>
                        <div className="text-muted text-truncate small" style={{ fontSize: '0.8rem' }}>{group.description || 'No description.'}</div>
                        <div className="d-flex gap-1 flex-wrap mt-1">
                          <span className="badge bg-secondary-subtle text-secondary border px-1" style={{ fontSize: '0.65rem' }}>{group.category}</span>
                          {group.location && (
                            <span className="badge bg-light text-muted border px-1" style={{ fontSize: '0.65rem' }}><i className="bi bi-geo-alt-fill"></i> {group.location}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mt-1 pt-1 border-top border-light">
                      <span className="small text-muted fw-bold">
                        <i className="bi bi-people me-1"></i>{group.member_count} members
                      </span>
                      <div className="d-flex gap-1">
                        <button 
                          onClick={() => handleViewMembers(group)}
                          className="neo-btn py-1 px-2 border-0 bg-transparent text-secondary"
                          style={{ fontSize: '0.75rem' }}
                          title="View Member List"
                        >
                          <i className="bi bi-person-lines-fill"></i>
                        </button>
                        <button 
                          onClick={() => handleJoinLeaveGroup(group)}
                          className={`neo-btn py-1 px-2 border-0 ${group.is_member ? 'bg-danger text-white' : 'bg-success text-white'}`}
                          style={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                        >
                          {group.is_member ? 'Leave' : 'Join'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {groups.length === 0 && (
                  <div className="text-center py-4 text-muted small">No community groups created yet. Be the first to create one!</div>
                )}
              </div>
            )}
          </NeomorphicCard>
        </div>

        {/* Middle Column: Feed Posts */}
        <div className="col-12 col-lg-9">
          {/* Active Group Header Banner */}
          {activeGroup && (
            <NeomorphicCard elevation="inset" className="mb-4 p-3 bg-light border-0">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-3 pb-3 border-bottom border-light">
                <div>
                  <div className="d-flex gap-2 align-items-center mb-2 flex-wrap">
                    <span className="badge bg-primary fw-semibold"><i className="bi bi-hash"></i> COMMUNITY GROUP</span>
                    <span className="badge bg-secondary-subtle text-secondary border">{activeGroup.category}</span>
                    {activeGroup.location && (
                      <span className="badge bg-light text-muted border"><i className="bi bi-geo-alt-fill"></i> {activeGroup.location}</span>
                    )}
                  </div>
                  <h3 className="fw-extrabold mb-1">{activeGroup.name}</h3>
                  <p className="text-secondary mb-0 small">{activeGroup.description || 'Welcome to this public community group!'}</p>
                </div>
                <div className="d-flex gap-2 flex-shrink-0">
                  <button 
                    onClick={() => handleViewMembers(activeGroup)}
                    className="neo-btn bg-white"
                  >
                    <i className="bi bi-person-lines-fill me-2"></i>Members List
                  </button>
                  <button 
                    onClick={() => handleJoinLeaveGroup(activeGroup)}
                    className={`neo-btn ${activeGroup.is_member ? 'text-danger' : 'neo-btn-accent text-white'}`}
                  >
                    {activeGroup.is_member ? <><i className="bi bi-box-arrow-right me-2"></i>Leave</> : <><i className="bi bi-plus-lg me-2"></i>Join Group</>}
                  </button>
                </div>
              </div>
              
              {activeGroup.rules && (
                <div className="neo-flat p-2 px-3 bg-white border-0 mb-2" style={{ borderRadius: '10px' }}>
                  <div className="small fw-extrabold text-primary mb-1"><i className="bi bi-shield-fill-exclamation me-1"></i> Group Rules & Guidelines:</div>
                  <div className="small text-secondary" style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{activeGroup.rules}</div>
                </div>
              )}
              
              <div className="mt-2 text-muted small fw-bold">
                <i className="bi bi-people-fill me-1"></i>{activeGroup.member_count} Members 
                <span className="mx-2">•</span> 
                <i className="bi bi-person me-1"></i>Created by {activeGroup.creator_name || activeGroup.creator_email}
              </div>
            </NeomorphicCard>
          )}

          {/* Group Chat component shown only when a group is active */}
          {activeGroup && <GroupChat group={activeGroup} />}

          {/* Feed Filter Tabs */}
          <div className="d-flex overflow-x-auto gap-2 mb-4 pb-2 border-bottom">
            {[
              { id: 'ALL', label: 'All Updates', icon: 'bi-grid-fill' },
              { id: 'TEXT', label: 'Pamphlets', icon: 'bi-file-text-fill' },
              { id: 'SOCIAL_MEDIA', label: 'SOCIAL MEDIA', icon: 'bi-collection-play-fill' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`neo-btn py-2 px-3 border-0 d-flex align-items-center gap-2 flex-shrink-0 ${activeTab === tab.id ? 'active' : ''}`}
                style={{ fontSize: '0.9rem' }}
              >
                <i className={`${tab.icon} ${tab.id === 'SOCIAL_MEDIA' ? 'text-danger' : ''}`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Posts Feed container */}
          {loadingPosts ? (
            <div className="text-center py-5 text-muted">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="fw-semibold">Retrieving public bulletin board...</h5>
            </div>
          ) : (
            <div className="d-flex flex-column gap-4">
              {posts.map((post) => {
                const isAuthor = user && (user.email === post.author_email || user.username === post.author_name);
                const showDeleteBtn = isAuthor || (user && user.role === 'ADMIN') || (user && user.is_staff);

                return (
                  <NeomorphicCard key={post.id} elevation="convex" className="p-4 overflow-hidden position-relative">
                    {/* Post Author info */}
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className="neo-badge p-2 bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', borderRadius: '50%' }}>
                          <span className="fw-bold">{post.author_name[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="fw-bold mb-0 text-primary">{post.author_name}</div>
                          <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                            {new Date(post.created_at).toLocaleString()}
                            {post.community_name && (
                              <span className="ms-2 badge bg-secondary-subtle text-secondary border">
                                <i className="bi bi-hash"></i>{post.community_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {showDeleteBtn && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="btn btn-sm text-danger neo-btn border-0 p-2 d-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                          title="Delete Post"
                        >
                          <i className="bi bi-trash-fill small"></i>
                        </button>
                      )}
                    </div>

                    {/* Post Body Caption */}
                    {post.caption && (
                      <p className="post-caption text-secondary mb-3" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {post.caption}
                      </p>
                    )}

                    {/* Conditional content render by type */}
                    
                    {/* Type 1: IMAGE */}
                    {post.post_type === 'IMAGE' && post.image && (
                      <div className="neo-inset p-2 mb-3 bg-light overflow-hidden" style={{ borderRadius: '12px' }}>
                        <img 
                          src={post.image} 
                          alt="Uploaded content" 
                          className="img-fluid w-100 rounded-3 shadow-sm"
                          style={{ maxHeight: '450px', objectFit: 'contain', backgroundColor: '#eaecef' }}
                        />
                      </div>
                    )}

                    {/* Type 2: YOUTUBE embed */}
                    {post.post_type === 'YOUTUBE' && post.youtube_id && (
                      <div className="neo-inset mb-3 overflow-hidden bg-black" style={{ borderRadius: '12px', aspectRatio: '16/9' }}>
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${post.youtube_id}`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="border-0 shadow-sm"
                        ></iframe>
                      </div>
                    )}

                    {/* Type 3: LINK preview */}
                    {post.post_type === 'LINK' && post.url && (
                      <a 
                        href={post.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-decoration-none d-block mb-3"
                      >
                        <div className="neo-flat p-3 d-flex flex-column flex-sm-row gap-3 hover-inset bg-light border-0 transition-all" style={{ borderRadius: '12px' }}>
                          {post.og_image_url && (
                            <div className="flex-shrink-0" style={{ width: '100%', maxWidth: '140px', height: '100px' }}>
                              <img 
                                src={post.og_image_url} 
                                alt={post.og_title}
                                className="w-100 h-100 rounded-2 shadow-sm" 
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                          )}
                          <div className="flex-grow-1 overflow-hidden d-flex flex-column justify-content-center">
                            <div className="text-muted small fw-bold mb-1 uppercase tracking-wider">
                              <i className="bi bi-globe me-1"></i>{post.og_domain || 'external link'}
                            </div>
                            <h6 className="fw-bold text-dark text-truncate mb-1">{post.og_title || post.url}</h6>
                            <p className="text-secondary small text-truncate-2 mb-0" style={{ fontSize: '0.8rem' }}>{post.og_description}</p>
                          </div>
                        </div>
                      </a>
                    )}

                    {/* Post Engagement Action bar */}
                    <div className="d-flex align-items-center justify-content-between mt-3 pt-3 border-top">
                      <div className="d-flex gap-2">
                        <button
                          onClick={() => handleLikePost(post)}
                          className={`neo-btn py-1 px-3 border-0 d-flex align-items-center gap-2 ${post.is_liked ? 'text-danger active' : 'text-muted'}`}
                          style={{ fontSize: '0.85rem' }}
                        >
                          <i className={`bi ${post.is_liked ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                          <span className="fw-bold">{post.like_count}</span>
                        </button>
                      </div>

                      {post.url && (
                        <a 
                          href={post.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="neo-btn py-1 px-3 border-0 text-primary d-flex align-items-center gap-1"
                          style={{ fontSize: '0.85rem' }}
                        >
                          <i className="bi bi-box-arrow-up-right"></i>
                          Visit Source
                        </a>
                      )}
                    </div>
                  </NeomorphicCard>
                );
              })}

              {posts.length === 0 && (
                <div className="text-center py-5 neo-convex p-4 text-muted">
                  <i className="bi bi-postcard-fill fs-1 text-muted mb-3 d-block"></i>
                  <h5 className="fw-bold">No announcements found</h5>
                  <p className="small mb-0">Be the first to post something in this category!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* SOCIAL MEDIA FAB */}
      {activeTab === 'SOCIAL_MEDIA' && isAuthenticated && user?.role !== 'CUSTOMER' && (
        <button
          onClick={() => {
            setPostGroupId(activeGroup ? activeGroup.id : '');
            setPostUrl('');
            setPreviewData(null);
            setShowSocialMediaModal(true);
          }}
          className="neo-btn-accent shadow-lg d-flex align-items-center justify-content-center"
          style={{
            position: 'fixed',
            bottom: '30px',
            left: '30px',
            width: '65px',
            height: '65px',
            borderRadius: '50%',
            zIndex: 1000,
            fontSize: '1.8rem'
          }}
          title="Share Social Media URL"
        >
          <i className="bi bi-plus-lg"></i>
        </button>
      )}

      {/* SOCIAL MEDIA DEDICATED MODAL */}
      {showSocialMediaModal && (
        <div className="d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1050, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
          <div className="modal-dialog w-100" style={{ maxWidth: '560px', margin: '20px', pointerEvents: 'auto' }}>
            <NeomorphicCard elevation="convex" className="p-4 bg-white border-0 animate-float-disabled">
              <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-2">
                <h5 className="modal-title fw-extrabold mb-0"><i className="bi bi-youtube me-2 text-danger"></i>Share Social Media Video</h5>
                <button onClick={() => setShowSocialMediaModal(false)} className="btn-close neo-btn p-2 border-0 shadow-none" aria-label="Close"></button>
              </div>

              <form onSubmit={handleCreatePostSubmit}>
                {/* Select Group */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">Post to Community (Optional)</label>
                  <select 
                    className="form-select neo-input w-100"
                    value={postGroupId}
                    onChange={(e) => setPostGroupId(e.target.value)}
                  >
                    <option value="">Public Bulletin Board (Global Feed)</option>
                    {groups?.filter(g => g.is_member).map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">Caption (Optional)</label>
                  <textarea 
                    className="form-control neo-input w-100" 
                    rows="2"
                    placeholder="Say something about this video..."
                    value={postCaption}
                    onChange={(e) => setPostCaption(e.target.value)}
                  ></textarea>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">Social Media URL (YouTube, FB, Insta)</label>
                  <input 
                    type="url"
                    className="form-control neo-input w-100 mb-2"
                    placeholder="https://..."
                    value={postUrl}
                    onChange={(e) => setPostUrl(e.target.value)}
                    required
                  />
                  {loadingPreview && (
                    <div className="neo-inset p-3 bg-light text-center rounded-3 mb-2">
                      <span className="spinner-border spinner-border-sm text-primary me-2" role="status"></span>
                      <span className="small text-muted">Loading preview...</span>
                    </div>
                  )}

                  {!loadingPreview && previewData && (
                    <div className="neo-inset p-2 bg-light rounded-3 d-flex gap-2 align-items-center mt-2">
                      {previewData.og_image_url && (
                        <img src={previewData.og_image_url} alt="Link thumbnail" className="rounded shadow-sm" style={{ width: '80px', height: '60px', objectFit: 'cover' }} />
                      )}
                      <div className="overflow-hidden flex-grow-1">
                        <div className="small fw-bold text-dark text-truncate">{previewData.og_title || 'Video Link'}</div>
                        <div className="small text-secondary text-truncate" style={{ fontSize: '0.75rem' }}>{previewData.og_description || 'No description available.'}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
                  <button type="button" onClick={() => setShowSocialMediaModal(false)} className="neo-btn bg-light text-muted">Cancel</button>
                  <button type="submit" disabled={submittingPost || (!postUrl && !previewData)} className="neo-btn-accent">
                    {submittingPost ? <><span className="spinner-border spinner-border-sm me-2"></span>Posting...</> : 'Share Video'}
                  </button>
                </div>
              </form>
            </NeomorphicCard>
          </div>
        </div>
      )}

      {/* CREATE POST MODAL */}
      {showCreateModal && (
        <div className="d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1050, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
          <div className="modal-dialog w-100" style={{ maxWidth: '560px', margin: '20px', pointerEvents: 'auto' }}>
            <NeomorphicCard elevation="convex" className="p-4 bg-white border-0 animate-float-disabled">
              <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-2">
                <h5 className="modal-title fw-extrabold mb-0"><i className="bi bi-megaphone-fill me-2 text-primary"></i>Share Community Pamphlet</h5>
                <button onClick={() => setShowCreateModal(false)} className="btn-close neo-btn p-2 border-0 shadow-none" aria-label="Close"></button>
              </div>

              <form onSubmit={handleCreatePostSubmit}>
                {/* Select Group */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">Post to Community (Optional)</label>
                  <select 
                    className="form-select neo-input w-100"
                    value={postGroupId}
                    onChange={(e) => setPostGroupId(e.target.value)}
                  >
                    <option value="">Public Bulletin Board (Global Feed)</option>
                    {groups.filter(g => g.is_member).map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <div className="form-text small text-muted">Select a group you joined to pin this post inside their board.</div>
                </div>

                {/* Caption Description */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">Caption / Content</label>
                  <textarea 
                    className="form-control neo-input w-100" 
                    rows="3"
                    placeholder="Write a message, advertise a pamphlet, announce an event..."
                    value={postCaption}
                    onChange={(e) => setPostCaption(e.target.value)}
                  ></textarea>
                </div>

                {/* Media Toggle options */}
                {user?.role !== 'CUSTOMER' ? (
                  <>
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="neo-btn w-100 text-center justify-content-center py-2 cursor-pointer border">
                          <i className="bi bi-image text-success"></i> Upload Image
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="d-none"
                          />
                        </label>
                      </div>
                      <div className="col-6">
                        <div className="neo-btn w-100 text-center justify-content-center py-2 cursor-pointer border" onClick={() => setPostUrl(postUrl || 'https://')}>
                          <i className="bi bi-link-45deg text-primary"></i> Link Previews
                        </div>
                      </div>
                    </div>

                    {/* Image Preview Box */}
                    {imagePreview && (
                      <div className="mb-3 position-relative neo-inset p-2 bg-light rounded-3 text-center">
                        <img src={imagePreview} alt="Upload preview" className="img-fluid rounded-2" style={{ maxHeight: '150px' }} />
                        <button 
                          type="button" 
                          onClick={() => { setPostImage(null); setImagePreview(null); }}
                          className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    )}

                    {/* Link Preview box */}
                    {(postUrl || loadingPreview || previewData) && (
                      <div className="mb-3">
                        <label className="form-label small fw-bold text-secondary">Web Link or Social Preview URL (YouTube, FB, Insta)</label>
                        <input 
                          type="url"
                          className="form-control neo-input w-100 mb-2"
                          placeholder="https://..."
                          value={postUrl}
                          onChange={(e) => setPostUrl(e.target.value)}
                        />
                        {loadingPreview && (
                          <div className="neo-inset p-3 bg-light text-center rounded-3 mb-2">
                            <span className="spinner-border spinner-border-sm text-primary me-2" role="status"></span>
                            <span className="small text-muted">Resolving rich link tags...</span>
                          </div>
                        )}

                        {!loadingPreview && previewData && (
                          <div className="neo-inset p-2 bg-light rounded-3 d-flex gap-2 align-items-center">
                            {previewData.og_image_url && (
                              <img src={previewData.og_image_url} alt="Link thumbnail" className="rounded shadow-sm" style={{ width: '60px', height: '50px', objectFit: 'cover' }} />
                            )}
                            <div className="overflow-hidden flex-grow-1">
                              <div className="small text-muted text-uppercase fw-extrabold" style={{ fontSize: '0.65rem' }}>
                                <i className="bi bi-globe me-1"></i>{previewData.og_domain || 'preview'}
                              </div>
                              <div className="small fw-bold text-dark text-truncate">{previewData.og_title || 'Linked content'}</div>
                              <div className="small text-secondary text-truncate" style={{ fontSize: '0.75rem' }}>{previewData.og_description || 'No description extracted.'}</div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => { setPostUrl(''); setPreviewData(null); }}
                              className="btn btn-sm text-danger border-0 p-1"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mb-3 text-muted small fst-italic border rounded p-2 bg-light">
                    <i className="bi bi-info-circle me-1"></i> Customer accounts cannot upload images or URLs. Upgrade to a business account to unlock these features.
                  </div>
                )}

                <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="neo-btn bg-light text-muted">Cancel</button>
                  <button type="submit" disabled={submittingPost} className="neo-btn-accent">
                    {submittingPost ? <><span className="spinner-border spinner-border-sm me-2"></span>Sharing...</> : 'Post Announcement'}
                  </button>
                </div>
              </form>
            </NeomorphicCard>
          </div>
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {showCreateGroupModal && (
        <div className="d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1050, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
          <div className="modal-dialog w-100" style={{ maxWidth: '480px', margin: '20px', pointerEvents: 'auto' }}>
            <NeomorphicCard elevation="convex" className="p-4 bg-white border-0">
              <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-2">
                <h5 className="modal-title fw-extrabold mb-0"><i className="bi bi-people-fill me-2 text-success"></i>Create Community Group</h5>
                <button onClick={() => setShowCreateGroupModal(false)} className="btn-close neo-btn p-2 border-0 shadow-none" aria-label="Close"></button>
              </div>

              <form onSubmit={handleCreateGroupSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">Group Name</label>
                  <input 
                    type="text" 
                    className="form-control neo-input w-100" 
                    placeholder="e.g. Downtown Neighbors, Tech Enthusiasts"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">Description</label>
                  <textarea 
                    className="form-control neo-input w-100" 
                    rows="3"
                    placeholder="Describe the purpose of your community group..."
                    value={groupDesc}
                    onChange={(e) => setGroupDesc(e.target.value)}
                  ></textarea>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">Category</label>
                  <select 
                    className="form-select neo-input w-100"
                    value={isCustomGroupCategory ? '__OTHERS__' : groupCategory}
                    onChange={(e) => {
                      if (e.target.value === '__OTHERS__') {
                        setIsCustomGroupCategory(true);
                        setGroupCategory('');
                      } else {
                        setIsCustomGroupCategory(false);
                        setGroupCategory(e.target.value);
                      }
                    }}
                  >
                    {GROUP_CATEGORIES.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                    <option value="__OTHERS__">OTHERS (Type Manually)</option>
                  </select>
                  {isCustomGroupCategory && (
                    <input
                      type="text"
                      className="form-control neo-input w-100 mt-2"
                      placeholder="Type category (auto UPPERCASE)"
                      value={groupCategory}
                      onChange={(e) => setGroupCategory(e.target.value.toUpperCase())}
                      autoFocus
                    />
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">Location (e.g. City, Neighborhood)</label>
                  <input 
                    type="text" 
                    className="form-control neo-input w-100" 
                    placeholder="e.g. Downtown, AP"
                    value={groupLocation}
                    onChange={(e) => setGroupLocation(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">Group Rules & Guidelines</label>
                  <textarea 
                    className="form-control neo-input w-100" 
                    rows="3"
                    placeholder="Rules for group members..."
                    value={groupRules}
                    onChange={(e) => setGroupRules(e.target.value)}
                  ></textarea>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
                  <button type="button" onClick={() => setShowCreateGroupModal(false)} className="neo-btn bg-light text-muted">Cancel</button>
                  <button type="submit" disabled={submittingGroup} className="neo-btn-accent">
                    {submittingGroup ? <><span className="spinner-border spinner-border-sm me-2"></span>Creating...</> : 'Create Group'}
                  </button>
                </div>
              </form>
            </NeomorphicCard>
          </div>
        </div>
      )}

      {/* VIEW MEMBERS MODAL */}
      {showMembersModal && (
        <div className="d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1050, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
          <div className="modal-dialog w-100" style={{ maxWidth: '440px', margin: '20px', pointerEvents: 'auto' }}>
            <NeomorphicCard elevation="convex" className="p-4 bg-white border-0">
              <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-2">
                <h5 className="modal-title fw-extrabold mb-0">
                  <i className="bi bi-people-fill me-2 text-primary"></i>
                  {membersGroup?.name} Members
                </h5>
                <button onClick={() => setShowMembersModal(false)} className="btn-close neo-btn p-2 border-0 shadow-none" aria-label="Close"></button>
              </div>

              {loadingMembers ? (
                <div className="text-center py-4 text-muted">
                  <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                  <div>Loading member details...</div>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {groupMembers.map((member, idx) => (
                    <div 
                      key={idx} 
                      className="neo-inset p-2 px-3 d-flex align-items-center justify-content-between bg-light"
                      style={{ borderRadius: '10px' }}
                    >
                      <div className="overflow-hidden">
                        <div className="fw-bold mb-0 text-primary text-truncate" style={{ fontSize: '0.9rem' }}>
                          {member.username || member.email.split('@')[0]}
                        </div>
                        <div className="text-muted small text-truncate" style={{ fontSize: '0.75rem' }}>{member.email}</div>
                      </div>
                      <span className={`badge ${member.role === 'ADMIN' ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary'} border`}>
                        {member.role}
                      </span>
                    </div>
                  ))}

                  {groupMembers.length === 0 && (
                    <div className="text-center py-4 text-muted small">No members found in this community.</div>
                  )}
                </div>
              )}

              <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
                <button type="button" onClick={() => setShowMembersModal(false)} className="neo-btn-accent px-4">Close</button>
              </div>
            </NeomorphicCard>
          </div>
        </div>
      )}
    </div>
  );
}
