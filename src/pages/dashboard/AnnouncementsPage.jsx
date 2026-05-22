import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Megaphone, Plus, Trash2, Video, Paperclip, X,
  ChevronDown, ChevronUp, Calendar, ImagePlus,
  Link2, Upload, Loader2, Edit3, Check, FileText,
  Heart, MessageCircle, MoreHorizontal, Play, Send,
  Pin, Archive, Filter, Search, ArrowRight, ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Separator } from '../../components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '../../components/ui/dropdown-menu';
import { Textarea } from '../../components/ui/textarea';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import DocumentViewerModal from '../../components/dashboard/DocumentViewerModal';

// ─── Constants & Helpers ───────────────────────────────────────────────────────
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
  
  if (diffMins < 1) return isRTL ? 'الآن' : 'Just now';
  if (diffMins < 60) return isRTL ? `منذ ${diffMins} د` : `${diffMins}m ago`;
  if (diffHours < 24) return isRTL ? `منذ ${diffHours} س` : `${diffHours}h ago`;
  return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-GB', { month: 'short', day: 'numeric' });
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

  const seedComments = [
    {
      id: `seed_1_${annId}`,
      author_name: isRTL ? "م. أحمد عبد الرحمن" : "Eng. Ahmed Abdulrahman",
      author_email: "ahmed@atlasfarm.com",
      author_role: "MANAGER",
      body: isRTL 
        ? "مستجدات مهمة جداً ومطلوبة. سنقوم بالتنسيق مع المشرفين الميدانيين لتطبيق هذه التوجيهات فوراً في الحقل."
        : "Very important and required updates. We will coordinate with field guidelines immediately.",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: `seed_2_${annId}`,
      author_name: isRTL ? "سارة المهدي (الجودة)" : "Sara Al-Mahdi (Quality)",
      author_email: "sara@atlasfarm.com",
      author_role: "ENGINEER",
      body: isRTL
        ? "تمت المراجعة والتأكيد. سنتابع تقارير الجودة للتأكد من مطابقة المعايير الفنية واللوائح الجديدة."
        : "Reviewed and confirmed. We will follow up on quality reports to ensure compliance.",
      created_at: new Date(Date.now() - 3600000 * 4).toISOString()
    }
  ];

  localStorage.setItem(`atls_comments_${annId}`, JSON.stringify(seedComments));
  return seedComments;
};

// ─── UploadZone Component ─────────────────────────────────────────────────────
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
        'flex flex-col items-center gap-1.5 py-4 px-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all text-center bg-muted/10',
        'border-border/60 hover:border-green-500/40 hover:bg-green-50/5',
        (uploading || disabled) && 'opacity-50 pointer-events-none'
      )}
    >
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={e => handle(e.target.files?.[0])} />
      {uploading
        ? <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
        : <Icon className="w-5.5 h-5.5 text-muted-foreground/60" />}
      <span className="text-xs text-muted-foreground font-semibold">{label}</span>
    </div>
  );
}

