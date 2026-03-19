import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">R</span>
              </div>
              <span className="text-lg font-bold text-white">Rent<span className="text-primary-400">Mate</span></span>
            </div>
            <p className="text-sm text-slate-400">
              A trusted student rental platform for college communities. Rent, lend, and borrow with confidence.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-primary-400 transition-colors">Home</Link></li>
              <li><Link to="/browse" className="hover:text-primary-400 transition-colors">Browse Items</Link></li>
              <li><Link to="/signup" className="hover:text-primary-400 transition-colors">Register</Link></li>
              <li><Link to="/login" className="hover:text-primary-400 transition-colors">Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Categories</h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {['Books', 'Electronics', 'Gadgets', 'Transport', 'Clothing', 'Project Tools'].map(cat => (
                <Link key={cat} to={`/browse?category=${cat}`} className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-md transition-colors">
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} RentMate. Built for student communities with ❤️
        </div>
      </div>
    </footer>
  );
};

export default Footer;
