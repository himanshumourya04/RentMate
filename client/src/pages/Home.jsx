import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getItems } from '../services/api';
import ItemCard from '../components/ItemCard';
import BannerSlider from '../components/BannerSlider';

const CATEGORIES = [
  { icon: '📚', name: 'Books', color: 'from-amber-400 to-orange-500' },
  { icon: '💻', name: 'Electronics', color: 'from-blue-400 to-primary-600' },
  { icon: '🔧', name: 'Gadgets', color: 'from-purple-400 to-accent-600' },
  { icon: '🚲', name: 'Transport', color: 'from-emerald-400 to-teal-600' },
  { icon: '👕', name: 'Clothing', color: 'from-pink-400 to-rose-500' },
  { icon: '🔩', name: 'Project Tools', color: 'from-slate-400 to-slate-600' },
  { icon: '🏠', name: 'Hostel Essentials', color: 'from-yellow-400 to-amber-500' },
];

const STATS = [
  { value: '500+', label: 'Items Listed', icon: '📦' },
  { value: '200+', label: 'Active Students', icon: '🎓' },
  { value: '95%', label: 'Satisfaction Rate', icon: '⭐' },
  { value: '50+', label: 'Colleges', icon: '🏛️' },
];

const Home = () => {
  const [featuredItems, setFeaturedItems] = useState([]);

  useEffect(() => {
    getItems({}).then(res => setFeaturedItems(res.data.slice(0, 4))).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></span>
              Student Rental Platform — Trusted by College Communities
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-5">
              Rent Anything.<br />
              Lend with Trust.<br />
              <span className="text-primary-200">Save More Together.</span>
            </h1>
            <p className="text-lg text-primary-100 mb-8 max-w-xl">
              RentMate connects students to rent and lend items within their college community. From textbooks to bicycles — find what you need without spending a fortune.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/browse" className="bg-white text-primary-700 hover:bg-primary-50 font-semibold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl">
                🔍 Browse Items
              </Link>
              <Link to="/signup" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold px-6 py-3 rounded-xl border border-white/30 transition-all">
                🚀 Get Started Free
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -right-10 bottom-0 w-64 h-64 bg-accent-500/20 rounded-full blur-2xl" />
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-extrabold text-primary-600">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Browse by Category</h2>
          <p className="text-slate-500">Find exactly what you need from our curated categories</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              to={`/browse?category=${cat.name}`}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-100 bg-white hover:shadow-md transition-all hover:-translate-y-1 group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                {cat.icon}
              </div>
              <span className="text-xs font-medium text-slate-700 text-center">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Query Dashboard Carousel Sidebar / Middle Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BannerSlider />
      </section>

      {/* Featured Items */}
      {featuredItems.length > 0 && (
        <section className="bg-slate-50 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-800 mb-1">Recently Listed</h2>
                <p className="text-slate-500">Hot items added by your fellow students</p>
              </div>
              <Link to="/browse" className="btn-secondary text-sm hidden sm:block">View All →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredItems.map(item => <ItemCard key={item._id} item={item} />)}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">How RentMate Works</h2>
          <p className="text-slate-500">Simple, safe, and student-verified rental process</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { id: 1, icon: '📝', title: 'Register', desc: 'Create your student account in under a minute' },
            { id: 2, icon: '🔍', title: 'Browse & Request', desc: 'Find items and send a rental request' },
            { id: 3, icon: '✅', title: 'Management Verifies', desc: 'The management team verifies the request for trust' },
            { id: 4, icon: '🎉', title: 'Start Renting', desc: 'Booking approved — pick up your item!' },
          ].map((item) => (
            <div 
              key={item.id} 
              className="relative text-center p-6 rounded-2xl border transition-all hover:shadow-md bg-primary-600 border-primary-600 text-white shadow-lg hover:shadow-primary-200"
            >
              <div className="text-4xl mt-3 mb-3">{item.icon}</div>
              <h3 className="font-bold mb-1 text-white">
                {item.title}
              </h3>
              <p className="text-sm text-primary-100">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-primary-600 to-accent-600 text-white py-16">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-extrabold mb-4">Ready to Join the Community?</h2>
          <p className="text-primary-100 mb-8">Sign up for free and start renting or lending items within your campus today.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/signup" className="bg-white text-primary-700 font-semibold px-8 py-3 rounded-xl hover:bg-primary-50 transition-all shadow-lg">
              Create Account Free
            </Link>
            <Link to="/browse" className="border border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-all">
              Browse First
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
