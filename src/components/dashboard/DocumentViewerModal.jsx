import React, { useState, useEffect } from 'react';
import {
  X, ZoomIn, ZoomOut, RotateCw, Download, Printer,
  FileText, Loader2, Maximize2, Minimize2, Eye
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export default function DocumentViewerModal({ isOpen, onClose, fileUrl, fileName, fileType }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [textContent, setTextContent] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setZoom(1);
    setRotation(0);
    setIsFullscreen(false);
    setLoading(true);
    setError(false);
    setTextContent('');

    // If it's a text file, fetch its contents
    if (fileType === 'TEXT' || (fileName && fileName.endsWith('.txt')) || (fileUrl && fileUrl.endsWith('.txt'))) {
      fetchText();
    } else {
      setLoading(false);
    }
  }, [isOpen, fileUrl, fileType, fileName]);

  const fetchText = async () => {
    try {
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error('Failed to fetch text content');
      const text = await res.text();
      setTextContent(text);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const handleRotate = () => setRotation(r => (r + 90) % 360);
  const handleFullscreen = () => setIsFullscreen(f => !f);

  const handlePrint = () => {
    const printWindow = window.open(fileUrl, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      }, true);
    } else {
      toast.error(isRTL ? 'يرجى السماح بالنوافذ المنبثقة للطباعة' : 'Please allow popups to print');
    }
  };

  const determinedType = fileType || (
    fileUrl?.match(/\.(jpeg|jpg|gif|png|webp)/i) ? 'IMAGE' :
    fileUrl?.match(/\.(mp4|webm|ogg)/i) ? 'VIDEO' :
    fileUrl?.match(/\.pdf/i) ? 'PDF' :
    fileUrl?.match(/\.txt/i) ? 'TEXT' : 'FILE'
  );

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center bg-black/95 transition-all duration-300 ${isFullscreen ? 'p-0' : 'p-4 md:p-6'}`}
      style={{ zIndex: 999999 }}
    >
      {/* Modal Container */}
      <div className={`relative flex flex-col bg-zinc-950 text-zinc-100 border border-zinc-800 shadow-2xl h-full w-full max-w-6xl transition-all duration-300 overflow-hidden ${isFullscreen ? 'rounded-none' : 'rounded-3xl'}`}>
        
        {/* Header Control Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shrink-0 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm truncate max-w-[250px] md:max-w-[400px] text-zinc-200" title={fileName || fileUrl}>
                {fileName || (fileUrl ? fileUrl.split('/').pop() : 'مرفق')}
              </h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5 tracking-wider">
                {determinedType} {isRTL ? 'معاينة داخل التطبيق' : 'In-App Preview'}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 md:gap-2.5">
            {determinedType === 'IMAGE' && (
              <>
                <button onClick={handleZoomOut} disabled={zoom <= 0.5} className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition-colors" title={isRTL ? 'تصغير' : 'Zoom Out'}>
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-black min-w-[36px] text-center select-none text-zinc-400">
                  {Math.round(zoom * 100)}%
                </span>
                <button onClick={handleZoomIn} disabled={zoom >= 3} className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition-colors" title={isRTL ? 'تكبير' : 'Zoom In'}>
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button onClick={handleRotate} className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-300 transition-colors" title={isRTL ? 'تدوير 90°' : 'Rotate 90°'}>
                  <RotateCw className="w-4 h-4" />
                </button>
              </>
            )}

            {(determinedType === 'IMAGE' || determinedType === 'PDF') && (
              <button onClick={handlePrint} className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-300 transition-colors" title={isRTL ? 'طباعة' : 'Print'}>
                <Printer className="w-4 h-4" />
              </button>
            )}

            <a href={fileUrl} download={fileName} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-300 transition-colors flex items-center justify-center" title={isRTL ? 'تنزيل' : 'Download'}>
              <Download className="w-4 h-4" />
            </a>

            <button onClick={handleFullscreen} className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-300 transition-colors" title={isFullscreen ? (isRTL ? 'إلغاء ملء الشاشة' : 'Exit Fullscreen') : (isRTL ? 'ملء الشاشة' : 'Fullscreen')}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <div className="h-6 w-[1px] bg-zinc-800 mx-1 shrink-0" />

            <button onClick={onClose} className="p-2 rounded-xl bg-red-950/40 text-red-400 border border-red-500/10 hover:bg-red-900/60 hover:text-red-200 transition-colors shrink-0" title={isRTL ? 'إغلاق' : 'Close'}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Preview Container */}
        <div className="flex-1 overflow-auto bg-zinc-900/40 relative flex items-center justify-center p-4">
          
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/80 z-20">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
              <p className="text-xs text-zinc-400 font-bold">{isRTL ? 'جاري تحميل المعاينة...' : 'Loading preview...'}</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 text-center py-12 max-w-sm">
              <div className="w-14 h-14 rounded-2xl bg-red-950/20 text-red-500 border border-red-500/10 flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7" />
              </div>
              <p className="font-extrabold text-sm">{isRTL ? 'عذرًا، تعذر تحميل الملف' : 'Unable to load file'}</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{isRTL ? 'قد يكون الرابط غير متاح أو تالف. يمكنك تنزيل الملف مباشرة.' : 'The file link might be broken or inaccessible. You can download the file directly.'}</p>
              <a href={fileUrl} download={fileName} className="mt-2 px-5 py-2 rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-xs font-bold transition-all flex items-center gap-2">
                <Download className="w-4 h-4" />
                {isRTL ? 'تحميل الملف مباشرة' : 'Download File Directly'}
              </a>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* IMAGE PREVIEW */}
              {determinedType === 'IMAGE' && (
                <div 
                  className="flex items-center justify-center transition-all duration-300"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                >
                  <img
                    src={fileUrl}
                    alt={fileName || 'Preview'}
                    className="max-h-[70vh] object-contain rounded-lg border border-zinc-800/40 shadow-xl select-none pointer-events-none"
                    onLoad={() => setLoading(false)}
                    onError={() => setError(true)}
                  />
                </div>
              )}

              {/* VIDEO PREVIEW */}
              {determinedType === 'VIDEO' && (
                <video
                  src={fileUrl}
                  controls
                  autoPlay
                  className="max-w-full max-h-[70vh] rounded-2xl border border-zinc-800/40 shadow-2xl bg-black"
                  onError={() => setError(true)}
                />
              )}

              {/* PDF PREVIEW */}
              {determinedType === 'PDF' && (
                <iframe
                  src={`${fileUrl}#toolbar=0&navpanes=0`}
                  title={fileName || 'PDF Document'}
                  className="w-full h-full min-h-[65vh] border-0 rounded-2xl bg-zinc-950"
                  onError={() => setError(true)}
                  onLoad={() => setLoading(false)}
                />
              )}

              {/* TEXT PREVIEW */}
              {determinedType === 'TEXT' && (
                <div className="w-full h-full max-w-4xl bg-zinc-950 border border-zinc-800/60 rounded-2xl p-5 overflow-auto text-left font-mono text-xs leading-relaxed select-text text-zinc-300 whitespace-pre-wrap">
                  {textContent}
                </div>
              )}

              {/* OTHER / GENERAL FILES */}
              {determinedType === 'FILE' && (
                <div className="flex flex-col items-center gap-5 text-center py-10 max-w-md bg-zinc-900/30 border border-zinc-800/40 rounded-3xl p-8 shadow-xl">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 text-green-400 border border-green-500/20 flex items-center justify-center shadow-lg">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-black text-base text-zinc-100">{isRTL ? 'معاينة غير متوفرة لهذا النوع من الملفات' : 'No in-app preview for this file type'}</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {isRTL 
                        ? 'هذا المستند (Word، Excel، أو غيره) لا يدعم العرض المباشر على المتصفح. يرجى تنزيل الملف لمراجعته.'
                        : 'This document type (Word, Excel, etc.) cannot be previewed natively in the browser. Please download it.'}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5 w-full pt-2">
                    <a href={fileUrl} download={fileName} className="flex-1 px-5 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/15">
                      <Download className="w-4 h-4" />
                      {isRTL ? 'تنزيل الملف' : 'Download File'}
                    </a>
                    {fileUrl && (
                      <a href={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`} target="_blank" rel="noreferrer" className="flex-1 px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 font-bold text-xs transition-all flex items-center justify-center gap-2">
                        <Eye className="w-4 h-4" />
                        {isRTL ? 'معاينة Office Online' : 'Office View'}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
