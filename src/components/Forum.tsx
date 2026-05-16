import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  serverTimestamp, 
  doc, 
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { notificationService, NotificationType } from '../services/notificationService';
import { 
  MessageSquare, 
  Send, 
  User as UserIcon, 
  Plus, 
  ChevronRight, 
  Clock,
  ArrowLeft,
  X,
  Search,
  Edit2,
  Save
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  createdAt: any;
  updatedAt?: any;
  category: string;
}

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  createdAt: any;
}

const CATEGORIES = ["General", "Maintenance", "Housekeeping", "Front Office", "Security", "F&B", "Brand Standard"];

export const Forum: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('General');
  const [activeCategory, setActiveCategory] = useState('All');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Subscribe to posts
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to comments when a post is selected
  useEffect(() => {
    if (!selectedPost) {
      setComments([]);
      return;
    }

    const q = query(
      collection(db, `posts/${selectedPost.id}/comments`), 
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(commentsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `posts/${selectedPost.id}/comments`);
    });

    return () => unsubscribe();
  }, [selectedPost]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    try {
      await addDoc(collection(db, 'posts'), {
        title: newPostTitle,
        content: newPostContent,
        category: newPostCategory,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || auth.currentUser.email || 'Anonymous',
        authorPhotoURL: auth.currentUser.photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Broadcast notification
      notificationService.broadcast({
        title: 'New Forum Discussion',
        message: `${auth.currentUser.displayName || 'A team member'} started a new discussion: "${newPostTitle}"`,
        type: NotificationType.FORUM,
        link: 'forum'
      });

      setIsCreatingPost(false);
      setNewPostTitle('');
      setNewPostContent('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'posts');
    }
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !selectedPost) return;
    if (!editTitle.trim() || !editContent.trim()) return;

    try {
      const postRef = doc(db, 'posts', selectedPost.id);
      await updateDoc(postRef, {
        title: editTitle,
        content: editContent,
        category: editCategory,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setSelectedPost({
        ...selectedPost,
        title: editTitle,
        content: editContent,
        category: editCategory
      });

      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${selectedPost.id}`);
    }
  };

  const startEditing = () => {
    if (!selectedPost) return;
    setEditTitle(selectedPost.title);
    setEditContent(selectedPost.content);
    setEditCategory(selectedPost.category || 'General');
    setIsEditing(true);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !selectedPost) return;
    if (!newComment.trim()) return;

    const path = `posts/${selectedPost.id}/comments`;
    try {
      await addDoc(collection(db, path), {
        content: newComment,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || auth.currentUser.email || 'Anonymous',
        authorPhotoURL: auth.currentUser.photoURL,
        createdAt: serverTimestamp()
      });

      // Notify post author
      if (selectedPost.authorId !== auth.currentUser.uid) {
        notificationService.notifyUser(selectedPost.authorId, {
          title: 'New Reply on Your Post',
          message: `${auth.currentUser.displayName || 'Someone'} replied to your post: "${selectedPost.title}"`,
          type: NotificationType.FORUM,
          link: 'forum'
        });
      }

      setNewComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent animate-spin rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8">
      <AnimatePresence mode="wait">
        {selectedPost ? (
          <motion.div
            key="post-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 md:space-y-8"
          >
            <button 
              onClick={() => setSelectedPost(null)}
              className="flex items-center gap-2 text-slate-400 hover:text-gold transition-colors text-[9px] md:text-[10px] font-display uppercase tracking-widest font-black px-2"
            >
              <ArrowLeft size={14} md:size={16} /> Back to Forum
            </button>

            <div className="luxury-card p-6 md:p-10 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 md:px-3 md:py-1 bg-luxury-cream text-gold text-[8px] md:text-[9px] font-display uppercase tracking-widest font-bold">
                    {selectedPost.category || 'General'}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 italic font-serif">
                    <Clock size={10} md:size={12} /> {selectedPost.createdAt ? formatDistanceToNow(selectedPost.createdAt.toDate()) + ' ago' : 'Just now'}
                    {selectedPost.updatedAt && selectedPost.updatedAt.toMillis() !== selectedPost.createdAt.toMillis() && (
                      <span className="text-gold opacity-60 ml-2">(Edited)</span>
                    )}
                  </span>
                </div>
                {auth.currentUser?.uid === selectedPost.authorId && !isEditing && (
                  <button 
                    onClick={startEditing}
                    className="flex items-center gap-2 text-slate-400 hover:text-gold transition-all text-[9px] font-display uppercase tracking-widest group"
                  >
                    <Edit2 size={12} className="group-hover:scale-110 transition-transform" /> Edit Post
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdatePost} className="space-y-4 md:space-y-6">
                  <div>
                    <label className="luxury-label mb-1.5 md:mb-2 block">Category</label>
                    <select 
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-slate-50 border-none px-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="luxury-label mb-1.5 md:mb-2 block">Title</label>
                    <input 
                      type="text" 
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="The topic of discussion..."
                      className="w-full bg-slate-50 border-none px-4 py-3 text-base md:text-lg font-serif italic focus:ring-1 focus:ring-gold/50"
                    />
                  </div>
                  <div>
                    <label className="luxury-label mb-1.5 md:mb-2 block">Content</label>
                    <textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={6}
                      placeholder="Share your thoughts or ask a question..."
                      className="w-full bg-slate-50 border-none px-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50 resize-none"
                    />
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button 
                      type="submit"
                      className="flex-1 bg-luxury-black text-white py-3 text-[10px] font-display uppercase tracking-widest font-black hover:bg-gold transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      Save Changes <Save size={14} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 border border-slate-100 text-slate-400 text-[10px] font-display uppercase tracking-widest hover:bg-slate-50 transition-all font-black"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="text-xl md:text-3xl font-serif text-slate-900 mb-4 md:mb-6 italic leading-snug">{selectedPost.title}</h2>
                  <p className="text-slate-600 font-serif italic leading-relaxed mb-6 md:mb-8 text-base md:text-lg whitespace-pre-wrap">
                    {selectedPost.content}
                  </p>
                </>
              )}
              
              <div className="flex items-center gap-3 pt-4 md:pt-6 border-t border-slate-50">
                {selectedPost.authorPhotoURL ? (
                  <img src={selectedPost.authorPhotoURL} alt={selectedPost.authorName} className="w-8 h-8 rounded-full shadow-sm" />
                ) : (
                  <div className="w-8 h-8 bg-slate-100 flex items-center justify-center rounded-full text-slate-400">
                    <UserIcon size={14} md:size={16} />
                  </div>
                )}
                <div>
                  <p className="text-xs font-serif italic text-slate-900">{selectedPost.authorName}</p>
                  <p className="text-[8px] md:text-[9px] font-display uppercase tracking-widest text-slate-400">Original Poster</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 md:space-y-6">
              <h3 className="text-lg md:text-xl font-serif italic text-slate-900 px-4">Replies ({comments.length})</h3>
              <div className="space-y-4 px-2 md:px-0">
                {comments.map((comment) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={comment.id} 
                    className="luxury-card p-5 md:p-6 bg-slate-50/50 border-none ml-4 md:ml-8"
                  >
                    <p className="text-slate-600 font-serif italic mb-4 leading-relaxed text-sm md:text-base">{comment.content}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {comment.authorPhotoURL ? (
                          <img src={comment.authorPhotoURL} alt={comment.authorName} className="w-6 h-6 rounded-full shadow-sm" />
                        ) : (
                          <div className="w-6 h-6 bg-white flex items-center justify-center rounded-full text-slate-300">
                            <UserIcon size={12} />
                          </div>
                        )}
                        <span className="text-[11px] font-serif italic text-slate-900">{comment.authorName}</span>
                      </div>
                      <span className="text-[9px] md:text-[10px] text-slate-400 font-serif italic">
                        {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate()) + ' ago' : 'Just now'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {auth.currentUser ? (
                <div className="luxury-card p-4 md:p-6 bg-white border-t-2 border-gold shadow-xl mx-2 md:mx-0">
                  <form onSubmit={handleAddComment}>
                    <textarea 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add your reply..."
                      className="w-full bg-slate-50 border-none p-3 md:p-4 text-sm font-serif italic focus:ring-1 focus:ring-gold/50 resize-none mb-4"
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <button 
                        type="submit"
                        className="w-full sm:w-auto bg-luxury-black text-white px-8 py-3 text-[10px] font-display uppercase tracking-widest font-black hover:bg-gold transition-all flex items-center justify-center gap-2"
                      >
                        Post Reply <Send size={14} />
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="text-center p-8 bg-luxury-cream/20 italic font-serif text-slate-400 text-sm mx-2 md:mx-0">
                  Please log in to participate in the conversation.
                </div>
              )}
            </div>
          </motion.div>
        ) : isCreatingPost ? (
          <motion.div
            key="create-post"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="luxury-card p-6 md:p-12 bg-white"
          >
            <div className="flex justify-between items-center mb-6 md:mb-10">
              <h2 className="text-2xl md:text-3xl font-serif text-slate-900 italic">New Discussion</h2>
              <button 
                onClick={() => setIsCreatingPost(false)}
                className="text-slate-400 hover:text-red-500 p-2"
              >
                <X size={20} md:size={24} />
              </button>
            </div>
            <form onSubmit={handleCreatePost} className="space-y-4 md:space-y-6">
              <div>
                <label className="luxury-label mb-1.5 md:mb-2 block">Category</label>
                <select 
                  value={newPostCategory}
                  onChange={(e) => setNewPostCategory(e.target.value)}
                  className="w-full bg-slate-50 border-none px-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="luxury-label mb-1.5 md:mb-2 block">Title</label>
                <input 
                  type="text" 
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="The topic of discussion..."
                  className="w-full bg-slate-50 border-none px-4 py-3 text-base md:text-lg font-serif italic focus:ring-1 focus:ring-gold/50"
                />
              </div>
              <div>
                <label className="luxury-label mb-1.5 md:mb-2 block">Content</label>
                <textarea 
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={6}
                  md:rows={8}
                  placeholder="Share your thoughts or ask a question..."
                  className="w-full bg-slate-50 border-none px-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50 resize-none"
                />
              </div>
              <div className="pt-4 md:pt-6">
                <button 
                  type="submit"
                  className="w-full bg-luxury-black text-white py-4 text-[11px] font-display uppercase tracking-[0.3em] font-black hover:bg-gold transition-all shadow-xl"
                >
                  Publish Discussion
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="post-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 md:space-y-10 px-2 md:px-0"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print mb-10">
              <div className="flex items-center gap-3 md:gap-4">
                 <div className="w-10 h-10 md:w-12 md:h-12 bg-luxury-black text-gold flex items-center justify-center shadow-lg">
                    <MessageSquare size={20} md:size={24} strokeWidth={1} />
                 </div>
                 <div>
                    <h2 className="text-2xl md:text-3xl font-serif text-slate-900 italic leading-tight">Conversations</h2>
                    <p className="luxury-label opacity-60">Property Knowledge Hub</p>
                 </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 w-full sm:w-64">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search discussions..."
                    className="w-full bg-white border border-slate-100 pl-10 pr-4 py-2.5 md:py-2 text-xs font-serif italic focus:ring-1 focus:ring-gold/20 shadow-sm"
                  />
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                </div>
                {auth.currentUser && (
                  <button 
                    onClick={() => setIsCreatingPost(true)}
                    className="w-full sm:w-auto bg-gold text-white px-6 py-2.5 md:py-2 text-[10px] font-display uppercase tracking-widest font-black hover:bg-luxury-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/10 shrink-0"
                  >
                    New Topic <Plus size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar -mx-2 px-2">
              {['All', ...CATEGORIES].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-4 py-1.5 text-[9px] font-display uppercase tracking-widest font-black whitespace-nowrap transition-all border shrink-0",
                    activeCategory === cat 
                      ? "bg-luxury-black text-white border-luxury-black shadow-md" 
                      : "bg-white text-slate-400 border-slate-100 hover:border-gold/30 hover:text-gold"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:gap-6">
              {filteredPosts.length === 0 ? (
                <div className="luxury-card p-12 md:p-20 text-center bg-white border-dashed">
                  <p className="text-slate-400 font-serif italic text-lg md:text-xl">No discussions found in this category.</p>
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <motion.div 
                    layoutId={post.id}
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="luxury-card p-6 md:p-8 bg-white group cursor-pointer hover:border-gold transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start mb-3 md:mb-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-luxury-cream px-2 py-0.5 md:px-3 md:py-1 text-gold text-[7px] md:text-[8px] font-display uppercase tracking-[0.2em] font-bold">
                          {post.category}
                        </span>
                        <span className="text-[10px] text-slate-400 italic font-serif flex items-center gap-1">
                          <Clock size={10} md:size={12} strokeWidth={1.5} /> {post.createdAt ? formatDistanceToNow(post.createdAt.toDate()) + ' ago' : 'Just now'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gold md:opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[9px] font-display uppercase tracking-widest font-black hidden sm:inline">View</span>
                         <ChevronRight size={14} />
                      </div>
                    </div>
                    <h3 className="text-xl md:text-2xl font-serif italic text-slate-900 mb-3 md:mb-4 group-hover:text-gold transition-colors leading-tight">{post.title}</h3>
                    <p className="text-slate-500 font-serif italic text-xs md:text-sm line-clamp-2 leading-relaxed mb-4 md:mb-6">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                      {post.authorPhotoURL ? (
                        <img src={post.authorPhotoURL} alt={post.authorName} className="w-6 h-6 rounded-full shadow-sm" />
                      ) : (
                        <div className="w-6 h-6 bg-slate-50 flex items-center justify-center rounded-full text-slate-300">
                          <UserIcon size={12} />
                        </div>
                      )}
                      <span className="text-xs font-serif italic text-slate-600">{post.authorName}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
