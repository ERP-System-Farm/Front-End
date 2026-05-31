import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Search, Calendar, User, MapPin, Film, FileText,
  Image as ImageIcon, Download, Copy, Eye, ExternalLink, RefreshCw,
  FolderOpen, Layers, Grid, List, Loader2, Info, Trash2
} from 'lucide-react';
import { reportsApi } from '../../services/reportsApi';
import api from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { cn, getAbsoluteFileUrl } from '../../lib/utils';
import DocumentViewerModal from '../../components/dashboard/DocumentViewerModal';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

async function uploadToCloudinary(file, resourceType = 'auto') {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: fd }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Upload failed');
  }
  const data = await res.json();
  return { url: data.secure_url, type: data.resource_type };
}

export default function MediaControlCenter({ embedded = false }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  // Media items state
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filter options list (fetched from API)
  const [engineers, setEngineers] = useState([]);
  const [locations, setLocations] = useState([]);

  // Active filters state
  const [search, setSearch] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [fileType, setFileType] = useState('ALL'); // ALL, IMAGE, VIDEO, FILE
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSource, setSelectedSource] = useState(''); // ALL, task, harvest, gallery, announcement
  const [selectedDate, setSelectedDate] = useState('');

  // Layout preference
  const [layout, setLayout] = useState('grid'); // grid, list

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Document Viewer states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerName, setViewerName] = useState('');
  const [viewerType, setViewerType] = useState('');

  // Load engineers and location hierarchy
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [engRes, treeRes] = await Promise.allSettled([
          reportsApi.getEngineers(),
          reportsApi.getFarmHierarchy(),
        ]);

        if (engRes.status === 'fulfilled') {
          const engList = engRes.value?.data?.results || engRes.value?.data || [];
          setEngineers(engList);
        }

        if (treeRes.status === 'fulfilled') {
          const treeData = treeRes.value?.data?.tree || (Array.isArray(treeRes.value?.data) ? treeRes.value?.data : []);
          
          const flattenNodes = (nodes = [], parentLabel = '') =>
            nodes.flatMap((node) => {
              const currentLabel = parentLabel ? `${parentLabel} > ${node.name}` : node.name;
              const flattenedNode = { ...node, displayLabel: currentLabel };
              return [flattenedNode, ...flattenNodes(node.children || [], currentLabel)];
            });

          setLocations(flattenNodes(treeData));
        }
      } catch (err) {
        console.error('Failed to load filters metadata:', err);
      }
    };
    fetchOptions();
  }, []);

  // Fetch media items from backend
  const loadMedia = useCallback(async (pageNum = 1, append = false) => {
    setLoading(true);
    setError(false);
    try {
      const params = {
        page: pageNum,
        page_size: 24,
      };

      if (search.trim()) {
        params.q = search.trim();
      }
      if (fileType !== 'ALL') {
        params.file_type = fileType;
      }
      if (selectedEngineer) {
        params.engineer = selectedEngineer;
      }
      if (selectedLocation) {
        params.enclosure = selectedLocation;
      }
      if (selectedDate) {
        params.date = selectedDate;
      }

      const response = await reportsApi.getMediaFeed(params);
      
      const results = response.data?.results || response.data || [];
      const total = response.data?.count || results.length;
      const nextExists = response.data?.has_next || false;

      // Normalize items and filter out any announcements
      const normalized = results
        .map((item) => {
          const url = item.url || item.file_url;
          const type = item.type || item.file_type || 'FILE';
          
          let determinedSource = item.source;
          if (determinedSource === 'daily_task') {
            determinedSource = 'task';
          }
          if (!determinedSource) {
            if (item.report) {
              determinedSource = 'task';
            } else {
              determinedSource = 'gallery';
            }
          }

          return {
            ...item,
            url,
            type,
            file_url: url,
            file_type: type,
            uploader: item.uploaded_by || item.uploaded_by_name || item.engineer_name || (isRTL ? 'المعرض العام' : 'Public Gallery'),
            date: item.created_at || item.uploaded_at,
            source: determinedSource,
            location_name: item.location_name || (determinedSource === 'gallery' ? (isRTL ? 'المعرض العام' : 'Public Gallery') : null)
          };
        })
        .filter(item => item.source !== 'announcement');

      // Filter by source client-side if needed (since API handles major filters)
      const filteredBySource = selectedSource 
        ? normalized.filter(item => item.source === selectedSource)
        : normalized;

      setMedia((prev) => (append ? [...prev, ...filteredBySource] : filteredBySource));
      setTotalCount(total);
      setHasMore(nextExists);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching media feed:', err);
      setError(true);
      toast.error(isRTL ? 'فشل تحميل معرض الوسائط' : 'Failed to load media gallery');
    } finally {
      setLoading(false);
    }
  }, [search, fileType, selectedEngineer, selectedLocation, selectedSource, selectedDate, isRTL]);

  useEffect(() => {
    loadMedia(1, false);
  }, [loadMedia]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInputValue);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMedia(page + 1, true);
    }
  };

  const handleRefresh = () => {
    setSearchInputValue('');
    setSearch('');
    setFileType('ALL');
    setSelectedEngineer('');
    setSelectedLocation('');
    setSelectedSource('');
    setSelectedDate('');
    loadMedia(1, false);
  };

  const handleCopyLink = (url) => {
    const absolute = getAbsoluteFileUrl(url);
    navigator.clipboard.writeText(absolute);
    toast.success(isRTL ? 'تم نسخ الرابط إلى الحافظة ✓' : 'Link copied to clipboard ✓');
  };

  const handlePreview = (item) => {
    setViewerUrl(item.file_url || item.url);
    setViewerName(item.file_name || (item.report_title ? `${item.report_title} - مرفق` : 'مرفق'));
    setViewerType(item.file_type || item.type);
    setViewerOpen(true);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      let fileUrl = null;
      let fileTypeEnum = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
      let uploaded = false;

      if (CLOUD_NAME && UPLOAD_PRESET) {
        try {
          const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
          const cldRes = await uploadToCloudinary(file, resourceType);
          fileUrl = cldRes.url;
          fileTypeEnum = cldRes.type === 'video' ? 'VIDEO' : 'IMAGE';
          uploaded = true;
        } catch (cldErr) {
          console.warn('Cloudinary upload failed, falling back to backend storage...', cldErr);
        }
      }

      if (!uploaded) {
        // Fallback backend upload
        const fd = new FormData();
        fd.append('file', file);
        const backendRes = await api.post('/uploads/', fd);
        fileUrl = backendRes.data.file_url;
        uploaded = true;
      }

      if (fileUrl) {
        await api.post('reports/gallery/', { url: fileUrl, type: fileTypeEnum });
        toast.success(isRTL ? 'تم الرفع بنجاح ✓' : 'Uploaded successfully ✓');
        await loadMedia(1, false);
      } else {
        throw new Error('Upload failed to return URL');
      }
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? 'فشل الرفع' : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const navigateToSource = (item) => {
    if (item.source === 'harvest' || item.report_title?.includes('حصاد')) {
      if (item.report) {
        navigate(`/production?id=${item.report}`);
      } else {
        navigate('/production');
      }
    } else {
      if (item.report) {
        navigate(`/reports/tasks/${item.report}`);
      } else {
        navigate('/reports/tasks');
      }
    }
  };

  const handleDeleteMedia = async (id) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من رغبتك في حذف هذا الملف؟' : 'Are you sure you want to delete this media item?')) {
      return;
    }
    try {
      await api.delete(`/reports/gallery/${id}/`);
      toast.success(isRTL ? 'تم حذف الملف بنجاح ✓' : 'Media deleted successfully ✓');
      loadMedia(1, false);
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? 'فشل حذف الملف' : 'Failed to delete media');
    }
  };

  // Derive counts dynamically for stats cards
  const imageCount = media.filter(i => i.file_type === 'IMAGE').length;
  const videoCount = media.filter(i => i.file_type === 'VIDEO').length;
  const docCount = media.filter(i => i.file_type === 'FILE').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 px-2 animate-in fade-in duration-300">
      
      {/* Top Title Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-br from-green-500/10 to-emerald-600/5 dark:from-green-950/20 dark:to-zinc-900/10 rounded-3xl p-6 border border-green-500/10">
        <div className="flex items-center gap-3">
          {!embedded && (
            <button onClick={() => navigate('/dashboard')} className="p-2 rounded-2xl bg-background border border-border/50 hover:bg-muted text-muted-foreground transition-colors shrink-0">
              {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </button>
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-black text-foreground flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-green-600 animate-pulse" />
              <span>{isRTL ? 'معرض الوسائط والتحكم بالملفات' : 'Operational Media Control Center'}</span>
            </h1>
            <p className="text-xs text-muted-foreground font-semibold mt-1">
              {isRTL ? 'إدارة واستعراض الصور والفيديوهات والملفات المرفقة بتقارير المزرعة والمنشورات' : 'Unified management of photos, videos, and documents attached to operations'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 self-stretch md:self-auto shrink-0 items-center">
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleUpload}
          />
          <Button
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="bg-green-600 hover:bg-green-700 text-white rounded-2xl h-11 px-5 text-xs font-bold gap-1.5 cursor-pointer shadow-md shadow-green-900/10"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                <span>{isRTL ? 'رفع وسائط يدويًا' : 'Upload Media'}</span>
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleRefresh} className="rounded-2xl h-11 px-4 text-xs font-bold gap-1.5 cursor-pointer">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            {isRTL ? 'تحديث المعرض' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Top Level Summary Statistics Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Items */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-3.5 hover:shadow-md transition-all duration-300 group">
          <div className="w-11 h-11 rounded-xl bg-green-500/10 text-green-600 dark:bg-green-950/20 dark:text-green-400 border border-green-500/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
            <Layers className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">{isRTL ? 'إجمالي الملفات' : 'Total Files'}</p>
            <p className="text-lg font-black text-foreground mt-0.5">{totalCount || media.length}</p>
          </div>
        </div>

        {/* Card 2: Images */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-3.5 hover:shadow-md transition-all duration-300 group">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-500/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
            <ImageIcon className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">{isRTL ? 'الصور' : 'Images'}</p>
            <p className="text-lg font-black text-foreground mt-0.5">{imageCount > 0 ? imageCount : media.filter(i => i.file_type === 'IMAGE').length}</p>
          </div>
        </div>

        {/* Card 3: Videos */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-3.5 hover:shadow-md transition-all duration-300 group">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-500/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
            <Film className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">{isRTL ? 'الفيديوهات' : 'Videos'}</p>
            <p className="text-lg font-black text-foreground mt-0.5">{videoCount > 0 ? videoCount : media.filter(i => i.file_type === 'VIDEO').length}</p>
          </div>
        </div>

        {/* Card 4: Documents */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-3.5 hover:shadow-md transition-all duration-300 group">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-500/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
            <FileText className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">{isRTL ? 'المستندات والملفات' : 'Documents & PDFs'}</p>
            <p className="text-lg font-black text-foreground mt-0.5">{docCount > 0 ? docCount : media.filter(i => i.file_type === 'FILE').length}</p>
          </div>
        </div>
      </div>

      {/* Filter Options Bar */}
      <Card className="border border-border/60 shadow-xs rounded-3xl overflow-hidden bg-card">
        <CardContent className="p-5 space-y-4">
          
          {/* Row 1: Search and Filter Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <input
                type="text"
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
                placeholder={isRTL ? 'ابحث في عنوان التقرير أو الناشر...' : 'Search report title or publisher...'}
                className="w-full h-11 pl-4 pr-10 rtl:pl-10 rtl:pr-4 text-xs font-semibold rounded-2xl border border-border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/40 transition-all"
              />
              <button type="submit" className="absolute right-3.5 top-1/2 -translate-y-1/2 rtl:right-auto rtl:left-3.5 text-muted-foreground hover:text-foreground cursor-pointer">
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* File Type Filter Tabs */}
            <div className="flex bg-muted/30 border border-border/50 p-1 rounded-2xl gap-0.5 overflow-x-auto select-none">
              {[
                { id: 'ALL', label: isRTL ? 'الكل' : 'All Files' },
                { id: 'IMAGE', label: isRTL ? 'الصور' : 'Images' },
                { id: 'VIDEO', label: isRTL ? 'الفيديوهات' : 'Videos' },
                { id: 'FILE', label: isRTL ? 'الملفات والمستندات' : 'Docs' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFileType(tab.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap",
                    fileType === tab.id
                      ? "bg-green-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Layout preference switch */}
            <div className="flex items-center border border-border/50 rounded-2xl p-1 bg-muted/20 gap-0.5 shrink-0 self-end lg:self-auto">
              <button
                onClick={() => setLayout('grid')}
                className={cn(
                  "p-2 rounded-xl cursor-pointer transition-colors",
                  layout === 'grid' ? "bg-background text-green-600 shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
                title={isRTL ? 'عرض شبكي' : 'Grid Layout'}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayout('list')}
                className={cn(
                  "p-2 rounded-xl cursor-pointer transition-colors",
                  layout === 'list' ? "bg-background text-green-600 shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
                title={isRTL ? 'عرض القائمة' : 'List Layout'}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Row 2: Advanced Select Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 pt-1 border-t border-border/30">
            {/* Engineer Select */}
            <div>
              <label className="text-[10px] font-black text-muted-foreground/80 block mb-1 uppercase tracking-wider">{isRTL ? 'المهندس / الناشر' : 'Engineer / Publisher'}</label>
              <select
                value={selectedEngineer}
                onChange={(e) => setSelectedEngineer(e.target.value)}
                className="w-full text-xs font-bold h-10 px-3 rounded-xl border border-border bg-muted/10 focus:outline-none focus:ring-2 focus:ring-green-500/25"
              >
                <option value="">{isRTL ? 'كل المهندسين' : 'All Engineers'}</option>
                {engineers.map((eng) => (
                  <option key={eng.id} value={eng.id}>
                    {eng.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location / Enclosure Select */}
            <div>
              <label className="text-[10px] font-black text-muted-foreground/80 block mb-1 uppercase tracking-wider">{isRTL ? 'الموقع / الحوض' : 'Enclosure / Location'}</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full text-xs font-bold h-10 px-3 rounded-xl border border-border bg-muted/10 focus:outline-none focus:ring-2 focus:ring-green-500/25"
              >
                <option value="">{isRTL ? 'كل المواقع والأحواض' : 'All Enclosures'}</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.displayLabel}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Type Filter */}
            <div>
              <label className="text-[10px] font-black text-muted-foreground/80 block mb-1 uppercase tracking-wider">{isRTL ? 'مصدر الملف' : 'Source Module'}</label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full text-xs font-bold h-10 px-3 rounded-xl border border-border bg-muted/10 focus:outline-none focus:ring-2 focus:ring-green-500/25"
              >
                <option value="">{isRTL ? 'جميع المصادر' : 'All Sources'}</option>
                <option value="task">{isRTL ? 'التقارير اليومية' : 'Daily Task Reports'}</option>
                <option value="harvest">{isRTL ? 'تقارير الإنتاج والحصاد' : 'Harvest Reports'}</option>
                <option value="gallery">{isRTL ? 'معرض الصور العام' : 'Public Gallery'}</option>
              </select>
            </div>

            {/* Date Input */}
            <div>
              <label className="text-[10px] font-black text-muted-foreground/80 block mb-1 uppercase tracking-wider">{isRTL ? 'التاريخ المحدد' : 'Filter by Date'}</label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full text-xs font-bold h-10 px-3 rounded-xl border border-border bg-muted/10 focus:outline-none focus:ring-2 focus:ring-green-500/25 block"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Feed Gallery Grid / List */}
      {loading && media.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
          <p className="text-xs font-bold text-muted-foreground">{isRTL ? 'جاري تحميل الملفات والوسائط...' : 'Loading media collection...'}</p>
        </div>
      ) : error ? (
        <div className="py-16 text-center bg-card border border-border/50 rounded-3xl p-8 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/20 text-red-500 border border-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Info className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-sm text-foreground">{isRTL ? 'حدث خطأ أثناء تحميل البيانات' : 'Error loading media'}</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{isRTL ? 'يرجى مراجعة اتصال الشبكة والمحاولة مرة أخرى.' : 'Please check your connection and retry.'}</p>
          <Button onClick={() => loadMedia(1, false)} className="mt-4 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold">
            {isRTL ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </div>
      ) : media.length === 0 ? (
        <div className="py-20 text-center bg-card border border-border/50 rounded-3xl p-8 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-muted/65 flex items-center justify-center mx-auto mb-4">
            <Layers className="w-7 h-7 opacity-30" />
          </div>
          <h3 className="font-extrabold text-sm text-foreground">{isRTL ? 'لا توجد وسائط مطابقة' : 'No media items found'}</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            {isRTL ? 'جرب تغيير خيارات البحث أو التصفية للوصول إلى الملفات المطلوبة.' : 'Adjust search terms or filter values to find files.'}
          </p>
          <Button onClick={handleRefresh} variant="outline" className="mt-4 rounded-xl text-xs font-bold">
            {isRTL ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Main Layout Grid wrapper */}
          {layout === 'grid' ? (
            /* Premium Responsive Masonry-like CSS columns */
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-5 space-y-5">
              {media.map((item, idx) => {
                const isImage = item.file_type === 'IMAGE';
                const isVideo = item.file_type === 'VIDEO';
                const isDoc = item.file_type === 'FILE';

                return (
                  <div
                    key={item.id || idx}
                    className="break-inside-avoid bg-card border border-border/50 hover:border-green-500/20 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col relative"
                  >
                    
                    {/* Media container */}
                    <div 
                      onClick={() => handlePreview(item)}
                      className="w-full relative overflow-hidden bg-zinc-950 flex items-center justify-center cursor-pointer min-h-[140px] max-h-[300px]"
                    >
                      {/* Blur background for visual luxury */}
                      {isImage && (
                        <>
                          <div className="absolute inset-0 bg-cover bg-center blur-lg opacity-25 pointer-events-none" style={{ backgroundImage: `url(${getAbsoluteFileUrl(item.file_url)})` }} />
                          <img
                            src={getAbsoluteFileUrl(item.file_url)}
                            alt={item.file_name}
                            className="relative z-10 w-full h-auto object-cover max-h-[250px] transition-transform duration-500 group-hover:scale-105"
                          />
                        </>
                      )}

                      {isVideo && (
                        <div className="relative w-full h-[180px] bg-black flex items-center justify-center z-10">
                          <video
                            src={getAbsoluteFileUrl(item.file_url)}
                            className="w-full h-full object-cover"
                            preload="metadata"
                          />
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-transform group-hover:scale-110">
                              <Film className="w-4.5 h-4.5 text-white fill-white" />
                            </div>
                          </div>
                        </div>
                      )}

                      {isDoc && (
                        <div className="w-full h-[140px] bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 flex flex-col items-center justify-center p-4 border-b border-border/30 z-10 text-center gap-2">
                          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/10 flex items-center justify-center shadow-xs">
                            <FileText className="w-6.5 h-6.5" />
                          </div>
                          <span className="text-[10px] font-bold text-foreground line-clamp-2 px-2 leading-snug">
                            {item.file_name || (item.file_url ? item.file_url.split('/').pop() : 'مستند')}
                          </span>
                        </div>
                      )}

                      {/* Top dark gradient overlay for hover tools */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 z-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        {/* Overlay Actions */}
                        <div className="flex items-center gap-2 z-30">
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePreview(item); }}
                            className="p-2.5 rounded-xl bg-white/90 hover:bg-white text-zinc-900 border border-white/20 shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 transition-all"
                            title={isRTL ? 'معاينة' : 'Preview'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={getAbsoluteFileUrl(item.file_url)}
                            download={item.file_name}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2.5 rounded-xl bg-white/90 hover:bg-white text-zinc-900 border border-white/20 shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 transition-all"
                            title={isRTL ? 'تحميل' : 'Download'}
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyLink(item.file_url); }}
                            className="p-2.5 rounded-xl bg-white/90 hover:bg-white text-zinc-900 border border-white/20 shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 transition-all"
                            title={isRTL ? 'نسخ الرابط' : 'Copy link'}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteMedia(item.id); }}
                            className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white border border-red-500/20 shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 transition-all"
                            title={isRTL ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {item.report && (
                            <button
                              onClick={(e) => { e.stopPropagation(); navigateToSource(item); }}
                              className="p-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 transition-all"
                              title={isRTL ? 'فتح التقرير الأصلي' : 'Open report'}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Source category flag */}
                      <div className="absolute top-2.5 left-2.5 z-15">
                        <Badge className={cn(
                          'text-[9px] font-black border-0 shadow-xs px-2.5 py-0.5 uppercase tracking-wide',
                          item.source === 'harvest' ? 'bg-emerald-600 text-white' :
                          item.source === 'gallery' ? 'bg-purple-600 text-white' :
                          'bg-blue-600 text-white'
                        )}>
                          {item.source === 'harvest' ? (isRTL ? 'حصاد' : 'Harvest') :
                           item.source === 'gallery' ? (isRTL ? 'المعرض' : 'Gallery') :
                           (isRTL ? 'تقرير يومي' : 'Daily Report')}
                        </Badge>
                      </div>
                    </div>

                    {/* Metadata Card Footer */}
                    <div className="p-3.5 space-y-2.5 select-none border-t border-border/10 bg-card">
                      {/* Report / Source Title */}
                      <div>
                        {item.report_title ? (
                          <h4 
                            onClick={() => item.report && navigateToSource(item)}
                            className={cn(
                              "text-xs font-black text-foreground tracking-tight leading-snug line-clamp-2",
                              item.report && "hover:text-green-600 cursor-pointer transition-colors"
                            )}
                          >
                            {item.report_title}
                          </h4>
                        ) : (
                          <h4 className="text-xs font-black text-foreground/80 line-clamp-1 italic">
                            {isRTL ? 'رفع يدوي للوسائط' : 'Manual Media Upload'}
                          </h4>
                        )}
                      </div>

                      {/* Source type label + Location if available */}
                      <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-muted-foreground/90">
                        <span>
                          {item.source === 'harvest' ? (isRTL ? 'تقرير الحصاد والإنتاج' : 'Harvest Report') :
                           item.source === 'gallery' ? (isRTL ? 'معرض الوسائط العام' : 'Public Gallery') :
                           (isRTL ? 'التقرير اليومي للأنشطة' : 'Daily Task Report')}
                        </span>
                        {item.location_name && (
                          <Badge variant="outline" className="text-[9px] font-black max-w-[120px] truncate bg-emerald-500/5 border-emerald-500/10 py-0.5 px-2 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            {item.location_name}
                          </Badge>
                        )}
                      </div>

                      {/* Publisher and Date: بواسطة [الاسم] - [التاريخ] */}
                      <div className="border-t border-border/30 pt-2 text-[10px] text-muted-foreground/80 font-bold flex items-center justify-between gap-2">
                        <span className="truncate max-w-[120px]">
                          {isRTL ? 'بواسطة: ' : 'By: '}
                          <span className="text-foreground/90 font-extrabold">{item.uploader}</span>
                        </span>
                        <span className="shrink-0">
                          {new Date(item.date).toLocaleDateString(isRTL ? 'ar-EG' : 'en-GB')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Elegant List Layout */
            <div className="space-y-3">
              {media.map((item, idx) => {
                const isImage = item.file_type === 'IMAGE';
                const isVideo = item.file_type === 'VIDEO';
                const isDoc = item.file_type === 'FILE';

                return (
                  <div
                    key={item.id || idx}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-card border border-border/50 hover:border-green-500/20 hover:shadow-xs rounded-2xl transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Media Icon/Thumbnail */}
                      <div 
                        onClick={() => handlePreview(item)}
                        className="w-14 h-14 rounded-xl bg-zinc-950 flex items-center justify-center shrink-0 border border-border overflow-hidden cursor-pointer"
                      >
                        {isImage && <img src={getAbsoluteFileUrl(item.file_url)} className="w-full h-full object-cover" alt="" />}
                        {isVideo && <Film className="w-6 h-6 text-blue-400" />}
                        {isDoc && <FileText className="w-6 h-6 text-amber-500" />}
                      </div>

                      {/* Info text */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.report_title ? (
                            <h4 
                              onClick={() => item.report && navigateToSource(item)}
                              className={cn(
                                "text-sm font-black text-foreground truncate max-w-[200px] sm:max-w-[400px]",
                                item.report && "hover:text-green-600 cursor-pointer transition-colors"
                              )}
                            >
                              {item.report_title}
                            </h4>
                          ) : (
                            <h4 className="text-sm font-black text-foreground/80 italic">
                              {isRTL ? 'رفع يدوي للوسائط' : 'Manual Media Upload'}
                            </h4>
                          )}
                          <Badge className={cn(
                            'text-[9px] font-black border-0 px-2.5 py-0.5 rounded-lg shadow-2xs',
                            item.source === 'harvest' ? 'bg-emerald-600 text-white' :
                            item.source === 'gallery' ? 'bg-purple-600 text-white' :
                            'bg-blue-600 text-white'
                          )}>
                            {item.source === 'harvest' ? (isRTL ? 'تقرير الحصاد' : 'Harvest Report') :
                             item.source === 'gallery' ? (isRTL ? 'رفع يدوي' : 'Manual Upload') :
                             (isRTL ? 'تقرير يومي' : 'Daily Report')}
                          </Badge>
                        </div>

                        {/* Sub headers metadata */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-[11px] text-muted-foreground font-bold">
                          <span>
                            {isRTL ? 'بواسطة: ' : 'By: '}
                            <span className="text-foreground/90 font-extrabold">{item.uploader}</span>
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                            {new Date(item.date).toLocaleDateString(isRTL ? 'ar-EG' : 'en-GB')}
                          </span>
                          {item.location_name && (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {item.location_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions tools button row */}
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 justify-end">
                      <Button variant="outline" size="sm" onClick={() => handlePreview(item)} className="rounded-xl h-9 text-xs font-bold gap-1 cursor-pointer">
                        <Eye className="w-3.5 h-3.5" />
                        {isRTL ? 'معاينة' : 'Preview'}
                      </Button>
                      
                      <a href={getAbsoluteFileUrl(item.file_url)} download={item.file_name} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 text-xs font-bold gap-1 cursor-pointer">
                        <Download className="w-3.5 h-3.5" />
                        {isRTL ? 'تحميل' : 'Download'}
                      </a>

                      <Button variant="outline" size="sm" onClick={() => handleCopyLink(item.file_url)} className="rounded-xl h-9 text-xs font-bold gap-1 cursor-pointer">
                        <Copy className="w-3.5 h-3.5" />
                        {isRTL ? 'نسخ الرابط' : 'Copy'}
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteMedia(item.id)}
                        className="rounded-xl h-9 text-xs font-bold gap-1 cursor-pointer bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isRTL ? 'حذف' : 'Delete'}
                      </Button>

                      {item.report && (
                        <Button onClick={() => navigateToSource(item)} className="bg-green-600 hover:bg-green-700 text-white rounded-xl h-9 text-xs font-bold gap-1 cursor-pointer">
                          <ExternalLink className="w-3.5 h-3.5" />
                          {isRTL ? 'التقرير الأصلي' : 'Source'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button pagination */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                onClick={handleLoadMore}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white rounded-2xl h-11 px-8 text-xs font-bold shadow-md shadow-green-900/10 cursor-pointer"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />{isRTL ? 'جاري التحميل...' : 'Loading...'}</>
                ) : (
                  isRTL ? 'تحميل المزيد من الملفات' : 'Load More Files'
                )}
              </Button>
            </div>
          )}

        </div>
      )}

      {/* Global Inline Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        fileUrl={getAbsoluteFileUrl(viewerUrl)}
        fileName={viewerName}
        fileType={viewerType}
      />
    </div>
  );
}
