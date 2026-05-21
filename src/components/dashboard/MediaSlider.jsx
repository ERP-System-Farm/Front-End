import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Images, Play, Plus, Loader2, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import api from '../../services/api';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

// Swiper for Fullscreen Gallery Modal
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Keyboard, Zoom } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/zoom';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

async function uploadToCloudinary(file, resourceType = 'auto') {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  fd.append('folder', 'gallery');
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

// ─── Swiper Fullscreen Gallery Modal Component ───
function MediaGalleryModal({ isOpen, onClose, media, initialIndex, isRTL }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white transition-colors cursor-pointer"
        aria-label="Close modal"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Swiper slider gallery */}
      <div className="w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center px-4 relative select-none">
        <Swiper
          modules={[Navigation, Keyboard, Zoom]}
          initialSlide={initialIndex}
          navigation={{
            prevEl: '.swiper-modal-prev',
            nextEl: '.swiper-modal-next',
          }}
          keyboard={{ enabled: true }}
          zoom={{ maxRatio: 3 }}
          loop={media.length > 1}
          dir={isRTL ? 'rtl' : 'ltr'}
          className="w-full h-full"
        >
          {media.map((item, idx) => (
            <SwiperSlide key={idx} className="flex flex-col items-center justify-center">
              <div className="swiper-zoom-container flex flex-col items-center justify-center w-full h-full">
                {item.file_type === 'VIDEO' ? (
                  <video
                    src={item.file_url}
                    controls
                    autoPlay
                    className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
                  />
                ) : (
                  <img
                    src={item.file_url}
                    alt=""
                    className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
                  />
                )}
              </div>
              
              {/* Overlay / Info text */}
              <div className="mt-4 text-center max-w-xl px-4 z-10">
                {item.report_title && (
                  <h4 className="text-white font-extrabold text-sm md:text-base mb-1 leading-snug">
                    {item.report_title}
                  </h4>
                )}
                <p className="text-zinc-400 text-xs font-semibold flex items-center justify-center gap-2">
                  <span>{item.uploader}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                  <span>
                    {new Date(item.date).toLocaleDateString(
                      isRTL ? 'ar-EG' : 'en-GB',
                      { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                    )}
                  </span>
                </p>
              </div>
            </SwiperSlide>
          ))}
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

  // Embla Carousel hook
  const autoplayPlugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'center', direction: isRTL ? 'rtl' : 'ltr' },
    [autoplayPlugin.current]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => emblaApi.off('select', onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (emblaApi) emblaApi.reInit();
  }, [media, emblaApi]);

  // Unified fetch & normalize
  const load = useCallback(async () => {
    setLoading(true);
    const safeGet = async (url, params = {}) => {
      try {
        const res = await api.get(url, { params });
        return Array.isArray(res.data?.results) ? res.data.results
             : Array.isArray(res.data)          ? res.data
             : [];
      } catch (err) {
        console.error(`Error fetching ${url}:`, err);
        return [];
      }
    };

    const [
      attachImages, attachVideos,
      galleryImages, galleryVideos,
      harvestImages, harvestVideos
    ] = await Promise.all([
      safeGet('reports/attachments/', { file_type: 'IMAGE' }),
      safeGet('reports/attachments/', { file_type: 'VIDEO' }),
      safeGet('reports/gallery/',     { file_type: 'IMAGE' }),
      safeGet('reports/gallery/',     { file_type: 'VIDEO' }),
      safeGet('production/harvest-attachments/', { file_type: 'IMAGE' }),
      safeGet('production/harvest-attachments/', { file_type: 'VIDEO' }),
    ]);

    const combined = [
      ...galleryImages.map(item => ({
        ...item,
        report_title: null,
        uploader: item.uploaded_by_name || (isRTL ? 'المعرض العام' : 'Public Gallery'),
        date: item.uploaded_at || item.created_at
      })),
      ...galleryVideos.map(item => ({
        ...item,
        report_title: null,
        uploader: item.uploaded_by_name || (isRTL ? 'المعرض العام' : 'Public Gallery'),
        date: item.uploaded_at || item.created_at
      })),
      ...attachImages.map(item => ({
        ...item,
        report_title: item.report_title || (isRTL ? 'تقرير مهام يومي' : 'Daily Task Report'),
        uploader: item.engineer_name || (isRTL ? 'مهندس غير محدد' : 'Unknown Engineer'),
        date: item.uploaded_at || item.created_at
      })),
      ...attachVideos.map(item => ({
        ...item,
        report_title: item.report_title || (isRTL ? 'تقرير مهام يومي' : 'Daily Task Report'),
        uploader: item.engineer_name || (isRTL ? 'مهندس غير محدد' : 'Unknown Engineer'),
        date: item.uploaded_at || item.created_at
      })),
      ...harvestImages.map(item => ({
        ...item,
        report_title: item.report_title || (isRTL ? 'تقرير حصاد' : 'Harvest Report'),
        uploader: item.engineer_name || (isRTL ? 'مشرف غير محدد' : 'Unknown Supervisor'),
        date: item.uploaded_at || item.created_at
      })),
      ...harvestVideos.map(item => ({
        ...item,
        report_title: item.report_title || (isRTL ? 'تقرير حصاد' : 'Harvest Report'),
        uploader: item.engineer_name || (isRTL ? 'مشرف غير محدد' : 'Unknown Supervisor'),
        date: item.uploaded_at || item.created_at
      }))
    ]
      .filter(item => item?.file_url)
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 30);

    setMedia(combined);
    setActiveIndex(0);
    setLoading(false);
  }, [isRTL]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      toast.error(isRTL ? 'يرجى إعداد Cloudinary في ملف .env أولاً' : 'Configure Cloudinary in .env first');
      return;
    }
    setUploading(true);
    try {
      const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
      const cldRes = await uploadToCloudinary(file, resourceType);
      const fileTypeEnum = cldRes.type === 'video' ? 'VIDEO' : 'IMAGE';
      await api.post('reports/gallery/', { file_url: cldRes.url, file_type: fileTypeEnum });
      toast.success(isRTL ? 'تم الرفع بنجاح ✓' : 'Uploaded successfully ✓');
      await load();
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? 'فشل الرفع' : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const scrollTo = useCallback((idx) => emblaApi?.scrollTo(idx), [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

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
      <Card className="border-border/60 shadow-sm overflow-hidden bg-card flex flex-col h-full rounded-2xl">
        {/* Header */}
        <CardHeader className="pb-3 px-5 pt-4 border-b border-border/40 shrink-0">
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Images className="w-4 h-4" />
              </div>
              {isRTL ? 'معرض الصور والوسائط' : 'Media Gallery & Feed'}
              {media.length > 0 && (
                <span className="text-[10px] font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {media.length}
                </span>
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
        <CardContent className="p-0 flex-1 flex flex-col justify-center min-h-[300px]">
          {loading ? (
            <div className="p-5 space-y-4 w-full">
              <div className="w-full h-48 bg-muted/65 animate-pulse rounded-xl" />
              <div className="space-y-2">
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
            <div className="relative w-full h-full flex flex-col">
              {/* Embla viewport */}
              <div ref={emblaRef} className="overflow-hidden flex-1 w-full">
                <div className="flex">
                  {media.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="relative flex-none w-full select-none"
                      style={{ minWidth: '100%' }}
                    >
                      {/* Media Card */}
                      <div className="flex flex-col h-full bg-card group relative">
                        {/* Premium Image/Video Container with Blur Reflection */}
                        <div
                          className="w-full h-64 relative overflow-hidden bg-zinc-950 flex items-center justify-center cursor-pointer"
                          onClick={() => handleMediaClick(idx)}
                        >
                          {/* Blurred Mirror Background for aspect ratio protection */}
                          <div
                            className="absolute inset-0 bg-cover bg-center blur-md opacity-35 scale-110 pointer-events-none"
                            style={{ backgroundImage: `url(${item.file_url})` }}
                          />

                          {item.file_type === 'VIDEO' ? (
                            <>
                              <video
                                src={item.file_url}
                                className="relative max-w-full max-h-full object-contain z-10"
                                muted
                                preload="metadata"
                              />
                              <div className="absolute inset-0 flex items-center justify-center z-20">
                                <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-300">
                                  <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <img
                              src={item.file_url}
                              alt=""
                              className="relative max-w-full max-h-full object-contain z-10 transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                              loading="lazy"
                            />
                          )}

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-15 pointer-events-none" />

                          {/* Floating Media Type Badge */}
                          <div className="absolute top-3 left-3 z-20">
                            <Badge className={cn(
                              'text-[10px] py-0.5 px-2 border-0 shadow-md font-bold text-white',
                              item.file_type === 'IMAGE' ? 'bg-purple-600/90' : 'bg-red-600/90'
                            )}>
                              {item.file_type === 'IMAGE' ? (isRTL ? '🖼 صورة' : '🖼 Image') : (isRTL ? '🎬 فيديو' : '🎬 Video')}
                            </Badge>
                          </div>

                          {/* Zoom Icon Hover Indicator */}
                          <div className="absolute bottom-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 p-1.5 rounded-lg text-white pointer-events-none">
                            <ZoomIn className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Metadata Section */}
                        <div className="p-4 border-t border-border/40 bg-card/60 backdrop-blur-sm flex-1 flex flex-col justify-between gap-2.5">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                                {(item.uploader || 'U')[0].toUpperCase()}
                              </div>
                              <span className="text-xs font-bold text-foreground truncate">
                                {item.uploader}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {formatDate(item.date)}
                            </span>
                          </div>

                          {item.report_title && (
                            <p className="text-xs font-semibold text-muted-foreground line-clamp-1 border-t border-border/20 pt-2">
                              {item.report_title}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prev / Next Arrows */}
              {media.length > 1 && (
                <>
                  <button
                    onClick={scrollPrev}
                    className="absolute left-3 top-[128px] -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/55 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 hover:scale-105 transition-all shadow-md cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={scrollNext}
                    className="absolute right-3 top-[128px] -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/55 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 hover:scale-105 transition-all shadow-md cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Dot Indicators */}
              {media.length > 1 && (
                <div className="flex justify-center gap-1 pb-3 shrink-0">
                  {media.slice(0, 10).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => scrollTo(i)}
                      className={cn(
                        'rounded-full transition-all duration-300 cursor-pointer',
                        i === activeIndex
                          ? 'w-4 h-1.5 bg-purple-600'
                          : 'w-1.5 h-1.5 bg-purple-300/40 hover:bg-purple-400/60'
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
