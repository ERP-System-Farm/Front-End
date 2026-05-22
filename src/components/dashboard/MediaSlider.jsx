import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Images, Play, Plus, Loader2, ChevronLeft, ChevronRight, X, ZoomIn, Calendar, User, MapPin, Video, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import api from '../../services/api';
import { reportsApi } from '../../services/reportsApi';
import { cn, getAbsoluteFileUrl } from '../../lib/utils';
import { toast } from 'sonner';

// Swiper for Dashboard & Lightbox
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard, Zoom, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/zoom';

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

// ─── Video Player for Swiper Lightbox ───
function SwiperVideoPlayer({ src, isActive }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(err => {
        console.warn('Playback failed or was blocked:', err);
      });
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      {/* Main Foreground Video */}
      <video
        ref={videoRef}
        src={src}
        controls
        playsInline
        className="relative z-10 max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
      />
    </div>
  );
}

// ─── Swiper Fullscreen Gallery Modal Component ───
function MediaGalleryModal({ isOpen, onClose, media, initialIndex, isRTL }) {
  const [activeIdx, setActiveIdx] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setActiveIdx(initialIndex);
    }
  }, [isOpen, initialIndex]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center bg-black animate-in fade-in duration-300"
      style={{ zIndex: 999999 }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white border border-zinc-800 transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
        style={{ zIndex: 1000000 }}
        aria-label="Close modal"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Swiper slider gallery */}
      <div className="w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center px-4 relative select-none">
        <Swiper
          modules={[Navigation, Keyboard, Zoom]}
          initialSlide={initialIndex}
          onSlideChange={(swiper) => setActiveIdx(swiper.activeIndex)}
          navigation={{
            prevEl: '.swiper-modal-prev',
            nextEl: '.swiper-modal-next',
          }}
          keyboard={{ enabled: true }}
          zoom={{ maxRatio: 3 }}
          loop={false}
          dir={isRTL ? 'rtl' : 'ltr'}
          className="w-full h-full"
        >
          {media.map((item, idx) => {
            const url = item.url || item.file_url;
            const type = item.type || item.file_type;
            return (
              <SwiperSlide key={idx} className="flex flex-col items-center justify-center relative">

                <div className="swiper-zoom-container flex flex-col items-center justify-center w-full h-full z-10">
                  {type === 'VIDEO' ? (
                    <SwiperVideoPlayer
                      src={getAbsoluteFileUrl(url)}
                      isActive={idx === activeIdx}
                    />
                  ) : (
                    <img
                      src={getAbsoluteFileUrl(url)}
                      alt=""
                      className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
                    />
                  )}
                </div>
                
                {/* Overlay / Info text */}
                <div className="mt-4 text-center max-w-xl px-4 z-10">
                  <h4 className="text-white font-extrabold text-sm md:text-base mb-1 leading-snug">
                    {item.report_title || (isRTL ? 'رفع يدوي للوسائط' : 'Manual Media Upload')}
                  </h4>
                  <p className="text-zinc-400 text-xs font-semibold flex items-center justify-center gap-2">
                    <span>
                      {isRTL ? `بواسطة: ${item.uploader}` : `By: ${item.uploader}`}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                    <span>
                      {new Date(item.date).toLocaleDateString(
                        isRTL ? 'ar-EG' : 'en-GB',
                        { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                      )}
                    </span>
                    {item.location_name && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                        <span className="text-emerald-400">{item.location_name}</span>
                      </>
                    )}
                  </p>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      {/* Next/Prev buttons */}
      {media.length > 1 && (
        <>
          <button className="swiper-modal-prev absolute left-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-zinc-900/70 hover:bg-zinc-800 text-white flex items-center justify-center border border-zinc-800/80 transition-colors shadow-lg cursor-pointer active:scale-95">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button className="swiper-modal-next absolute right-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-zinc-900/70 hover:bg-zinc-800 text-white flex items-center justify-center border border-zinc-800/80 transition-colors shadow-lg cursor-pointer active:scale-95">
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
    </div>,
    document.body
  );
}

// ─── Video Player for Main Feed Slider ───
function BannerVideoPlayer({ src, isActive, onLoadedMetadata }) {
  const videoRef = useRef(null);
  const bgVideoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const bgVideo = bgVideoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(err => {
        console.warn('Autoplay failed or was blocked:', err);
      });
      if (bgVideo) {
        bgVideo.play().catch(() => {});
      }
    } else {
      video.pause();
      video.currentTime = 0;
      if (bgVideo) {
        bgVideo.pause();
        bgVideo.currentTime = 0;
      }
    }
  }, [isActive]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Blurred Background Video */}
      <video
        ref={bgVideoRef}
        src={src}
        className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-75 scale-110 pointer-events-none"
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-black/25 dark:bg-black/45 backdrop-blur-md pointer-events-none" />

      {/* Main Foreground Video */}
      <video
        ref={videoRef}
        src={src}
        onLoadedMetadata={onLoadedMetadata}
        className="relative z-10 max-w-full max-h-full w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        muted
        loop
        playsInline
        preload="metadata"
      />
    </div>
  );
}

