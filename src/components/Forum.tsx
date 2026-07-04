import React, { useState, useEffect } from 'react';
import { 
  db, 
  auth, 
  handleFirestoreError, 
  OperationType,
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
} from '../lib/firebase';
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
  Save,
  Maximize2,
  FileImage,
  Loader2,
  Trash2,
  Eye,
  LayoutGrid
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
  postImage?: string;
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

const compressImage = (base64Url: string, maxWidth = 800, maxHeight = 600): Promise<{ compressed: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Url;
    img.onload = () => {
      const originalWidth = img.width;
      const originalHeight = img.height;
      
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve({
          compressed: canvas.toDataURL("image/jpeg", 0.7),
          width: originalWidth,
          height: originalHeight
        });
      } else {
        resolve({
          compressed: base64Url,
          width: originalWidth,
          height: originalHeight
        });
      }
    };
    img.onerror = (err) => reject(err);
  });
};

export const Forum: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('General');
  const [attachedImage, setAttachedImage] = useState('');
  const [imageMetadata, setImageMetadata] = useState<{ name: string; size: string; width?: number; height?: number } | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewZoomed, setIsPreviewZoomed] = useState(false);
  const [previewStyle, setPreviewStyle] = useState<'thumbnail' | 'card_header'>('thumbnail');
  const [activeCategory, setActiveCategory] = useState('All');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const handleImageFile = async (file: File) => {
    setIsProcessingImage(true);
    const sizeInKB = (file.size / 1024).toFixed(1);
    const sizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
      : `${sizeInKB} KB`;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const rawBase64 = ev.target?.result as string;
        const result = await compressImage(rawBase64);
        setAttachedImage(result.compressed);
        setImageMetadata({
          name: file.name,
          size: sizeFormatted,
          width: result.width,
          height: result.height
        });
      } catch (err) {
        console.error("Image loading/compression failed:", err);
      } finally {
        setIsProcessingImage(false);
      }
    };
    reader.onerror = () => {
      setIsProcessingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Subscribe to posts from hybrid_sandbox
  useEffect(() => {
    const q = query(collection(db, 'hybrid_sandbox'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData: Post[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.collection === "posts" || doc.id.startsWith("posts_") || doc.id.startsWith("post_") || (data.title && data.content && data.category)) {
          let payload: any = {};
          if (data.db_json) {
            try { payload = JSON.parse(data.db_json); } catch (e) {}
          } else if (data.payload_json) {
            try { payload = JSON.parse(data.payload_json); } catch (e) {}
          } else {
            payload = data;
          }
          postsData.push({ id: doc.id, ...payload } as Post);
        }
      });
      // Sort by createdAt desc
      const getTimestamp = (val: any) => {
        if (!val) return 0;
        if (typeof val.toDate === 'function') return val.toDate().getTime();
        if (val.seconds) return val.seconds * 1000;
        const d = new Date(val).getTime();
        return isNaN(d) ? 0 : d;
      };
      postsData.sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt));
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to comments when a post is selected from hybrid_sandbox
  useEffect(() => {
    if (!selectedPost) {
      setComments([]);
      return;
    }

    const q = query(collection(db, 'hybrid_sandbox'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData: Comment[] = [];
      const targetColName = `posts/${selectedPost.id}/comments`;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.collection === targetColName) {
          let payload: any = {};
          if (data.db_json) {
            try { payload = JSON.parse(data.db_json); } catch (e) {}
          } else if (data.payload_json) {
            try { payload = JSON.parse(data.payload_json); } catch (e) {}
          } else {
            payload = data;
          }
          commentsData.push({ id: doc.id, ...payload } as Comment);
        }
      });

      const getTimestamp = (val: any) => {
        if (!val) return 0;
        if (typeof val.toDate === 'function') return val.toDate().getTime();
        if (val.seconds) return val.seconds * 1000;
        const d = new Date(val).getTime();
        return isNaN(d) ? 0 : d;
      };
      commentsData.sort((a, b) => getTimestamp(a.createdAt) - getTimestamp(b.createdAt));
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
      const payload = {
        title: newPostTitle,
        content: newPostContent,
        category: newPostCategory,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || auth.currentUser.email || 'Anonymous',
        authorPhotoURL: auth.currentUser.photoURL,
        postImage: attachedImage || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'hybrid_sandbox'), {
        collection: 'posts',
        db_json: JSON.stringify(payload),
        payload_json: JSON.stringify(payload),
        createdAt: new Date().toISOString()
      });

      // Broadcast notification
      notificationService.broadcast({
        title: 'New Feed Post',
        message: `${auth.currentUser.displayName || 'A team member'} posted a new feed update: "${newPostTitle}"`,
        type: NotificationType.FORUM,
        link: 'forum'
      });

      setIsCreatingPost(false);
      setNewPostTitle('');
      setNewPostContent('');
      setAttachedImage('');
      setImageMetadata(null);
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
      const payload = {
        content: newComment,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || auth.currentUser.email || 'Anonymous',
        authorPhotoURL: auth.currentUser.photoURL,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'hybrid_sandbox'), {
        collection: path,
        db_json: JSON.stringify(payload),
        payload_json: JSON.stringify(payload),
        createdAt: new Date().toISOString()
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
              className="flex items-center gap-2 text-slate-400 hover:text-gold transition-colors text-[9px] md:text-[10px] font-display uppercase tracking-widest font-black px-2 cursor-pointer"
            >
              <ArrowLeft size={16} /> Back to News Feed
            </button>

            <div className="luxury-card p-6 md:p-10 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 md:px-3 md:py-1 bg-luxury-cream text-gold text-[8px] md:text-[9px] font-display uppercase tracking-widest font-bold">
                    {selectedPost.category || 'General'}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 italic font-serif">
                    <Clock size={12} /> {selectedPost.createdAt ? (selectedPost.createdAt.toDate ? formatDistanceToNow(selectedPost.createdAt.toDate()) + ' ago' : new Date(selectedPost.createdAt).toLocaleDateString()) : 'Just now'}
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
                  
                  {selectedPost.postImage && (
                    <div className="my-5 border border-slate-100 p-1.5 bg-slate-50 shadow-sm max-w-xl">
                      <img src={selectedPost.postImage} alt={selectedPost.title} className="w-full object-contain max-h-[380px]" />
                    </div>
                  )}

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
                    <UserIcon size={16} />
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
                        {comment.createdAt ? (comment.createdAt.toDate ? formatDistanceToNow(comment.createdAt.toDate()) + ' ago' : new Date(comment.createdAt).toLocaleDateString()) : 'Just now'}
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
            <div className="flex justify-between items-center mb-6 md:mb-10 animate-fade-in">
              <div>
                <h2 className="text-2xl md:text-3xl font-serif text-slate-900 italic">Publish News Feed Update</h2>
                <p className="text-[10px] uppercase font-display tracking-widest text-[#C5A03D] mt-1 font-bold">Post announcements, alerts & photos to property members</p>
              </div>
              <button 
                onClick={() => setIsCreatingPost(false)}
                className="text-stone-400 hover:text-red-500 p-2 cursor-pointer transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreatePost} className="space-y-4 md:space-y-6">
              <div>
                <label className="luxury-label mb-1.5 md:mb-2 block">Category / Operational Sector</label>
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
                <label className="luxury-label mb-1.5 md:mb-2 block">Caption Title</label>
                <input 
                  type="text" 
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="Summarize the core update post topic..."
                  className="w-full bg-slate-50 border-none px-4 py-3 text-base md:text-lg font-serif italic focus:ring-1 focus:ring-gold/50"
                  required
                />
              </div>
              <div>
                <label className="luxury-label mb-1.5 md:mb-2 block">Caption Description / Announcement Content</label>
                <textarea 
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={6}
                  placeholder="Enter details, procedures, comments, or news guidelines here..."
                  className="w-full bg-slate-50 border-none px-4 py-3 text-sm font-serif italic focus:ring-1 focus:ring-gold/50 resize-none"
                  required
                />
              </div>

              {/* DYNAMIC IMAGE ATTACHMENT WITH LIGHT COMPRESSION */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 border-r-2 border-gold/40 p-2">
                  <label className="luxury-label block">Attach News Photo / Graphic (Optional)</label>
                  {attachedImage && (
                    <div className="flex items-center gap-1 bg-white border border-slate-100 p-0.5">
                      <button
                        type="button"
                        onClick={() => setPreviewStyle('thumbnail')}
                        className={cn(
                          "px-2.5 py-1 text-[8px] font-display uppercase tracking-wider font-extrabold transition-all cursor-pointer",
                          previewStyle === 'thumbnail' ? "bg-luxury-black text-white" : "text-stone-400 hover:text-stone-900"
                        )}
                      >
                        Thumbnail
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewStyle('card_header')}
                        className={cn(
                          "px-2.5 py-1 text-[8px] font-display uppercase tracking-wider font-extrabold transition-all cursor-pointer",
                          previewStyle === 'card_header' ? "bg-luxury-black text-white" : "text-stone-400 hover:text-stone-900"
                        )}
                      >
                        Simulated Banner
                      </button>
                    </div>
                  )}
                </div>

                {isProcessingImage ? (
                  <div className="h-44 border border-dashed border-gold/40 bg-[#C5A03D]/5 flex flex-col items-center justify-center space-y-3.5">
                    <Loader2 className="animate-spin text-gold" size={28} />
                    <div className="text-center">
                      <p className="text-xs font-serif italic text-gold font-medium">Processing high-fidelity graphic...</p>
                      <p className="text-[9px] text-stone-400 mt-1 font-display uppercase tracking-widest font-black">Applying real-time lightweight compression</p>
                    </div>
                  </div>
                ) : attachedImage ? (
                  <div className="space-y-3">
                    <div className="relative group border border-slate-100 bg-slate-50 p-3 overflow-hidden shadow-sm transition-all hover:shadow-md">
                      {previewStyle === 'thumbnail' ? (
                        /* Compact Thumbnail Mode */
                        <div className="flex gap-4 items-center">
                          <div className="relative w-24 h-24 bg-stone-950 flex items-center justify-center overflow-hidden border border-stone-200 shrink-0">
                            <img 
                              src={attachedImage} 
                              alt="Attached Thumbnail" 
                              className="w-full h-full object-cover" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => setIsPreviewZoomed(true)}
                                className="p-1.5 bg-white text-stone-900 shadow hover:scale-110 transition-transform cursor-pointer"
                                title="Zoom Preview"
                              >
                                <Maximize2 size={14} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex-1 space-y-1 min-w-0 pr-10">
                            <div className="flex items-center gap-1.5 text-stone-850 font-serif italic text-xs truncate">
                              <FileImage size={14} className="text-[#C5A03D] shrink-0" />
                              <span className="truncate font-medium">{imageMetadata?.name || 'Attached news graphic'}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 items-center text-[9px] font-display uppercase tracking-wider font-extrabold">
                              <span className="text-stone-450">{imageMetadata?.size || 'N/A'}</span>
                              <span className="text-stone-300">•</span>
                              {imageMetadata?.width && imageMetadata?.height && (
                                <span className="text-[#C5A03D]">
                                  {imageMetadata.width} × {imageMetadata.height} PX
                                </span>
                              )}
                              <span className="text-stone-300">•</span>
                              <span className="bg-[#C5A03D]/10 text-[#C5A03D] px-1.5 py-0.5 font-bold">Optimized Graphic</span>
                            </div>
                            <p className="text-[10px] text-stone-400 font-serif leading-relaxed mt-1">This format is fully responsive and will display perfectly across employee mobile dashboards.</p>
                          </div>
                        </div>
                      ) : (
                        /* Simulated Post Banner Mode */
                        <div className="space-y-2">
                          <p className="text-[10px] font-display uppercase tracking-widest text-[#C5A03D] font-extrabold mb-1">Interactive Banner Layout Preview</p>
                          <div className="relative w-full h-44 bg-stone-950 border border-stone-250 flex items-center justify-center overflow-hidden">
                            <img 
                              src={attachedImage} 
                              alt="Banner Layout" 
                              className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-102" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end p-4">
                              <div className="w-full">
                                <span className="px-2 py-0.5 bg-gold text-white text-[8px] font-display uppercase tracking-widest font-extrabold">
                                  {newPostCategory}
                                </span>
                                <h4 className="text-white font-serif italic text-base mt-1.5 leading-tight truncate">
                                  {newPostTitle || "Your Post Caption Title"}
                                </h4>
                              </div>
                            </div>
                            
                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-stone-300 px-2 py-1 text-[8px] font-display uppercase tracking-wider font-extrabold">
                              {imageMetadata?.width ? `${imageMetadata.width} × ${imageMetadata.height}` : 'Aspect-fit Banner'}
                            </div>

                            <button
                              type="button"
                              onClick={() => setIsPreviewZoomed(true)}
                              className="absolute top-3 left-14 p-1.5 bg-white text-stone-900 shadow hover:scale-110 transition-transform cursor-pointer"
                              title="Zoom Preview"
                            >
                              <Maximize2 size={13} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Unified Quick Delete Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setAttachedImage('');
                          setImageMetadata(null);
                        }}
                        className="absolute top-3 right-3 bg-red-650 hover:bg-red-750 text-white p-1.5 shadow-md flex items-center justify-center cursor-pointer transition-colors"
                        title="Delete Attachment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Interactive Drag-and-Drop Area */
                  <div 
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        const file = e.dataTransfer.files[0];
                        if (file.type.startsWith('image/')) {
                          await handleImageFile(file);
                        }
                      }
                    }}
                    className={cn(
                      "border-2 border-dashed p-6 font-serif italic text-stone-500 text-center cursor-pointer transition-all relative",
                      isDragging 
                        ? "border-[#C5A03D] bg-gold/5 scale-[1.01]" 
                        : "border-stone-200 bg-slate-50 hover:border-[#C5A03D]"
                    )}
                  >
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          await handleImageFile(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="space-y-2.5 py-1 flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-450 group-hover:text-gold transition-colors">
                        <FileImage size={18} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs text-stone-650 font-bold tracking-wide">
                          {isDragging ? "Drop graphic files here now!" : "Click to select or drop your image design here"}
                        </p>
                        <p className="text-[10px] text-stone-400 font-normal">Supports JPEG, WebP or PNG designs up to 10MB</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 md:pt-6">
                <button 
                  type="submit"
                  className="w-full bg-luxury-black text-white py-4 text-[11px] font-display uppercase tracking-[0.3em] font-black hover:bg-[#C5A03D] hover:text-stone-950 transition-all shadow-xl cursor-pointer"
                >
                  Publish News Feed Post
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
                    <MessageSquare size={24} strokeWidth={1} />
                 </div>
                 <div>
                    <h2 className="text-2xl md:text-3xl font-serif text-slate-900 italic leading-tight">Corporate News Feed</h2>
                    <p className="luxury-label opacity-60">Property Announcements & Team Feed</p>
                 </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 w-full sm:w-64">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search announcements & feed..."
                    className="w-full bg-white border border-slate-100 pl-10 pr-4 py-2.5 md:py-2 text-xs font-serif italic focus:ring-1 focus:ring-gold/20 shadow-sm"
                  />
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                </div>
                {auth.currentUser && (
                  <button 
                    onClick={() => setIsCreatingPost(true)}
                    className="w-full sm:w-auto bg-gold hover:bg-luxury-black text-white px-6 py-2.5 md:py-2 text-[10px] font-display uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/10 shrink-0 cursor-pointer"
                  >
                    Post Update <Plus size={16} />
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
                          <Clock size={12} strokeWidth={1.5} /> {post.createdAt ? (post.createdAt.toDate ? formatDistanceToNow(post.createdAt.toDate()) + ' ago' : new Date(post.createdAt).toLocaleDateString()) : 'Just now'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gold md:opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[9px] font-display uppercase tracking-widest font-black hidden sm:inline">View</span>
                         <ChevronRight size={14} />
                      </div>
                    </div>
                    <h3 className="text-xl md:text-2xl font-serif italic text-slate-900 mb-3 md:mb-4 group-hover:text-gold transition-colors leading-tight">{post.title}</h3>
                    
                    {post.postImage && (
                      <div className="mb-4 border border-slate-100 p-1 bg-slate-50 overflow-hidden max-w-md shadow-inner">
                        <img src={post.postImage} alt={post.title} className="w-full object-cover max-h-40" />
                      </div>
                    )}

                    <p className="text-slate-500 font-serif italic text-xs md:text-sm line-clamp-3 leading-relaxed mb-4 md:mb-6">
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

      {/* IN-APP LIGHTBOX ZOOM MODAL OVERLAY FOR NEWS PHOTOS */}
      <AnimatePresence>
        {isPreviewZoomed && attachedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/95 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-4 md:p-10 no-print"
            onClick={() => setIsPreviewZoomed(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative max-w-4xl max-h-[85vh] bg-stone-900 border border-stone-850 p-2.5 shadow-2xl flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsPreviewZoomed(false)}
                className="absolute -top-12 right-0 flex items-center gap-2 text-white bg-luxury-black border border-stone-800 px-4 py-2 hover:bg-[#C5A03D] hover:text-stone-950 text-xs font-display uppercase tracking-widest font-black transition-all cursor-pointer"
              >
                Close Preview <X size={14} />
              </button>
              
              <div className="overflow-auto max-h-[72vh] flex items-center justify-center bg-stone-950">
                <img 
                  src={attachedImage} 
                  alt="Full-size Preview" 
                  className="max-w-full max-h-[68vh] object-contain mx-auto shadow-inner"
                />
              </div>

              {imageMetadata && (
                <div className="w-full text-center mt-3 pt-3 border-t border-stone-800 text-[10px] uppercase font-display tracking-widest text-stone-400 flex flex-wrap justify-center gap-x-4 gap-y-1">
                  <span className="text-white font-bold">{imageMetadata.name}</span>
                  <span className="text-stone-600">|</span>
                  <span className="text-gold font-bold">{imageMetadata.size}</span>
                  {imageMetadata.width && imageMetadata.height && (
                    <>
                      <span className="text-stone-600">|</span>
                      <span>{imageMetadata.width} × {imageMetadata.height} PX Resolution</span>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
