import { getPhotoUrl } from '../utils/photoUtils';
import { useNavigate, Link } from 'react-router-dom';

const categories = [
  { icon: '📚', name: 'Books' },
  { icon: '💻', name: 'Electronics' },
  { icon: '🔧', name: 'Gadgets' },
  { icon: '🚲', name: 'Transport' },
  { icon: '👕', name: 'Clothing' },
  { icon: '🔩', name: 'Project Tools' },
  { icon: '🏠', name: 'Hostel Essentials' },
];

const getCategoryIcon = (category) => {
  const cat = categories.find(c => c.name === category);
  return cat ? cat.icon : '📦';
};

const ItemCard = ({ item, currentUserId }) => {
  const navigate = useNavigate();
  const imageUrl = getPhotoUrl(item.image);

  const isOwner = currentUserId && item.ownerId?._id === currentUserId;

  return (
    <div className="card group cursor-pointer">
      <Link to={`/items/${item._id}`}>
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.itemName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl">{getCategoryIcon(item.category)}</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="badge bg-white text-slate-700 shadow-sm">
              {getCategoryIcon(item.category)} {item.category}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            {isOwner ? (
              <span className="badge bg-primary-600 text-white">Your Item</span>
            ) : item.availability ? (
              <span className="badge bg-emerald-500 text-white">Available</span>
            ) : (
              <span className="badge bg-slate-400 text-white">Unavailable</span>
            )}
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-slate-800 text-sm leading-tight mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {item.itemName}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.description}</p>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-primary-600">₹{item.pricePerDay}</span>
              <span className="text-xs text-slate-500"> /day</span>
            </div>
            {item.condition && (
              <span className="badge bg-slate-100 text-slate-600">{item.condition}</span>
            )}
          </div>

          {item.ownerId && (
            <div 
              className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 hover:opacity-80 transition-opacity relative z-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isOwner) navigate(`/user/${item.ownerId._id}`);
              }}
            >
              <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-accent-500 rounded-full flex items-center justify-center overflow-hidden">
                {item.ownerId?.profileImage ? (
                  <img src={getPhotoUrl(item.ownerId.profileImage)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xs font-bold">
                    {item.ownerId?.name?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {isOwner ? 'You' : (item.ownerId?.name || 'Anonymous')}
              </p>
            </div>
          )}

          {!isOwner && item.availability && (
            <div className="mt-3">
              <span className="block w-full text-center text-xs font-semibold py-2 rounded-lg bg-primary-50 text-primary-700 group-hover:bg-primary-100 transition-colors">
                View &amp; Rent →
              </span>
            </div>
          )}
          {isOwner && (
            <div className="mt-3">
              <span className="block w-full text-center text-xs font-semibold py-2 rounded-lg bg-slate-100 text-slate-500">
                Manage in My Listings
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ItemCard;
