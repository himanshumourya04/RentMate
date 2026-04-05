import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRequestBanners } from '../services/api';
import { getPhotoUrl } from '../utils/photoUtils';

// Swiper React components & styles
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const BannerSlider = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data } = await getRequestBanners();
      setBanners(data);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
      // Suppress toast error so it doesn't interrupt the home page experience
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-48 md:h-64 bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center my-8">
        <span className="text-slate-400">Loading featured requests...</span>
      </div>
    );
  }

  if (banners.length === 0) {
    return null; // Don't show the slider if there are no active requests
  }

  return (
    <div className="my-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Trending Requests 🔥</h2>
        <Link to="/query-dashboard" className="text-sm font-medium text-primary-600 hover:text-primary-700">
          View All &rarr;
        </Link>
      </div>

      <div className="relative group">
        <Swiper
          modules={[Autoplay, Navigation]}
          spaceBetween={16}
          slidesPerView={1}
          navigation
          loop={banners.length > 2}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          breakpoints={{
            // Mobile (default is 1)
            640: { slidesPerView: 2 }, // Small tablets
            768: { slidesPerView: 3 }, // Tablets
            1024: { slidesPerView: 4 }, // Desktop
            1280: { slidesPerView: 5 }, // Large Desktop
          }}
          className="rounded-xl overflow-hidden shadow-sm"
        >
          {banners.map((req) => (
            <SwiperSlide key={req._id}>
              <div className="block relative w-full h-56 md:h-64 rounded-xl overflow-hidden group/card isolate">
                {/* Background Image */}
                <img
                  src={getPhotoUrl(req.image)}
                  alt={req.itemName}
                  onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=No+Image'; }}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                  loading="lazy"
                />

                {/* Dark Gradient Overlay for text readability */}
                <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>

                {/* Badges container */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 z-10 items-end">
                  {req.type === 'admin' && (
                    <div className="bg-amber-500/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1">
                      👑 Admin Announcement
                    </div>
                  )}
                  {req.isPinned && (
                    <div className="bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1">
                      📌 Featured
                    </div>
                  )}
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 text-white z-10">
                  <h3 className="text-lg font-bold leading-tight mb-1 line-clamp-2 shadow-black/50 drop-shadow-md">
                    {req.itemName}
                  </h3>
                  
                  {req.type === 'user' ? (
                    <div 
                      className="flex items-center gap-2 mt-2 opacity-90 cursor-pointer hover:opacity-100 transition-opacity w-fit relative z-30"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (req.userId?._id) navigate(`/user/${req.userId._id}`);
                      }}
                    >
                      <img 
                        src={getPhotoUrl(req.userId?.profileImage)} 
                        alt={req.userId?.name} 
                        onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=U&background=random'; }}
                        className="w-6 h-6 rounded-full object-cover border border-white/20"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium truncate max-w-[120px]">{req.userId?.name?.split(' ')[0]}</span>
                        <span className="text-[10px] text-slate-300">{req.duration}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 line-clamp-2 mt-1 opacity-90">{req.description}</p>
                  )}
                </div>

                {/* Interaction layer - Link only for user requests, or hover effect */}
                {user && req.type === 'user' ? (
                  <Link to={`/request/${req._id}`} className="absolute inset-0 z-20">
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    </div>
                  </Link>
                ) : (
                  <div className="absolute inset-0 z-20 bg-black/0 group-hover/card:bg-black/10 transition-colors duration-300"></div>
                )}

              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      
      {/* Custom CSS overrides for Swiper arrows to make them look sleek (Netflix style) */}
      <style dangerouslySetInnerHTML={{__html: `
        .swiper-button-next, .swiper-button-prev {
          color: white !important;
          background: rgba(0, 0, 0, 0.4);
          width: 40px !important;
          height: 100% !important;
          top: 0 !important;
          margin-top: 0 !important;
          backdrop-filter: blur(4px);
          transition: all 0.3s ease;
          opacity: 0;
        }
        .swiper-button-next:hover, .swiper-button-prev:hover {
          background: rgba(0, 0, 0, 0.7);
        }
        .swiper-button-prev { left: 0 !important; border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
        .swiper-button-next { right: 0 !important; border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
        .group:hover .swiper-button-next, .group:hover .swiper-button-prev { opacity: 1; }
        .swiper-button-next::after, .swiper-button-prev::after { font-size: 1.2rem !important; font-weight: bold; }
      `}} />
    </div>
  );
};

export default BannerSlider;