// ─── AnnouncementForm Component ───────────────────────────────────────────────
function AnnouncementForm({ isRTL, initial, onSaved, onClose }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    title:     initial?.title     || '',
    body:      initial?.body      || '',
    image_url: initial?.image_url || '',
    video_url: initial?.video_url || '',
    file_url:  initial?.file_url  || '',
    file_name: initial?.file_name || '',
    category:  initial?.category  || 'general',
    is_pinned: initial?.is_pinned || false
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
        const res = await api.post('announcements/', form);
        onSaved(res.data, false);
        toast.success(isRTL ? 'تم نشر الإعلان ✓' : 'Announcement published ✓');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || (isRTL ? 'فشل الحفظ' : 'Saving failed'));
    } finally {
      setSaving(false);
    }
  };

  const hasMedia = form.image_url || form.video_url || form.file_url;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
        placeholder={isRTL ? 'عنوان الإعلان *' : 'Announcement title *'}
        autoComplete="off"
        className="w-full font-bold text-sm px-4 py-3 rounded-2xl border border-border/60 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/40 transition-all" />

      {/* Category Selection */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-black text-muted-foreground/80 block mb-1 uppercase tracking-wider">{isRTL ? 'التصنيف' : 'Category'}</label>
          <select value={form.category} onChange={e => set('category', e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-green-500/20">
            <option value="general">{isRTL ? 'عام' : 'General'}</option>
            <option value="management">{isRTL ? 'إدارة' : 'Management'}</option>
            <option value="operations">{isRTL ? 'عمليات ميدانية' : 'Operations'}</option>
            <option value="urgent">{isRTL ? 'عاجل وهام' : 'Urgent'}</option>
          </select>
        </div>
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer select-none py-2 px-1">
            <input type="checkbox" checked={form.is_pinned} onChange={e => set('is_pinned', e.target.checked)}
              className="w-4 h-4 text-green-600 border-border bg-muted/30 focus:ring-0 focus:ring-offset-0 rounded" />
            <span>{isRTL ? 'تثبيت المنشور بالأعلى' : 'Pin Announcement'}</span>
          </label>
        </div>
      </div>

      {/* Body Text */}
      <Textarea value={form.body} onChange={e => set('body', e.target.value)}
        placeholder={isRTL ? 'تفاصيل الإعلان أو المنشور...' : 'Write details here...'}
        rows={5}
        className="w-full text-sm px-4 py-3 rounded-2xl border border-border/60 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/40 resize-none transition-all font-semibold" />

      {/* Media display/clear */}
      {hasMedia && (
        <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-muted/20 p-4">
          <div className="text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">
            {form.image_url ? '🖼 صورة مرفقة' : form.video_url ? '🎬 فيديو مرفق' : `📎 ${form.file_name || 'ملف مرفق'}`}
          </div>
          {form.image_url && <img src={form.image_url} alt="" className="h-28 w-auto rounded-xl object-cover" />}
          {form.video_url && <video src={form.video_url} className="h-28 w-auto rounded-xl object-cover" />}
          {form.file_url && !form.image_url && !form.video_url && (
            <div className="text-xs font-bold text-green-600 truncate">{form.file_name || form.file_url}</div>
          )}
          <button type="button" onClick={clearMedia}
            className="absolute top-3 left-3 rtl:left-auto rtl:right-3 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload options */}
      {!hasMedia && (
        <div className="grid grid-cols-3 gap-2">
          <UploadZone isRTL={isRTL} accept="image/*" resourceType="image" label={isRTL ? 'صورة' : 'Image'} icon={ImagePlus} onUploaded={handleMediaUploaded} />
          <UploadZone isRTL={isRTL} accept="video/*" resourceType="video" label={isRTL ? 'فيديو' : 'Video'} icon={Video} onUploaded={handleMediaUploaded} />
          <UploadZone isRTL={isRTL} accept="*/*" resourceType="raw" label={isRTL ? 'ملف' : 'File'} icon={Paperclip} onUploaded={handleMediaUploaded} />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
        <Button type="button" variant="outline" onClick={onClose} className="rounded-2xl h-11 px-5 text-xs font-bold">
          {isRTL ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700 text-white rounded-2xl h-11 px-6 font-bold text-xs gap-2">
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" />{isRTL ? 'جارٍ الحفظ...' : 'Saving...'}</>
            : isEdit
              ? <><Check className="w-4 h-4" />{isRTL ? 'حفظ التغييرات' : 'Save Changes'}</>
              : <>{isRTL ? '📣 نشر الإعلان الآن' : '📣 Publish Announcement'}</>
          }
        </Button>
      </div>
    </form>
  );
}

// ─── Full AnnouncementCard Component ─────────────────────────────────────────
function MainAnnouncementCard({ ann, isRTL, onDelete, onEdit, onPin, onArchive, canManageThis, user, onPreviewFile }) {
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked]       = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentsExpanded, setCommentsExpanded] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const isLiked = localStorage.getItem(`atls_like_${ann.id}_${user.email}`) === 'true';
    setLiked(isLiked);

    let hash = 0;
    const idStr = ann.id.toString();
    for (let i = 0; i < idStr.length; i++) hash += idStr.charCodeAt(i);
    const baseLikes = (hash % 10) + 3; 
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
  };

  const handleDeleteComment = (commentId) => {
    if (!window.confirm(isRTL ? 'هل تريد حذف هذا التعليق؟' : 'Delete this comment?')) return;
    const updated = comments.filter(c => c.id !== commentId);
    setComments(updated);
    localStorage.setItem(`atls_comments_${ann.id}`, JSON.stringify(updated));
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
  };

  const date = new Date(ann.created_at).toLocaleDateString(
    isRTL ? 'ar-EG' : 'en-GB',
    { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  );

  const avatarLetter = (ann.published_by || 'N')[0].toUpperCase();
  const bodyLong = ann.body && ann.body.length > 250;

  const categoryBadgeColors = {
    urgent: 'bg-red-500/10 text-red-600 dark:bg-red-950/20 border-red-500/20',
    management: 'bg-purple-500/10 text-purple-600 dark:bg-purple-950/20 border-purple-500/20',
    operations: 'bg-blue-500/10 text-blue-600 dark:bg-blue-950/20 border-blue-500/20',
    general: 'bg-zinc-500/10 text-zinc-600 dark:bg-zinc-950/20 border-zinc-500/20'
  };

  const categoryNames = {
    urgent: isRTL ? 'عاجل وهام' : 'Urgent',
    management: isRTL ? 'إدارة' : 'Management',
    operations: isRTL ? 'عمليات' : 'Operations',
    general: isRTL ? 'عام' : 'General'
  };

  return (
    <div className={cn(
      "bg-card border rounded-3xl shadow-xs overflow-hidden transition-all duration-300 relative",
      ann.is_pinned ? "border-orange-500/30 bg-orange-500/[0.01]" : "border-border/50 hover:border-border"
    )}>
      
      {/* Pinned Flag ribbon */}
      {ann.is_pinned && (
        <div className="absolute top-0 right-6 bg-orange-500 text-white text-[10px] px-2.5 py-1 rounded-b-lg font-black flex items-center gap-1 shadow-sm">
          <Pin className="w-3 h-3 fill-white" />
          <span>{isRTL ? 'مثبت' : 'PINNED'}</span>
        </div>
      )}

      {/* Card Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 text-white font-black text-base border border-emerald-500/10">
              <AvatarFallback>{avatarLetter}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-foreground">{ann.published_by}</span>
                <Badge className={cn("text-[9px] font-black rounded-lg px-2 border", categoryBadgeColors[ann.category] || categoryBadgeColors.general)}>
                  {categoryNames[ann.category] || categoryNames.general}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground/85 flex items-center gap-1 mt-1 font-semibold">
                <Calendar className="w-3.5 h-3.5" /> {date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {canManageThis && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-2xl hover:bg-muted text-muted-foreground transition-colors cursor-pointer focus:outline-none">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? "left" : "right"} className="w-44">
                  <DropdownMenuItem onClick={() => onEdit(ann)} className="gap-2 cursor-pointer">
                    <Edit3 className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-xs">{isRTL ? 'تعديل الإعلان' : 'Edit Post'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPin(ann.id, !ann.is_pinned)} className="gap-2 cursor-pointer">
                    <Pin className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold text-xs">{ann.is_pinned ? (isRTL ? 'إلغاء التثبيت' : 'Unpin Post') : (isRTL ? 'تثبيت الإعلان' : 'Pin Post')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onArchive(ann.id, !ann.is_archived)} className="gap-2 cursor-pointer">
                    <Archive className="w-4 h-4 text-purple-500" />
                    <span className="font-semibold text-xs">{ann.is_archived ? (isRTL ? 'استعادة من الأرشيف' : 'Unarchive') : (isRTL ? 'أرشفة الإعلان' : 'Archive Post')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(ann.id)} className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
                    <Trash2 className="w-4 h-4" />
                    <span className="font-semibold text-xs">{isRTL ? 'حذف الإعلان' : 'Delete Post'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Post Title & Body */}
        <div className="mt-4 space-y-2">
          <h4 className="font-black text-lg text-foreground tracking-tight leading-snug">{ann.title}</h4>
          {ann.body && (
            <div className="space-y-1">
              <p className={cn(
                'text-xs md:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium',
                !expanded && bodyLong && 'line-clamp-4'
              )}>
                {ann.body}
              </p>
              {bodyLong && (
                <button onClick={() => setExpanded(p => !p)}
                  className="text-xs font-bold text-green-600 hover:text-green-700 mt-1.5 flex items-center gap-1 cursor-pointer focus:outline-none">
                  {expanded ? (isRTL ? 'رؤية أقل' : 'See less') : (isRTL ? 'قراءة المزيد' : 'See more')}
                  {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Media Preview Component */}
        {ann.image_url && (
          <div onClick={() => onPreviewFile(ann.image_url, ann.title, 'IMAGE')} className="mt-4 relative w-full h-80 rounded-2xl overflow-hidden flex items-center justify-center bg-zinc-900/10 border border-border/40 select-none group cursor-pointer">
            <div className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-110 pointer-events-none transition-all duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${ann.image_url})` }} />
            <div className="absolute inset-0 bg-black/10 dark:bg-black/35 backdrop-blur-sm pointer-events-none" />
            <img src={ann.image_url} alt="" className="relative z-10 max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-[1.01]" />
          </div>
        )}

        {ann.video_url && (
          <div className="mt-4 relative w-full h-80 rounded-2xl overflow-hidden flex items-center justify-center bg-zinc-900/10 border border-border/40 select-none group">
            <video src={ann.video_url} className="relative z-10 w-full h-full object-contain" controls />
          </div>
        )}

        {ann.file_url && !ann.image_url && !ann.video_url && (
          <div onClick={() => onPreviewFile(ann.file_url, ann.file_name || 'ملف مرفق', 'FILE')} className="mt-4 flex items-center gap-3 p-4 rounded-2xl border border-border bg-green-50/10 hover:bg-green-100/20 dark:hover:bg-green-950/10 transition-all group select-none cursor-pointer">
            <div className="w-11 h-11 rounded-xl bg-green-100 dark:bg-green-950/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
              <FileText className="w-5.5 h-5.5" />
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{ann.file_name || 'مرفق مستندي'}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{isRTL ? 'انقر لفتح واستعراض الملف داخل التطبيق' : 'Click to preview in-app'}</p>
            </div>
            <Paperclip className="w-4 h-4 text-green-500 group-hover:scale-110 transition-transform shrink-0" />
          </div>
        )}
      </div>

      {/* Engagement bar */}
      <div className="border-t border-border/40 bg-muted/5 dark:bg-zinc-900/10 p-5 space-y-4 shrink-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-bold px-1 select-none">
          <div className="flex items-center gap-1">
            <span className="flex items-center justify-center w-5.5 h-5.5 rounded-full bg-red-500 text-white text-[10px]">❤️</span>
            <span>{likesCount} {isRTL ? 'تفاعلات' : 'reactions'}</span>
          </div>
          <button onClick={() => setCommentsExpanded(p => !p)} className="hover:underline cursor-pointer focus:outline-none">
            {comments.length} {isRTL ? 'تعليق ومناقشة' : 'comments'}
          </button>
        </div>

        <Separator className="bg-border/40" />

        <div className="grid grid-cols-2 gap-4">
          <button onClick={handleLikeToggle}
            className={cn('flex items-center justify-center gap-2 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer focus:outline-none border border-transparent active:scale-95',
              liked 
                ? 'bg-red-50 dark:bg-red-950/20 text-red-500 border-red-500/10' 
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            )}>
            <Heart className={cn('w-5 h-5 transition-transform duration-300', liked && 'fill-red-500 scale-110')} />
            {isRTL ? 'تفاعل' : 'Like'}
          </button>
          
          <button onClick={() => setCommentsExpanded(p => !p)}
            className={cn('flex items-center justify-center gap-2 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer focus:outline-none border border-transparent active:scale-95',
              commentsExpanded
                ? 'bg-green-50 dark:bg-green-950/20 text-green-600 border-green-500/10'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            )}>
            <MessageCircle className="w-5 h-5" />
            {isRTL ? 'التعليقات' : 'Comment'}
          </button>
        </div>

        {/* Comments Section */}
        {commentsExpanded && (
          <div className="pt-2 space-y-4">
            {comments.length > 0 && (
              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3 items-start text-xs group">
                    <Avatar className="w-8.5 h-8.5 bg-green-100 text-green-700 border border-green-500/10 font-bold shrink-0">
                      <AvatarFallback className="text-xs">
                        {(c.author_name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted/40 dark:bg-zinc-900/35 border border-border/40 rounded-2xl p-3 relative">
                      <div className="flex justify-between items-center mb-1 gap-4">
                        <div className="flex flex-wrap items-center gap-1.5">
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
                        <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

            {/* Write comment */}
            <form onSubmit={handleAddComment} className="flex gap-2.5 items-start">
              <Avatar className="w-8.5 h-8.5 bg-green-50 text-green-600 border border-green-500/10 font-bold shrink-0">
                <AvatarFallback className="text-xs">
                  {(user?.name || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 relative flex items-center">
                <Textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder={isRTL ? 'اكتب تعليقاً بناءً...' : 'Write a constructive comment...'}
                  className="min-h-[42px] max-h-[100px] py-2.5 px-4 pr-10 rtl:pr-4 rtl:pl-10 text-xs rounded-2xl bg-muted/40 border-border/50 focus-visible:ring-green-500/20 focus-visible:border-green-500/40 resize-none font-semibold"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment(e);
                    }
                  }}
                />
                <button type="submit" disabled={!commentText.trim()}
                  className="absolute right-3.5 rtl:right-auto rtl:left-3.5 text-green-600 hover:text-green-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer p-1 rounded">
                  <Send className={cn("w-4 h-4", isRTL && "rotate-180")} />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Edit comment dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-foreground font-black text-base">{isRTL ? 'تعديل التعليق' : 'Edit Comment'}</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <Textarea value={editText} onChange={e => setEditText(e.target.value)} rows={4} className="w-full text-xs font-semibold rounded-2xl border-border bg-muted/10" />
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

// ─── Main AnnouncementsPage Component ─────────────────────────────────────────
export default function AnnouncementsPage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pinned, management, operations, urgent, archived
  const [search, setSearch] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  // File preview states
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewName, setPreviewName] = useState('');
  const [previewType, setPreviewType] = useState('');

  const userCanPublish = canPublish(user);

  const load = useCallback(async (pageNum = 1, append = false, currentFilter = filter, currentSearch = search) => {
    setLoading(true);
    try {
      let params = { page: pageNum, page_size: 10 };
      if (currentFilter === 'pinned') params.is_pinned = 'true';
      else if (currentFilter === 'archived') params.is_archived = 'true';
      else if (['management', 'operations', 'urgent'].includes(currentFilter)) params.category = currentFilter;

      if (currentSearch.trim()) params.q = currentSearch;

      const res = await api.get('announcements/', { params });
      
      const newItems = res.data.results || [];
      setAnnouncements(prev => append ? [...prev, ...newItems] : newItems);
      setTotalPages(res.data.total_pages || 1);
      setHasMore(res.data.has_next || false);
      setPage(pageNum);
    } catch (e) {
      toast.error(isRTL ? 'فشل تحميل الإعلانات' : 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [filter, search, isRTL]);

  useEffect(() => {
    load(1, false, filter, search);
  }, [filter, search, load]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInputValue);
  };

  const handleLoadMore = () => {
    if (hasMore) load(page + 1, true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isRTL ? 'هل تريد حذف هذا الإعلان نهائياً؟' : 'Delete this announcement permanently?')) return;
    try {
      await api.delete(`announcements/${id}/`);
      toast.success(isRTL ? 'تم الحذف' : 'Deleted');
      setAnnouncements(p => p.filter(a => a.id !== id));
    } catch {
      toast.error(isRTL ? 'فشل الحذف' : 'Failed');
    }
  };

  const handleEdit = (ann) => {
    setEditTarget(ann);
    setShowForm(false);
  };

  const handlePinToggle = async (id, makePinned) => {
    try {
      const res = await api.patch(`announcements/${id}/`, { is_pinned: makePinned });
      setAnnouncements(p => p.map(a => a.id === id ? { ...a, is_pinned: res.data.is_pinned } : a).sort((a,b) => b.is_pinned - a.is_pinned));
      toast.success(makePinned ? (isRTL ? 'تم تثبيت المنشور بالأعلى' : 'Announcement pinned') : (isRTL ? 'تم إلغاء التثبيت' : 'Announcement unpinned'));
    } catch {
      toast.error(isRTL ? 'فشلت العملية' : 'Action failed');
    }
  };

  const handleArchiveToggle = async (id, makeArchived) => {
    try {
      await api.patch(`announcements/${id}/`, { is_archived: makeArchived });
      setAnnouncements(p => p.filter(a => a.id !== id));
      toast.success(makeArchived ? (isRTL ? 'تم أرشفة الإعلان بنجاح' : 'Announcement archived') : (isRTL ? 'تم استعادة الإعلان' : 'Announcement unarchived'));
    } catch {
      toast.error(isRTL ? 'فشلت العملية' : 'Action failed');
    }
  };

  const handleSaved = (data, isEdit) => {
    load(1, false, filter, search);
    setEditTarget(null);
    setShowForm(false);
  };

  const handleFilePreview = (url, name, type) => {
    setPreviewUrl(url);
    setPreviewName(name);
    setPreviewType(type);
    setPreviewOpen(true);
  };

  const filterTabs = [
    { id: 'all', label: isRTL ? 'كل الإعلانات' : 'All Feeds' },
    { id: 'pinned', label: isRTL ? 'المثبتة' : 'Pinned' },
    { id: 'urgent', label: isRTL ? 'عاجل وهام' : 'Urgent' },
    { id: 'management', label: isRTL ? 'الإدارة' : 'Management' },
    { id: 'operations', label: isRTL ? 'العمليات الميدانية' : 'Operations' },
    { id: 'archived', label: isRTL ? 'الأرشيف' : 'Archived' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 px-1 animate-in fade-in duration-300">
      
      {/* Top Banner Navigation */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-br from-green-500/10 to-emerald-600/5 dark:from-green-950/20 dark:to-zinc-900/10 rounded-3xl p-6 border border-green-500/10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-background border border-border/50 hover:bg-muted text-muted-foreground transition-all duration-200 shrink-0 font-bold text-xs shadow-xs hover:shadow-md hover:border-green-500/30 cursor-pointer">
            {isRTL ? <ArrowRight className="w-4 h-4 text-green-600" /> : <ArrowLeft className="w-4 h-4 text-green-600" />}
            <span>{isRTL ? 'الرجوع للوحة التحكم' : 'Back to Dashboard'}</span>
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-foreground flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-green-600" />
              <span>{isRTL ? 'مركز إعلانات ومستجدات أطلس' : 'Atlas Operational Announcements Hub'}</span>
            </h1>
            <p className="text-xs text-muted-foreground font-semibold mt-1">
              {isRTL ? 'نظام البث الإداري والعملياتي والتفاعل اليومي للشركة' : 'Facebook-style internal operational communications feed'}
            </p>
          </div>
        </div>

        {userCanPublish && (
          <Button onClick={() => { setShowForm(true); setEditTarget(null); }} className="bg-green-600 hover:bg-green-700 text-white rounded-2xl h-11 px-5 text-xs font-bold gap-2 self-stretch md:self-auto cursor-pointer shadow-md shadow-green-900/10 shrink-0">
            <Plus className="w-4 h-4" />
            {isRTL ? 'نشر إعلان إداري جديد' : 'Publish Announcement'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Filters Panel */}
        <div className="lg:col-span-1 bg-card border border-border/60 rounded-3xl p-5 space-y-5">
          <div>
            <h3 className="text-xs font-black text-muted-foreground/80 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-green-600" />
              <span>{isRTL ? 'تصفية الإعلانات' : 'Filter Announcements'}</span>
            </h3>
            <div className="flex flex-col gap-1">
              {filterTabs.map(tab => (
                <button key={tab.id} onClick={() => { setFilter(tab.id); setPage(1); }}
                  className={cn(
                    'w-full text-right rtl:text-right ltr:text-left py-2.5 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between',
                    filter === tab.id
                      ? 'bg-green-600 text-white shadow-xs'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-border/60" />

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <h3 className="text-xs font-black text-muted-foreground/80 uppercase tracking-wider block">{isRTL ? 'بحث في المحتوى' : 'Search Feed'}</h3>
            <div className="relative flex items-center">
              <input type="text" value={searchInputValue} onChange={e => setSearchInputValue(e.target.value)}
                placeholder={isRTL ? 'ابحث عن الكلمات المفتاحية...' : 'Search keyword...'}
                className="w-full text-xs font-semibold pl-8 pr-3 rtl:pl-3 rtl:pr-8 py-2.5 rounded-xl border border-border/60 bg-muted/20 focus:outline-none focus:ring-1 focus:ring-green-500/25" />
              <Search className="w-4 h-4 text-muted-foreground/60 absolute left-2.5 rtl:left-auto rtl:right-2.5" />
            </div>
            {(searchInputValue || search) && (
              <div className="flex justify-between items-center pt-1">
                <button type="submit" className="text-[10px] font-black text-green-600 hover:underline">{isRTL ? 'تطبيق البحث' : 'Apply search'}</button>
                {search && (
                  <button type="button" onClick={() => { setSearchInputValue(''); setSearch(''); }} className="text-[10px] font-black text-red-500 hover:underline">{isRTL ? 'إلغاء' : 'Clear'}</button>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Central Feed Section */}
        <div className="lg:col-span-3 space-y-5">
          {announcements.length === 0 && !loading ? (
            <Card className="border-border/60 rounded-3xl py-14 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center border border-border/40 shadow-inner">
                <Megaphone className="w-8 h-8 opacity-30 text-green-600" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-foreground">{isRTL ? 'لا توجد منشورات مطابقة للبحث' : 'No posts matches filters'}</p>
                <p className="text-xs text-muted-foreground/80 mt-1 max-w-sm leading-relaxed">
                  {isRTL ? 'يرجى مراجعة تصنيفات الفلتر بالجانب، أو تغيير كلمة البحث للحصول على نتائج.' : 'Please choose another filter category or clear search query.'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {announcements.map(ann => (
                <MainAnnouncementCard
                  key={ann.id}
                  ann={ann}
                  isRTL={isRTL}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onPin={handlePinToggle}
                  onArchive={handleArchiveToggle}
                  canManageThis={canManage(user, ann)}
                  user={user}
                  onPreviewFile={handleFilePreview}
                />
              ))}

              {/* Load More Trigger */}
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button onClick={handleLoadMore} disabled={loading} className="rounded-2xl h-11 px-8 border border-border bg-card text-foreground hover:bg-muted text-xs font-bold gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isRTL ? 'عرض المزيد من المنشورات' : 'Load More Announcements'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {loading && announcements.length === 0 && (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Card key={i} className="border-border/40 rounded-3xl p-6 space-y-4 bg-card/65 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-muted" />
                    <div className="space-y-2">
                      <div className="h-3.5 bg-muted rounded w-28" />
                      <div className="h-2.5 bg-muted rounded w-16" />
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="h-3.5 bg-muted rounded w-3/4" />
                    <div className="h-3.5 bg-muted rounded w-5/6" />
                  </div>
                  <div className="h-44 bg-muted rounded-2xl w-full pt-2" />
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Write/Edit Announcement Form Dialog Modal */}
      <Dialog open={showForm || !!editTarget} onOpenChange={open => { if (!open) { setShowForm(false); setEditTarget(null); } }}>
        <DialogContent className="sm:max-w-[550px] rounded-3xl p-6">
          <DialogHeader className="pb-3 border-b border-border/40">
            <DialogTitle className="flex items-center gap-2 text-foreground font-black text-lg">
              <Megaphone className="w-5.5 h-5.5 text-green-600" />
              <span>{editTarget ? (isRTL ? 'تعديل الإعلان المنشور' : 'Edit Published Post') : (isRTL ? 'نشر إعلان إداري جديد' : 'New Announcement')}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <AnnouncementForm isRTL={isRTL} initial={editTarget} onSaved={handleSaved} onClose={() => { setShowForm(false); setEditTarget(null); }} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Global in-app Document Viewer Modal */}
      <DocumentViewerModal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} fileUrl={previewUrl} fileName={previewName} fileType={previewType} />
    </div>
  );
}
