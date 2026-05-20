import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Megaphone, Plus, Trash2, Video, Paperclip, X,
  ChevronDown, ChevronUp, Calendar, ImagePlus,
  Link2, Upload, Loader2, Edit3, Check, FileText,
  Heart, MessageCircle, MoreHorizontal, Play
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { toast } from 'sonner';

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
  return (user.app_permissions || []).includes('can_post_announcement');
};

const canManage = (user, ann) => {
  if (!user) return false;
  if (['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user.role)) return true;
  return ann.published_by === user?.name;
};

// ─── MediaPreview ─────────────────────────────────────────────────────────────
function MediaPreview({ imageUrl, videoUrl, fileUrl, fileName }) {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const vidRef = useRef(null);

  if (imageUrl) return (
    <div className="w-full overflow-hidden rounded-xl mb-3 bg-black/5">
      <img src={imageUrl} alt="" className="w-full max-h-72 object-cover" />
    </div>
  );

  if (videoUrl) return (
    <div className="relative w-full rounded-xl overflow-hidden mb-3 bg-black aspect-video">
      <video ref={vidRef} src={videoUrl} className="w-full h-full object-cover"
        controls={videoPlaying}
        onClick={() => { setVideoPlaying(true); vidRef.current?.play(); }}
      />
      {!videoPlaying && (
        <div className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={() => { setVideoPlaying(true); vidRef.current?.play(); }}>
          <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </div>
        </div>
      )}
    </div>
  );

  if (fileUrl) return (
    <a href={fileUrl} target="_blank" rel="noreferrer"
      className="flex items-center gap-3 p-3 mb-3 rounded-xl border border-border/60 bg-blue-50/50 dark:bg-blue-950/10 hover:bg-blue-100/50 dark:hover:bg-blue-950/20 transition-colors group">
      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
        <FileText className="w-5 h-5" />
      </div>
      <div className="flex-grow min-w-0">
        <p className="text-xs font-bold text-foreground truncate">{fileName || 'مرفق'}</p>
        <p className="text-[10px] text-muted-foreground">انقر للفتح</p>
      </div>
      <Paperclip className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors shrink-0" />
    </a>
  );

  return null;
}

// ─── AnnouncementCard (Facebook-style) ───────────────────────────────────────
function AnnouncementCard({ ann, isRTL, onDelete, onEdit, canManageThis }) {
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked]       = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const date = new Date(ann.created_at).toLocaleDateString(
    isRTL ? 'ar-EG' : 'en-GB',
    { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  );

  const avatarLetter = (ann.published_by || 'N')[0].toUpperCase();
  const bodyLong = ann.body && ann.body.length > 150;

  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-black text-sm shrink-0">
            {avatarLetter}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">{ann.published_by}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {date}
            </p>
          </div>
        </div>

        {canManageThis && (
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(p => !p)}
              className="p-1.5 rounded-full hover:bg-muted/60 text-muted-foreground transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute top-8 left-0 w-36 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
                <button onClick={() => { onEdit(ann); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-muted/60 text-foreground transition-colors">
                  <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                  {isRTL ? 'تعديل' : 'Edit'}
                </button>
                <button onClick={() => { onDelete(ann.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                  {isRTL ? 'حذف' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-4 pb-2">
        <h4 className="font-black text-base text-foreground mb-1.5 leading-snug">{ann.title}</h4>
        {ann.body && (
          <>
            <p className={cn('text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap', !expanded && bodyLong && 'line-clamp-3')}>
              {ann.body}
            </p>
            {bodyLong && (
              <button onClick={() => setExpanded(p => !p)}
                className="text-xs font-bold text-green-600 hover:text-green-700 mt-1 flex items-center gap-1">
                {expanded ? (isRTL ? 'أقل' : 'See less') : (isRTL ? 'المزيد' : 'See more')}
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </>
        )}
      </div>

      {/* Media */}
      <div className="px-4">
        <MediaPreview imageUrl={ann.image_url} videoUrl={ann.video_url} fileUrl={ann.file_url} fileName={ann.file_name} />
      </div>

      {/* Reactions bar */}
      <div className="px-4 pb-3 flex items-center gap-4 border-t border-border/30 pt-3">
        <button onClick={() => setLiked(p => !p)}
          className={cn('flex items-center gap-1.5 text-xs font-bold transition-colors',
            liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400')}>
          <Heart className={cn('w-4 h-4 transition-transform', liked && 'fill-red-500 scale-110')} />
          {isRTL ? 'إعجاب' : 'Like'}
        </button>
        <button className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-blue-500 transition-colors">
          <MessageCircle className="w-4 h-4" />
          {isRTL ? 'تعليق' : 'Comment'}
        </button>
      </div>
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
  const [mediaMode, setMediaMode] = useState('none'); // 'none'|'image'|'video'|'file'

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
    <div className="border border-border/50 rounded-2xl bg-card p-5 shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-green-600" />
          {isEdit ? (isRTL ? 'تعديل الإعلان' : 'Edit Announcement') : (isRTL ? 'إعلان جديد' : 'New Announcement')}
        </h4>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/60 text-muted-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Title */}
        <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
          placeholder={isRTL ? 'عنوان الإعلان *' : 'Announcement title *'}
          autoComplete="off"
          className="w-full font-bold text-sm px-4 py-2.5 rounded-xl border border-border/60 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/40 transition-all placeholder:font-normal placeholder:text-muted-foreground/60" />

        {/* Body */}
        <textarea value={form.body} onChange={e => set('body', e.target.value)}
          placeholder={isRTL ? 'ماذا تريد أن تقول؟' : "What's on your mind?"}
          rows={3}
          className="w-full text-sm px-4 py-2.5 rounded-xl border border-border/60 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/40 resize-none transition-all placeholder:text-muted-foreground/60" />

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

        <Button type="submit" disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm gap-2 h-10">
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" />{isRTL ? 'جارٍ الحفظ...' : 'Saving...'}</>
            : isEdit
              ? <><Check className="w-4 h-4" />{isRTL ? 'حفظ التعديلات' : 'Save Changes'}</>
              : <>{isRTL ? '📣 نشر' : '📣 Publish'}</>
          }
        </Button>
      </form>
    </div>
  );
}

// ─── AnnouncementsBoard ───────────────────────────────────────────────────────
export default function AnnouncementsBoard() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

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
    if (!window.confirm(isRTL ? 'هل تريد حذف هذا الإعلان؟' : 'Delete this announcement?')) return;
    try {
      await api.delete(`announcements/${id}/`);
      toast.success(isRTL ? 'تم الحذف' : 'Deleted');
      setAnnouncements(p => p.filter(a => a.id !== id));
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
  };

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3 px-5 pt-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Megaphone className="w-4 h-4" />
            </div>
            {isRTL ? 'لوحة الإعلانات' : 'Bulletin Board'}
            {announcements.length > 0 && (
              <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 rounded-full">
                {announcements.length}
              </Badge>
            )}
          </CardTitle>
          {userCanPublish && (
            <Button variant="outline" size="sm"
              onClick={() => { setShowForm(p => !p); setEditTarget(null); }}
              className="h-7 text-xs font-bold rounded-xl border-green-500/30 text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20 gap-1">
              <Plus className="w-3.5 h-3.5" />
              {isRTL ? 'إعلان جديد' : 'New Post'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5 space-y-3">
        {/* Create form */}
        {showForm && userCanPublish && !editTarget && (
          <AnnouncementForm isRTL={isRTL}
            onSaved={handleSaved}
            onClose={() => setShowForm(false)} />
        )}

        {/* Edit form */}
        {editTarget && (
          <AnnouncementForm isRTL={isRTL}
            initial={editTarget}
            onSaved={handleSaved}
            onClose={() => setEditTarget(null)} />
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-3 text-muted-foreground">
            <div className="w-14 h-14 rounded-full bg-muted/40 flex items-center justify-center">
              <Megaphone className="w-7 h-7 opacity-30" />
            </div>
            <p className="text-sm font-semibold">{isRTL ? 'لا توجد إعلانات حالياً' : 'No announcements yet'}</p>
            <p className="text-xs opacity-70 text-center max-w-[200px]">
              {userCanPublish
                ? (isRTL ? 'اضغط "إعلان جديد" للبدء' : 'Click "New Post" to start')
                : (isRTL ? 'سيظهر هنا أي إعلان ينشره الإدارة' : 'Company announcements will appear here')}
            </p>
          </div>
        ) : (
          /* Single scroll container — shows ~1 card, scroll for more */
          <div className="relative">
            {/* Scroll hint — gradient fade at bottom when more items exist */}
            {announcements.length > 1 && (
              <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-card/90 to-transparent pointer-events-none z-10 rounded-b-2xl" />
            )}
            <div
              className="overflow-y-auto space-y-3 pr-0.5"
              style={{ maxHeight: '420px', scrollSnapType: 'y mandatory' }}
            >
              {announcements.map(ann => (
                <div key={ann.id} style={{ scrollSnapAlign: 'start' }}>
                  <AnnouncementCard
                    ann={ann}
                    isRTL={isRTL}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    canManageThis={canManage(user, ann)}
                  />
                </div>
              ))}
            </div>
            {/* Scroll indicator */}
            {announcements.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-2">
                {announcements.map((_, i) => (
                  <div key={i} className={cn(
                    'w-1.5 h-1.5 rounded-full transition-all',
                    i === 0 ? 'bg-orange-400 w-3' : 'bg-muted-foreground/30'
                  )} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