export default function MediaSlider() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [media, setMedia]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const fileInputRef = useRef(null);

  // Modal Gallery state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);

  // Dynamic aspect ratio tracking
  const [mediaOrientation, setMediaOrientation] = useState({});

  const handleImageLoad = (e, url) => {
    const { naturalWidth, naturalHeight } = e.target;
    const isPortrait = naturalHeight > naturalWidth;
    setMediaOrientation((prev) => ({ ...prev, [url]: isPortrait ? 'portrait' : 'landscape' }));
  };

  const handleVideoLoad = (e, url) => {
    const { videoWidth, videoHeight } = e.target;
    const isPortrait = videoHeight > videoWidth;
    setMediaOrientation((prev) => ({ ...prev, [url]: isPortrait ? 'portrait' : 'landscape' }));
    // Seek to 1s to show a real first frame instead of black
    try { e.target.currentTime = 1; } catch (_) { /* ignore seek errors */ }
  };

  // Unified fetch & normalize
  // Unified fetch & normalize using reportsApi.getMediaFeed
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await reportsApi.getMediaFeed({ page_size: 30 });
      const results = response.data?.results || response.data || [];
      const combined = results
        .map(item => {
          const url = item.url || item.file_url;
          const type = item.type || item.file_type;
          
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
            report_title: item.report_title || null,
            uploader: item.uploaded_by || item.uploaded_by_name || item.engineer_name || (isRTL ? 'المعرض العام' : 'Public Gallery'),
            date: item.created_at || item.uploaded_at,
            source: determinedSource,
            location_name: item.location_name || (determinedSource === 'gallery' ? (isRTL ? 'المعرض العام' : 'Public Gallery') : null)
          };
        })
        .filter(item => item.source !== 'announcement');

      setMedia(combined);
      setActiveIndex(0);
    } catch (err) {
      console.error('Error loading media feed:', err);
      toast.error(isRTL ? 'فشل تحميل معرض الوسائط' : 'Failed to load media gallery');
    } finally {
      setLoading(false);
    }
  }, [isRTL]);

  useEffect(() => {
    load();
  }, [load]);

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
        await load();
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

  const handleMediaClick = (idx) => {
    setModalInitialIndex(idx);
    setIsModalOpen(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(
      isRTL ? 'ar-EG' : 'en-GB',
      { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    );
  };

  const isEmpty = !loading && media.length === 0;

  return (
    <>
      <Card className="border-border/60 shadow-sm overflow-hidden bg-card flex flex-col h-[550px] rounded-3xl">
        {/* Header */}
        <CardHeader className="pb-3 px-5 pt-4 border-b border-border/40 shrink-0">
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Images className="w-4 h-4" />
              </div>
              {isRTL ? 'معرض الصور والوسائط' : 'Media Gallery & Feed'}
              {media.length > 0 && (
                <Badge variant="secondary" className="text-[10px] py-0 px-2 font-semibold">
                  {media.length}
                </Badge>
              )}
            </CardTitle>

            <div>
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleUpload}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs gap-1.5 font-semibold hover:border-purple-500/30 hover:text-purple-600 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <><Plus className="w-3.5 h-3.5" />{isRTL ? 'رفع للمعرض' : 'Upload'}</>
                }
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Body */}
        <CardContent className="p-0 flex-grow min-h-0 flex flex-col justify-center bg-zinc-50 dark:bg-zinc-950/20">
          {loading ? (
            <div className="p-5 space-y-4 w-full h-full flex flex-col justify-center">
              <div className="w-full flex-grow bg-muted/65 animate-pulse rounded-xl" />
              <div className="space-y-2 mt-4 shrink-0">
                <div className="h-4 bg-muted/65 animate-pulse rounded w-1/3" />
                <div className="h-3 bg-muted/65 animate-pulse rounded w-2/3" />
              </div>
            </div>

          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground p-8">
              <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center">
                <Images className="w-7 h-7 opacity-30" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">
                  {isRTL ? 'لا توجد وسائط متوفرة' : 'No media available'}
                </p>
                <p className="text-xs mt-1 opacity-60">
                  {isRTL ? 'ارفع صوراً أو فيديوهات للمشاركة في معرض المزرعة' : 'Upload photos or videos to showcase in the farm gallery'}
                </p>
              </div>
            </div>

          ) : (
            <div className="relative w-full h-full flex flex-col min-h-0 overflow-hidden">
              <div className="relative flex-grow min-h-0 w-full">
                <Swiper
                  modules={[Navigation, Pagination, Autoplay, Keyboard]}
                  spaceBetween={0}
                  slidesPerView={1}
                  navigation={{
                    prevEl: '.swiper-feed-prev',
                    nextEl: '.swiper-feed-next',
                  }}
                  pagination={{
                    el: '.swiper-feed-pagination',
                    clickable: true,
                    renderBullet: (index, className) => {
                      return `<span class="${className} w-2 h-2 mx-1 rounded-full inline-block cursor-pointer transition-all duration-300"></span>`;
                    }
                  }}
                  autoplay={{ delay: 5000, disableOnInteraction: true }}
                  keyboard={{ enabled: true }}
                  loop={media.length > 1}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  className="w-full h-full"
                  onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
                >
                  {media.map((item, idx) => {
                    const url = item.url || item.file_url;
                    const type = item.type || item.file_type;
                    const isPortrait = mediaOrientation[url] === 'portrait';
                    return (
                      <SwiperSlide key={item.id || idx} className="h-full flex flex-col bg-card">
                        {/* Premium Image/Video Container */}
                        <div
                          className="w-full flex-grow min-h-0 relative overflow-hidden bg-zinc-900 dark:bg-zinc-950 flex items-center justify-center cursor-pointer group"
                          onClick={() => handleMediaClick(idx)}
                        >
                          {/* Blurred Mirror Background for portrait or general look */}
                          {type !== 'VIDEO' && (
                            <>
                              <div
                                className="absolute inset-0 bg-cover bg-center blur-2xl opacity-75 scale-110 pointer-events-none transition-all duration-700 group-hover:scale-105"
                                style={{ backgroundImage: `url(${getAbsoluteFileUrl(url)})` }}
                              />
                              <div className="absolute inset-0 bg-black/10 dark:bg-black/35 backdrop-blur-md pointer-events-none" />
                            </>
                          )}

                          {type === 'VIDEO' ? (
                            <div className="relative w-full h-full flex items-center justify-center z-10">
                              <BannerVideoPlayer
                                src={getAbsoluteFileUrl(url)}
                                isActive={idx === activeIndex}
                                onLoadedMetadata={(e) => handleVideoLoad(e, url)}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors z-20">
                                <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-300">
                                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={getAbsoluteFileUrl(url)}
                              alt=""
                              onLoad={(e) => handleImageLoad(e, url)}
                              className="relative z-10 max-w-full max-h-full w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                              loading="lazy"
                            />
                          )}

                          {/* Top Shadow Gradient Overlay */}
                          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent z-15 pointer-events-none" />

                          {/* Bottom Shadow Gradient Overlay */}
                          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent z-15 pointer-events-none" />

                          {/* Floating Media Type Badge */}
                          <div className="absolute top-3.5 left-3.5 z-20">
                            <Badge className={cn(
                              'text-[10px] font-bold text-white border-0 shadow-md py-0.5 px-2.5',
                              type === 'IMAGE' ? 'bg-purple-600/90' : 'bg-rose-600/90'
                            )}>
                              {type === 'IMAGE'
                                ? (isRTL ? 'صورة' : 'Image')
                                : (isRTL ? 'فيديو' : 'Video')
                              }
                            </Badge>
                          </div>

                          {/* Zoom Icon Hover Indicator */}
                          <div className="absolute bottom-3.5 right-3.5 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/55 backdrop-blur-sm p-2 rounded-xl text-white pointer-events-none">
                            <ZoomIn className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Metadata Bottom Section */}
                        <div className="p-4 bg-card shrink-0 border-t border-border/40 flex flex-col gap-2 relative select-none">
                          {/* Title */}
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 line-clamp-1 leading-snug">
                              {item.report_title || (isRTL ? 'رفع يدوي للوسائط' : 'Manual Media Upload')}
                            </h4>
                          </div>

                          {/* Source and Location */}
                          <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-muted-foreground">
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

                          {/* Publisher & Date */}
                          <div className="border-t border-border/20 pt-2 flex items-center justify-between gap-3 text-[10px] text-muted-foreground font-bold">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-[9px] shrink-0">
                                {(item.uploader || 'E')[0].toUpperCase()}
                              </div>
                              <span className="truncate">
                                {isRTL ? 'بواسطة: ' : 'By: '}
                                <span className="text-foreground/90 font-extrabold">{item.uploader}</span>
                              </span>
                            </div>
                            <span className="shrink-0 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                              {formatDate(item.date)}
                            </span>
                          </div>
                        </div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>

                {/* Navigation Buttons inside feed */}
                {media.length > 1 && (
                  <>
                    <button className="swiper-feed-prev absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow">
                      <ChevronLeft className="w-4.5 h-4.5" />
                    </button>
                    <button className="swiper-feed-next absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow">
                      <ChevronRight className="w-4.5 h-4.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Feed Pagination / Dot Indicators */}
              {media.length > 1 && (
                <div className="shrink-0 flex items-center justify-center py-2 bg-card border-t border-border/20">
                  <div className="swiper-feed-pagination flex justify-center items-center"></div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox / swiper fullscreen modal */}
      <MediaGalleryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        media={media}
        initialIndex={modalInitialIndex}
        isRTL={isRTL}
      />
    </>
  );
}
