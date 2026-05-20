import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Autoplay from 'embla-carousel-autoplay';
import { Images, Play, FileText, ExternalLink } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '../ui/carousel';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import api from '../../services/api';
import { cn } from '../../lib/utils';

export default function MediaSlider() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('reports/attachments/', { params: { file_type: 'IMAGE' } });
        const images = (res.data?.results || res.data || []).slice(0, 10);
        // Also fetch video
        const resV = await api.get('reports/attachments/', { params: { file_type: 'VIDEO' } });
        const videos = (resV.data?.results || resV.data || []).slice(0, 5);
        setMedia([...images, ...videos]);
      } catch {
        setMedia([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const plugin = React.useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));

  const isEmpty = !loading && media.length === 0;

  return (
    <Card className="border-border/60 overflow-hidden bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3 px-5 pt-5">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
          <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Images className="w-4 h-4" />
          </div>
          {isRTL ? 'مشاهد من التقارير اليومية' : 'Daily Reports Media'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {loading ? (
          <div className="h-48 rounded-xl bg-muted/40 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
          </div>
        ) : isEmpty ? (
          <div className="h-48 rounded-xl border-2 border-dashed border-border/60 bg-muted/20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center">
              <Images className="w-6 h-6 opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">{isRTL ? 'لا توجد وسائط مرفقة' : 'No media uploaded yet'}</p>
              <p className="text-xs mt-1 opacity-70">{isRTL ? 'ارفع صوراً أو فيديوهات في التقارير اليومية' : 'Upload images/videos in daily reports to see them here'}</p>
            </div>
          </div>
        ) : (
          <div className="relative px-8">
            <Carousel
              plugins={[plugin.current]}
              opts={{ align: 'start', loop: true }}
              className="w-full"
              onMouseEnter={plugin.current.stop}
              onMouseLeave={plugin.current.reset}
            >
              <CarouselContent>
                {media.map((item, idx) => (
                  <CarouselItem key={item.id || idx} className="basis-full sm:basis-1/2 lg:basis-full">
                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video group cursor-pointer"
                      onClick={() => window.open(item.file_url, '_blank')}
                    >
                      {item.file_type === 'IMAGE' ? (
                        <img
                          src={item.file_url}
                          alt={`Media ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      ) : item.file_type === 'VIDEO' ? (
                        <div className="w-full h-full flex items-center justify-center bg-muted/60">
                          <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                            <Play className="w-5 h-5 text-white fill-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted/30">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}

                      {/* Overlay */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Badge className={cn("text-[10px] py-0.5",
                          item.file_type === 'IMAGE' ? 'bg-purple-500/80' :
                          item.file_type === 'VIDEO' ? 'bg-red-500/80' : 'bg-blue-500/80'
                        )}>
                          {item.file_type === 'IMAGE' ? '🖼 صورة' : item.file_type === 'VIDEO' ? '🎬 فيديو' : '📄 ملف'}
                        </Badge>
                        <ExternalLink className="w-4 h-4 text-white/80" />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="border-border/60 bg-card/90 hover:bg-card text-foreground" />
              <CarouselNext className="border-border/60 bg-card/90 hover:bg-card text-foreground" />
            </Carousel>

            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5 mt-3">
              {media.slice(0, 8).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400/40" />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
