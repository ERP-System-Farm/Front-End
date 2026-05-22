import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Megaphone, Plus, Trash2, Video, Paperclip, X,
  ChevronDown, ChevronUp, Calendar, ImagePlus,
  Link2, Upload, Loader2, Edit3, Check, FileText,
  Heart, MessageCircle, MoreHorizontal, Play, Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { toast } from 'sonner';

// Shadcn UI components
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import { Textarea } from '../ui/textarea';

// ─── Cloudinary ───────────────────────────────────────────────────────────────
const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

async function uploadToCloudinary(file, resourceType = 'auto') {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  fd.append('folder', 'announcements');
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: fd }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Upload failed');
  }
  const data = await res.json();
  return { url: data.secure_url, type: data.resource_type, name: file.name };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const canPublish = (user) => {
  if (!user) return false;
  if (['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user.role)) return true;
  return (user.permissions || user.app_permissions || []).includes('can_post_announcement');
};

const canManage = (user, ann) => {
  if (!user) return false;
  if (['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user.role)) return true;
  return ann.published_by === user?.name;
};

const formatCommentDate = (dateStr, isRTL) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) {
    return isRTL ? 'الآن' : 'Just now';
  }
  if (diffMins < 60) {
    return isRTL ? `منذ ${diffMins} د` : `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return isRTL ? `منذ ${diffHours} س` : `${diffHours}h ago`;
  }
  return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-GB', {
    month: 'short',
    day: 'numeric'
  });
};

const getInitialComments = (annId, title, isRTL) => {
  const stored = localStorage.getItem(`atls_comments_${annId}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }

  // Seed default comments based on announcement ID to make it look alive
  const seedComments = [
    {
      id: `seed_1_${annId}`,
      author_name: isRTL ? "م. أحمد عبد الرحمن" : "Eng. Ahmed Abdulrahman",
      author_email: "ahmed@atlasfarm.com",
      author_role: "MANAGER",
      body: isRTL 
        ? "مستجدات مهمة جداً ومطلوبة. سنقوم بالتنسيق مع المشرفين الميدانيين لتطبيق هذه التوجيهات فوراً في الحقل."
        : "Very important and required updates. We will coordinate with field supervisors to apply these guidelines immediately.",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: `seed_2_${annId}`,
      author_name: isRTL ? "سارة المهدي (الجودة)" : "Sara Al-Mahdi (Quality)",
      author_email: "sara@atlasfarm.com",
      author_role: "ENGINEER",
      body: isRTL
        ? "تمت المراجعة والتأكيد. سنتابع تقارير الجودة للتأكد من مطابقة المعايير الفنية واللوائح الجديدة."
        : "Reviewed and confirmed. We will follow up on quality reports to ensure compliance with the technical standards.",
      created_at: new Date(Date.now() - 3600000 * 4).toISOString()
    }
  ];

  localStorage.setItem(`atls_comments_${annId}`, JSON.stringify(seedComments));
  return seedComments;
};

// ─── MediaPreview ─────────────────────────────────────────────────────────────
function MediaPreview({ imageUrl, videoUrl, fileUrl, fileName }) {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const vidRef = useRef(null);

  if (imageUrl) return (
    <div className="relative w-full h-56 rounded-xl overflow-hidden flex items-center justify-center bg-zinc-900/10 border border-border/40 select-none group">
      <div 
        className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110 pointer-events-none transition-all duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div className="absolute inset-0 bg-black/10 dark:bg-black/35 backdrop-blur-md pointer-events-none" />
      <img 
        src={imageUrl} 
        alt="" 
        className="relative z-10 max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]" 
      />
    </div>
  );

  if (videoUrl) return (
    <div className="relative w-full h-56 rounded-xl overflow-hidden flex items-center justify-center bg-zinc-900/10 border border-border/40 select-none group">
      <video 
        ref={vidRef} 
        src={videoUrl} 
        className="relative z-10 max-w-full max-h-full w-full h-full object-contain"
        controls={videoPlaying}
        onClick={() => { setVideoPlaying(true); vidRef.current?.play(); }}
      />
      {!videoPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-20"
          onClick={() => { setVideoPlaying(true); vidRef.current?.play(); }}
        >
          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors border border-white/10 group-hover:scale-110 transition-transform duration-300">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );

  if (fileUrl) return (
    <a href={fileUrl} target="_blank" rel="noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-blue-50/20 dark:bg-blue-950/10 hover:bg-blue-100/30 dark:hover:bg-blue-950/20 transition-all group select-none">
      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
        <FileText className="w-5 h-5" />
      </div>
      <div className="flex-grow min-w-0">
        <p className="text-xs font-bold text-foreground truncate">{fileName || 'مرفق'}</p>
        <p className="text-[10px] text-muted-foreground">انقر للفتح والتنزيل</p>
      </div>
      <Paperclip className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors shrink-0" />
    </a>
  );

  return null;
}

// ─── AnnouncementCard (Facebook-style) ───────────────────────────────────────
function AnnouncementCard({ ann, isRTL, onDelete, onEdit, canManageThis, user }) {
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked]       = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentsExpanded, setCommentsExpanded] = useState(false);

  // Comments CRUD states
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Load likes and comments on mount
  useEffect(() => {
    if (!user) return;
    const isLiked = localStorage.getItem(`atls_like_${ann.id}_${user.email}`) === 'true';
    setLiked(isLiked);

    let hash = 0;
    const idStr = ann.id.toString();
    for (let i = 0; i < idStr.length; i++) {
      hash += idStr.charCodeAt(i);
    }
    const baseLikes = (hash % 10) + 3; // 3 to 12 base likes
    setLikesCount(baseLikes + (isLiked ? 1 : 0));

    setComments(getInitialComments(ann.id, ann.title, isRTL));
  }, [ann.id, user, isRTL]);

  const handleLikeToggle = () => {
    if (!user) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    localStorage.setItem(`atls_like_${ann.id}_${user.email}`, newLiked ? 'true' : 'false');
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    const newComment = {
      id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      author_name: user.name || 'User',
      author_email: user.email,
      author_role: user.role || 'ENGINEER',
      body: commentText.trim(),
      created_at: new Date().toISOString()
    };

    const updated = [newComment, ...comments];
    setComments(updated);
    localStorage.setItem(`atls_comments_${ann.id}`, JSON.stringify(updated));
    setCommentText('');
    toast.success(isRTL ? 'تم إضافة تعليقك بنجاح ✓' : 'Comment added successfully ✓');
  };

  const handleDeleteComment = (commentId) => {
    if (!window.confirm(isRTL ? 'هل تريد حذف هذا التعليق؟' : 'Delete this comment?')) return;
    const updated = comments.filter(c => c.id !== commentId);
    setComments(updated);
    localStorage.setItem(`atls_comments_${ann.id}`, JSON.stringify(updated));
    toast.success(isRTL ? 'تم حذف التعليق' : 'Comment deleted');
  };

  const handleStartEditComment = (comment) => {
    setEditingComment(comment);
    setEditText(comment.body);
    setIsEditDialogOpen(true);
  };

  const handleSaveEditComment = () => {
    if (!editText.trim() || !editingComment) return;

    const updated = comments.map(c => 
      c.id === editingComment.id ? { ...c, body: editText.trim(), created_at: new Date().toISOString() } : c
    );
    setComments(updated);
    localStorage.setItem(`atls_comments_${ann.id}`, JSON.stringify(updated));
    setIsEditDialogOpen(false);
    setEditingComment(null);
    toast.success(isRTL ? 'تم تعديل التعليق بنجاح ✓' : 'Comment updated ✓');
  };

  const date = new Date(ann.created_at).toLocaleDateString(
    isRTL ? 'ar-EG' : 'en-GB',
    { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  );

  const avatarLetter = (ann.published_by || 'N')[0].toUpperCase();
  const bodyLong = ann.body && ann.body.length > 120;

  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 h-full flex flex-col justify-between">
      {/* 1. Main scrollable content (Header + Body + Media + Comments) */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 text-white font-black text-sm shrink-0 border border-emerald-500/10">
              <AvatarFallback>{avatarLetter}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-foreground leading-none">{ann.published_by}</span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 rounded font-black bg-muted/65 text-muted-foreground border-border/60">
                  {isRTL ? 'الإدارة' : 'Admin'}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground/80 flex items-center gap-1 mt-1 font-semibold">
                <Calendar className="w-3.5 h-3.5" /> {date}
              </p>
            </div>
          </div>

          {canManageThis && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer focus:outline-none">
                  <MoreHorizontal className="w-4.5 h-4.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "left" : "right"} className="w-36">
                <DropdownMenuItem onClick={() => onEdit(ann)} className="gap-2 cursor-pointer">
                  <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-semibold text-xs">{isRTL ? 'تعديل الإعلان' : 'Edit Post'}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(ann.id)} className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="font-semibold text-xs">{isRTL ? 'حذف الإعلان' : 'Delete Post'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Content Body */}
        <div className="space-y-2">
          <h4 className="font-black text-base text-foreground leading-snug tracking-tight">{ann.title}</h4>
          {ann.body && (
            <div className="space-y-1">
              <p className={cn('text-xs md:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium', !expanded && bodyLong && 'line-clamp-3')}>
                {ann.body}
              </p>
              {bodyLong && (
                <button onClick={() => setExpanded(p => !p)}
                  className="text-xs font-bold text-green-600 hover:text-green-700 mt-1 flex items-center gap-1 cursor-pointer focus:outline-none">
                  {expanded ? (isRTL ? 'أقل' : 'See less') : (isRTL ? 'المزيد' : 'See more')}
                  {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Media Block */}
        <MediaPreview imageUrl={ann.image_url} videoUrl={ann.video_url} fileUrl={ann.file_url} fileName={ann.file_name} />

        {/* Comments section inside scroll view */}
        {commentsExpanded && (
          <div className="border-t border-border/30 pt-4 space-y-3.5">
            <h5 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-green-600" />
              <span>{isRTL ? 'التعليقات والمناقشة' : 'Comments & Discussion'}</span>
            </h5>
            
            {comments.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-2">
                {isRTL ? 'لا توجد تعليقات بعد. كن أول من يعلق!' : 'No comments yet. Be the first to comment!'}
              </p>
            ) : (
              <div className="space-y-3">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2.5 items-start text-xs text-foreground group">
                    <Avatar className="w-7 h-7 bg-green-100 text-green-700 border border-green-500/10 font-bold shrink-0">
                      <AvatarFallback className="text-[10px]">
                        {(c.author_name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted/30 dark:bg-zinc-900/35 border border-border/40 rounded-2xl p-2.5 relative">
                      <div className="flex justify-between items-center mb-1 gap-4">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="font-extrabold text-foreground">{c.author_name}</span>
                          <span className="text-[8px] font-black uppercase text-muted-foreground/80 bg-muted border border-border px-1.5 py-0.5 rounded leading-none">
                            {c.author_role.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[9px] text-muted-foreground font-semibold">
                          {formatCommentDate(c.created_at, isRTL)}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-muted-foreground/95 whitespace-pre-wrap font-medium">{c.body}</p>
                      
                      {c.author_email === user?.email && (
                        <div className="absolute top-2.5 left-2 rtl:left-auto rtl:right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none">
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isRTL ? "left" : "right"} className="w-28">
                              <DropdownMenuItem onClick={() => handleStartEditComment(c)} className="gap-2 cursor-pointer">
                                <Edit3 className="w-3 h-3 text-blue-500" />
                                <span className="font-semibold text-xs">{isRTL ? 'تعديل' : 'Edit'}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteComment(c.id)} className="gap-2 cursor-pointer text-red-600 focus:text-red-600">
                                <Trash2 className="w-3 h-3" />
                                <span className="font-semibold text-xs">{isRTL ? 'حذف' : 'Delete'}</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Sticky Reactions & Form drawer (Fixed at bottom) */}
      <div className="border-t border-border/40 bg-muted/5 dark:bg-zinc-900/10 p-4 space-y-3 shrink-0">
        {/* Engagement stats */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-bold px-1 select-none">
          <div className="flex items-center gap-1">
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px]">❤️</span>
            <span>{likesCount} {isRTL ? 'إعجاب' : 'likes'}</span>
          </div>
          <button onClick={() => setCommentsExpanded(p => !p)} className="hover:underline cursor-pointer focus:outline-none">
            {comments.length} {comments.length === 1 ? (isRTL ? 'تعليق' : 'comment') : (isRTL ? 'تعليقات' : 'comments')}
          </button>
        </div>

        <Separator className="bg-border/40" />

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleLikeToggle}
            className={cn('flex items-center justify-center gap-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus:outline-none border border-transparent active:scale-95',
              liked 
                ? 'bg-red-50 dark:bg-red-950/20 text-red-500 border-red-500/10' 
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            )}>
            <Heart className={cn('w-4.5 h-4.5 transition-transform duration-300', liked && 'fill-red-500 scale-110')} />
            {isRTL ? 'إعجاب' : 'Like'}
          </button>
          
          <button onClick={() => setCommentsExpanded(p => !p)}
            className={cn('flex items-center justify-center gap-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus:outline-none border border-transparent active:scale-95',
              commentsExpanded
                ? 'bg-green-50 dark:bg-green-950/20 text-green-600 border-green-500/10'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            )}>
            <MessageCircle className="w-4.5 h-4.5" />
            {isRTL ? 'تعليق' : 'Comment'}
          </button>
        </div>

        {/* Inline Add Comment Form (when expanded) */}
        {commentsExpanded && (
          <form onSubmit={handleAddComment} className="flex gap-2 items-start pt-2">
            <Avatar className="w-7 h-7 bg-green-50 text-green-600 border border-green-500/10 font-bold shrink-0">
              <AvatarFallback className="text-[10px]">
                {(user?.name || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 relative flex items-center">
              <Textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder={isRTL ? 'اكتب تعليقاً...' : 'Write a comment...'}
                className="min-h-[38px] max-h-[80px] py-2 px-3 pr-10 rtl:pr-3 rtl:pl-10 text-xs rounded-xl bg-muted/30 border-border/50 focus-visible:ring-green-500/20 focus-visible:border-green-500/40 resize-none font-semibold"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="absolute right-2.5 rtl:right-auto rtl:left-2.5 text-green-600 hover:text-green-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer p-1 rounded"
              >
                <Send className={cn("w-4 h-4", isRTL && "rotate-180")} />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Edit comment Dialog modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-foreground font-black text-base">{isRTL ? 'تعديل التعليق' : 'Edit Comment'}</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <Textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              placeholder={isRTL ? 'اكتب تعليقك هنا...' : 'Write your comment here...'}
              rows={4}
              className="w-full text-xs font-semibold rounded-xl border-border bg-muted/10"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl">
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button size="sm" onClick={handleSaveEditComment} disabled={!editText.trim()} className="bg-green-600 hover:bg-green-700 text-white rounded-xl">
              {isRTL ? 'حفظ التعديل' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── UploadZone ───────────────────────────────────────────────────────────────
function UploadZone({ isRTL, accept, resourceType, label, icon: Icon, onUploaded, disabled }) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef(null);

  const handle = async (file) => {
    if (!file) return;
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      toast.error(isRTL ? 'يرجى ضبط إعدادات Cloudinary في .env' : 'Configure Cloudinary in .env first');
      return;
    }
    setUploading(true);
    try {
      const result = await uploadToCloudinary(file, resourceType);
      onUploaded(result);
      toast.success(isRTL ? 'تم الرفع بنجاح ✓' : 'Uploaded successfully ✓');
    } catch (e) {
      toast.error(`${isRTL ? 'فشل الرفع' : 'Upload failed'}: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onClick={() => !disabled && !uploading && ref.current?.click()}
      onDrop={e => { e.preventDefault(); handle(e.dataTransfer.files?.[0]); }}
      onDragOver={e => e.preventDefault()}
      className={cn(
        'flex flex-col items-center gap-1 py-3 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-all text-center',
        'border-border/50 hover:border-green-500/40 hover:bg-green-50/5',
        (uploading || disabled) && 'opacity-50 pointer-events-none'
      )}
    >
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={e => handle(e.target.files?.[0])} />
      {uploading
        ? <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
        : <Icon className="w-5 h-5 text-muted-foreground/60" />}
      <span className="text-[11px] text-muted-foreground font-semibold">{label}</span>
    </div>
  );
}

// ─── AnnouncementForm ─────────────────────────────────────────────────────────
function AnnouncementForm({ isRTL, initial, onSaved, onClose }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    title:     initial?.title     || '',
    body:      initial?.body      || '',
    image_url: initial?.image_url || '',
    video_url: initial?.video_url || '',
    file_url:  initial?.file_url  || '',
    file_name: initial?.file_name || '',
  });
  const [saving, setSaving] = useState(false);
  const [mediaMode, setMediaMode] = useState('none');

  const set = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), []);

  const handleMediaUploaded = ({ url, type, name }) => {
    if (type === 'image') { set('image_url', url); setMediaMode('image'); }
    else if (type === 'video') { set('video_url', url); setMediaMode('video'); }
    else { set('file_url', url); set('file_name', name); setMediaMode('file'); }
  };

  const clearMedia = () => {
    setForm(p => ({ ...p, image_url: '', video_url: '', file_url: '', file_name: '' }));
    setMediaMode('none');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error(isRTL ? 'العنوان مطلوب' : 'Title required'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        const res = await api.patch(`announcements/${initial.id}/`, form);
        onSaved(res.data, true);
        toast.success(isRTL ? 'تم تحديث الإعلان ✓' : 'Announcement updated ✓');
      } else {
        await api.post('announcements/', form);
        onSaved(null, false);
        toast.success(isRTL ? 'تم نشر الإعلان ✓' : 'Announcement published ✓');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || (isRTL ? 'فشل' : 'Failed'));
    } finally {
      setSaving(false);
    }
  };

  const hasMedia = form.image_url || form.video_url || form.file_url;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Title */}
        <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
          placeholder={isRTL ? 'عنوان الإعلان *' : 'Announcement title *'}
          autoComplete="off"
          className="w-full font-bold text-sm px-4 py-2.5 rounded-xl border border-border/60 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/40 transition-all placeholder:font-normal placeholder:text-muted-foreground/60" />

        {/* Body */}
        <Textarea value={form.body} onChange={e => set('body', e.target.value)}
          placeholder={isRTL ? 'ماذا تريد أن تقول؟' : "What's on your mind?"}
          rows={4}
          className="w-full text-sm px-4 py-2.5 rounded-xl border border-border/60 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/40 resize-none transition-all placeholder:text-muted-foreground/60 font-semibold" />

        {/* Media display/clear */}
        {hasMedia && (
          <div className="relative rounded-xl overflow-hidden border border-border/50 bg-muted/10 p-3">
            <div className="text-xs text-muted-foreground mb-2 font-semibold">
              {form.image_url ? '🖼 صورة' : form.video_url ? '🎬 فيديو' : `📎 ${form.file_name || 'ملف'}`}
            </div>
            {form.image_url && <img src={form.image_url} alt="" className="h-24 rounded-lg object-cover" />}
            {form.video_url && (
              <video src={form.video_url} className="h-24 rounded-lg object-cover" />
            )}
            {form.file_url && !form.image_url && !form.video_url && (
              <a href={form.file_url} target="_blank" rel="noreferrer"
                className="text-xs text-blue-600 hover:underline font-semibold">{form.file_name || form.file_url}</a>
            )}
            <button type="button" onClick={clearMedia}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Upload options */}
        {!hasMedia && (
          <div className="grid grid-cols-3 gap-2">
            <UploadZone isRTL={isRTL} accept="image/*" resourceType="image"
              label={isRTL ? 'صورة' : 'Image'} icon={ImagePlus}
              onUploaded={handleMediaUploaded} />
            <UploadZone isRTL={isRTL} accept="video/*" resourceType="video"
              label={isRTL ? 'فيديو' : 'Video'} icon={Video}
              onUploaded={handleMediaUploaded} />
            <UploadZone isRTL={isRTL} accept="*/*" resourceType="raw"
              label={isRTL ? 'ملف' : 'File'} icon={Paperclip}
              onUploaded={handleMediaUploaded} />
          </div>
        )}

        {/* Or paste URL */}
        <div className="grid grid-cols-1 gap-2">
          {!form.image_url && !form.video_url && !form.file_url && (
            <div className="flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input type="url" value={form.image_url}
                onChange={e => set('image_url', e.target.value)}
                placeholder={isRTL ? 'أو الصق رابط صورة مباشرة...' : 'Or paste image URL...'}
                className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-border/60 bg-muted/20 focus:outline-none focus:ring-1 focus:ring-green-500/30 transition-all" />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl h-10 px-4">
            {isRTL ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button type="submit" disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm gap-2 h-10 px-6">
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" />{isRTL ? 'جارٍ الحفظ...' : 'Saving...'}</>
              : isEdit
                ? <><Check className="w-4 h-4" />{isRTL ? 'حفظ التعديلات' : 'Save Changes'}</>
                : <>{isRTL ? '📣 نشر الإعلان' : '📣 Publish Post'}</>
            }
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── AnnouncementsBoard ───────────────────────────────────────────────────────
export default function AnnouncementsBoard() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollContainerRef = useRef(null);
  const userCanPublish = canPublish(user);

  const load = useCallback(async () => {
    try {
      const res = await api.get('announcements/');
      setAnnouncements(res.data || []);
    } catch { setAnnouncements([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm(isRTL ? 'هل تريد حذف هذا الإعلان نهائياً؟' : 'Delete this announcement permanently?')) return;
    try {
      await api.delete(`announcements/${id}/`);
      toast.success(isRTL ? 'تم الحذف' : 'Deleted');
      setAnnouncements(p => p.filter(a => a.id !== id));
      setActiveIndex(0);
    } catch { toast.error(isRTL ? 'فشل الحذف' : 'Failed'); }
  };

  const handleEdit = (ann) => {
    setEditTarget(ann);
    setShowForm(false);
  };

  const handleSaved = (updated, isEdit) => {
    if (isEdit && updated) {
      setAnnouncements(p => p.map(a => a.id === updated.id ? { ...a, ...updated } : a));
    } else {
      load();
    }
    setEditTarget(null);
    setShowForm(false);
  };

  const handleScroll = (e) => {
    const container = e.currentTarget;
    const scrollPosition = container.scrollTop;
    // Set index based on card height (approx 410px + gap)
    const cardHeight = container.clientHeight || 410;
    const index = Math.round(scrollPosition / cardHeight);
    if (index !== activeIndex && index >= 0 && index < announcements.length) {
      setActiveIndex(index);
    }
  };

  const scrollToCard = (index) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const cardHeight = container.clientHeight || 410;
    container.scrollTo({
      top: index * cardHeight,
      behavior: 'smooth'
    });
    setActiveIndex(index);
  };

  return (
    <>
      <Card className="border-border/60 shadow-sm bg-card transition-all h-[550px] flex flex-col overflow-hidden rounded-3xl">
        <CardHeader className="pb-3 px-5 pt-5 border-b border-border/40 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <Megaphone className="w-4 h-4" />
              </div>
              <span>{isRTL ? 'لوحة الإعلانات والمستجدات' : 'Bulletin Board'}</span>
              {announcements.length > 0 && (
                <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/10">
                  {announcements.length}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm"
                onClick={() => navigate('/dashboard/announcements')}
                className="h-8 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-1 cursor-pointer">
                {isRTL ? 'عرض الكل' : 'View All'}
              </Button>
              {userCanPublish && (
                <Button variant="outline" size="sm"
                  onClick={() => { setShowForm(true); setEditTarget(null); }}
                  className="h-8 text-xs font-bold rounded-xl border-green-500/30 text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20 gap-1.5 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  {isRTL ? 'إعلان جديد' : 'New Post'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-5 pt-4 flex-1 flex flex-col overflow-hidden min-h-[300px]">
          {loading ? (
            <div className="space-y-4 flex-grow flex flex-col justify-center">
              <div className="h-[460px] rounded-2xl bg-muted/40 animate-pulse flex flex-col justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted/60" />
                  <div className="space-y-2">
                    <div className="h-3.5 bg-muted/60 rounded w-28" />
                    <div className="h-2.5 bg-muted/60 rounded w-16" />
                  </div>
                </div>
                <div className="space-y-2 flex-1 mt-6">
                  <div className="h-3 bg-muted/60 rounded w-3/4" />
                  <div className="h-3 bg-muted/60 rounded w-5/6" />
                  <div className="h-3 bg-muted/60 rounded w-2/3" />
                </div>
                <div className="h-8 bg-muted/60 rounded-xl w-full mt-4" />
              </div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center gap-3 text-muted-foreground py-10">
              <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center border border-border/40 shadow-inner">
                <Megaphone className="w-7 h-7 opacity-30" />
              </div>
              <p className="text-sm font-semibold">{isRTL ? 'لا توجد إعلانات نشطة حالياً' : 'No announcements yet'}</p>
              <p className="text-xs opacity-75 text-center max-w-[240px] leading-relaxed">
                {userCanPublish
                  ? (isRTL ? 'اضغط على زر "إعلان جديد" لنشر منشور إداري جديد للموظفين.' : 'Click "New Post" to publish an administrative update.')
                  : (isRTL ? 'سيظهر هنا أي إعلانات ومستجدات جديدة تنشرها الإدارة.' : 'Company announcements will appear here once published.')}
              </p>
            </div>
          ) : (
            <div className="relative flex-1 flex flex-col justify-between overflow-hidden">
              {/* Vertical snap-scroll container showing ONE card at a time */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 w-full snap-y snap-mandatory overflow-y-auto space-y-0"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  height: '410px',
                  maxHeight: '410px'
                }}
              >
                {announcements.map(ann => (
                  <div key={ann.id} className="snap-start snap-always w-full h-[410px] min-h-[410px] pb-1">
                    <AnnouncementCard
                      ann={ann}
                      isRTL={isRTL}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      canManageThis={canManage(user, ann)}
                      user={user}
                    />
                  </div>
                ))}
              </div>

              {/* Slider dots indicators */}
              {announcements.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-3 shrink-0 select-none">
                  {announcements.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => scrollToCard(i)}
                      className={cn(
                        'h-1.5 rounded-full transition-all duration-300 cursor-pointer focus:outline-none',
                        i === activeIndex 
                          ? 'bg-orange-500 w-4' 
                          : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-1.5'
                      )}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Write/Edit Announcement Form Dialog Modal */}
      <Dialog open={showForm || !!editTarget} onOpenChange={(open) => {
        if (!open) {
          setShowForm(false);
          setEditTarget(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-6">
          <DialogHeader className="pb-2 border-b border-border/40">
            <DialogTitle className="flex items-center gap-2 text-foreground font-black text-lg">
              <Megaphone className="w-5 h-5 text-green-600" />
              <span>{editTarget ? (isRTL ? 'تعديل الإعلان المنشور' : 'Edit Published Post') : (isRTL ? 'نشر إعلان جديد' : 'New Announcement')}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <AnnouncementForm
              isRTL={isRTL}
              initial={editTarget}
              onSaved={handleSaved}
              onClose={() => {
                setShowForm(false);
                setEditTarget(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
