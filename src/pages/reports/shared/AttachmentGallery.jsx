import React, { useEffect, useRef,useState } from 'react';
import { createPortal } from 'react-dom';

import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Download, Eye, FileText, Paperclip,Play, X, ZoomIn } from 'lucide-react';
import { Keyboard, Navigation, Zoom } from 'swiper/modules';
// Swiper for Lightbox
import { Swiper, SwiperSlide } from 'swiper/react';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { cn, getAbsoluteFileUrl } from '../../../lib/utils';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/zoom';

// Helper to determine file category
function getFileType(file) {
  if (typeof file === 'string') {
    const lower = file.toLowerCase();
    if (lower.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)$/) || lower.includes('image')) return 'IMAGE';
    if (lower.match(/\.(mp4|webm|ogg|mov|avi|wmv|flv)$/) || lower.includes('video')) return 'VIDEO';
    return 'FILE';
  }
  return file.type || file.file_type || 'FILE';
}

function getFileUrl(file) {
  const url = typeof file === 'string' ? file : file.url || file.file_url || '';
  return getAbsoluteFileUrl(url);
}

function getFileName(file) {
  if (typeof file === 'string') {
    const parts = file.split('/');
    return decodeURIComponent(parts[parts.length - 1] || 'Attachment');
  }
  return file.file_name || file.name || `attachment_${file.id || 'file'}`;
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

const AttachmentGallery = React.forwardRef(({ attachments = [], className = '' }, ref) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Normalize attachments to ensure we always have valid records
  const normalized = (attachments || [])
    .map((item, index) => {
      if (!item) return null;
      const url = getFileUrl(item);
      const type = getFileType(item);
      return {
        id: typeof item === 'object' ? item.id || index : index,
        url,
        type,
        file_url: url,
        file_type: type,
        name: getFileName(item),
        raw: item,
      };
    })
    .filter(item => item && item.url);

  React.useImperativeHandle(ref, () => ({
    open: (index = 0) => {
      if (normalized.length > 0) {
        setActiveIndex(index);
        setIsOpen(true);
      }
    },
    close: () => {
      setIsOpen(false);
    }
  }));

  if (normalized.length === 0) return null;

  const handleOpen = (index) => {
    setActiveIndex(index);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Grid Previews */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {normalized.map((item, index) => {
          const type = item.type;
          const url = item.url;

          return (
            <div
              key={item.id}
              className="group relative aspect-video sm:aspect-square rounded-xl overflow-hidden border border-border/50 bg-muted/30 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 select-none"
              onClick={() => handleOpen(index)}
            >
              {/* Media Previews */}
              {type === 'IMAGE' ? (
                <img
                  src={url}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/600x600/18181b/ffffff?text=Image+Load+Error';
                  }}
                />
              ) : type === 'VIDEO' ? (
                <div className="w-full h-full relative bg-zinc-950 flex items-center justify-center">
                  <video
                    src={url}
                    className="w-full h-full object-cover opacity-75"
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-muted/60 relative">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-2">
                    <FileText className="w-5.5 h-5.5" />
                  </div>
                  <span className="text-[11px] font-bold text-foreground line-clamp-2 px-1 max-w-full break-all">
                    {item.name}
                  </span>
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1.5 z-10">
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/40 text-white cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpen(index);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  onClick={(e) => e.stopPropagation()}
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title={isRTL ? 'تحميل الملف' : 'Download File'}
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>

              {/* Badges */}
              <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
                <Badge className={cn(
                  "text-[9px] py-0 px-1.5 border-0 font-bold text-white shadow-sm",
                  type === 'IMAGE' ? "bg-purple-600/90" : type === 'VIDEO' ? "bg-red-600/90" : "bg-zinc-600/90"
                )}>
                  {type === 'IMAGE' ? (isRTL ? 'صورة' : 'Image') : type === 'VIDEO' ? (isRTL ? 'فيديو' : 'Video') : (isRTL ? 'ملف' : 'Doc')}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox / Swiper Fullscreen Modal */}
      {isOpen && createPortal(
        <div 
          className="fixed inset-0 flex flex-col items-center justify-center bg-black animate-in fade-in duration-300 select-none"
          style={{ zIndex: 999999 }}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white border border-zinc-800 transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
            style={{ zIndex: 1000000 }}
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>
 
          {/* Download link for active item */}
          <a
            href={normalized[activeIndex]?.url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="absolute top-5 left-5 p-2.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white border border-zinc-800 transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            style={{ zIndex: 1000000 }}
            title={isRTL ? 'تحميل الملف' : 'Download File'}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{isRTL ? 'تحميل' : 'Download'}</span>
          </a>
 
          {/* Swiper slider gallery */}
          <div className="w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center px-4 relative">
            <Swiper
              modules={[Navigation, Keyboard, Zoom]}
              initialSlide={activeIndex}
              onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
              navigation={{
                prevEl: '.swiper-lightbox-prev',
                nextEl: '.swiper-lightbox-next',
              }}
              keyboard={{ enabled: true }}
              zoom={{ maxRatio: 3 }}
              loop={false}
              dir={isRTL ? 'rtl' : 'ltr'}
              className="w-full h-full"
            >
              {normalized.map((item, idx) => (
                <SwiperSlide key={item.id} className="flex flex-col items-center justify-center relative">

                  <div className="swiper-zoom-container flex flex-col items-center justify-center w-full h-full z-10">
                    {item.type === 'IMAGE' ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
                      />
                    ) : item.type === 'VIDEO' ? (
                      <SwiperVideoPlayer
                        src={item.url}
                        isActive={idx === activeIndex}
                      />
                    ) : (
                      <div className="w-96 max-w-full aspect-video flex flex-col items-center justify-center p-6 bg-zinc-900/80 rounded-2xl border border-zinc-850 text-center text-white">
                        <FileText className="w-16 h-16 text-purple-400 mb-4" />
                        <h4 className="font-extrabold text-sm md:text-base mb-2 truncate max-w-full">
                          {item.name}
                        </h4>
                        <p className="text-zinc-400 text-xs mb-5">
                          {isRTL ? 'مستند غير قابل للمعاينة المباشرة.' : 'Document format cannot be previewed directly.'}
                        </p>
                        <Button
                          asChild
                          className="bg-purple-600 hover:bg-purple-500 font-bold h-9 text-xs px-4 rounded-xl cursor-pointer"
                        >
                          <a href={item.url} target="_blank" rel="noopener noreferrer" download>
                            <Download className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                            {isRTL ? 'تنزيل المستند' : 'Download Document'}
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* File Name Header Overlay */}
                  <div className="mt-4 text-center max-w-xl px-4 z-10">
                    <p className="text-white font-extrabold text-sm truncate max-w-sm flex items-center gap-1.5 justify-center">
                      <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{item.name}</span>
                    </p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Custom Navigation buttons */}
          {normalized.length > 1 && (
            <>
              <button className="swiper-lightbox-prev absolute left-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-zinc-900/70 hover:bg-zinc-800 text-white flex items-center justify-center border border-zinc-800/80 transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button className="swiper-lightbox-next absolute right-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-zinc-900/70 hover:bg-zinc-800 text-white flex items-center justify-center border border-zinc-800/80 transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
});

export default AttachmentGallery;
