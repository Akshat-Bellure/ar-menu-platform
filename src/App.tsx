import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, X, ChefHat, Leaf, Info, Filter, ScanLine, Move3d, 
  Sparkles, Flame, ArrowRight, ShoppingBag, Plus, Minus, 
  Trash2, QrCode, Camera, CheckCircle, Smartphone, Box, 
  Maximize2, Rotate3d, Layers, Edit3, Save, Image as ImageIcon,
  Store, LogOut, PlusCircle, ChevronRight, Share2, Video, Play, Pause, Lock
} from 'lucide-react';

/**
 * ==============================================================================
 * 1. DATA & TYPES
 * ==============================================================================
 */

export interface Dish {
  id: string;
  name: string;
  price: number;
  category: string;
  isVeg: boolean;
  tags: string[];
  imageUrl: string;
  videoUrl?: string; 
  description: string;
  ingredients: string[];
  calories: number;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  themeColor: string;
  logoUrl: string;
  menu: Dish[];
}

export interface CartItem extends Dish {
  quantity: number;
}

// --- Initial Mock Data ---
const INITIAL_RESTAURANTS: Restaurant[] = [
  {
    id: "rest-paradise",
    name: "Paradise Biryani",
    cuisine: "Hyderabadi",
    themeColor: "orange",
    logoUrl: "",
    menu: [
      {
        id: "chicken-biryani",
        name: "Chicken Biryani",
        price: 210,
        category: "Biryanis",
        isVeg: false,
        tags: ["Bestseller", "Spicy"],
        imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
        videoUrl: "https://cdn.coverr.co/videos/coverr-steaming-hot-asian-food-2633/1080p.mp4", 
        description: "Legendary Paradise Chicken Biryani with saffron and ghee.",
        ingredients: ["Basmati Rice", "Chicken", "Saffron", "Spices"],
        calories: 850
      },
      {
        id: "veg-biryani",
        name: "Veg. Biryani",
        price: 154,
        category: "Biryanis",
        isVeg: true,
        tags: ["Vegetarian", "Flavorful"],
        imageUrl: "https://images.unsplash.com/photo-1642821373181-696a54913e93?auto=format&fit=crop&w=800&q=80",
        description: "Fresh vegetable medley cooked with aromatic Basmati rice.",
        ingredients: ["Basmati Rice", "Carrots", "Beans", "Spices"],
        calories: 600
      }
    ]
  },
  {
    id: "rest-burger-king",
    name: "Burger Hub",
    cuisine: "American",
    themeColor: "red",
    logoUrl: "",
    menu: [
      {
        id: "smash-burger",
        name: "Double Smash",
        price: 12.99,
        category: "Burgers",
        isVeg: false,
        tags: ["Juicy", "Cheesy"],
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
        description: "Double patty smashed to perfection.",
        ingredients: ["Beef", "Cheese", "Bun", "Pickles"],
        calories: 950
      }
    ]
  }
];

/**
 * ==============================================================================
 * 2. UTILITIES & HOOKS
 * ==============================================================================
 */

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return isMobile;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * ==============================================================================
 * 3. SHARED UI COMPONENTS
 * ==============================================================================
 */

const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon }: any) => {
  const baseStyle = "px-4 py-2 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg hover:shadow-orange-500/20",
    secondary: "bg-white/10 hover:bg-white/20 text-white border border-white/10",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20",
    ghost: "hover:bg-white/5 text-slate-400 hover:text-white"
  };
  
  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const Input = ({ label, ...props }: any) => (
  <div className="space-y-1">
    {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>}
    <input 
      className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500 focus:bg-slate-800 transition-all"
      {...props} 
    />
  </div>
);

/**
 * ==============================================================================
 * 4. REAL CAMERA AR COMPONENTS
 * ==============================================================================
 */

const RealARViewer = ({ dish, onClose }: { dish: Dish, onClose: () => void }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [rotation, setRotation] = useState({ x: 20, y: 0 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera Error:", err);
      setError("Camera access denied. Switching to simulation mode.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const handleStart = (x: number, y: number) => { setIsDragging(true); lastPos.current = { x, y }; };
  
  const handleMove = (x: number, y: number) => {
    if (!isDragging) return;
    const deltaX = x - lastPos.current.x;
    const deltaY = y - lastPos.current.y;
    setRotation(prev => ({ 
      x: Math.max(0, Math.min(60, prev.x - deltaY * 0.5)), 
      y: prev.y + deltaX * 0.8 
    }));
    lastPos.current = { x, y };
  };

  const handleEnd = () => setIsDragging(false);
  const layers = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="fixed inset-0 z-[110] bg-black overflow-hidden touch-none">
      <div className="absolute inset-0 pointer-events-none">
        {cameraActive ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-50 blur-sm" />
        )}
      </div>
      
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50">
        <div className="flex flex-col items-start gap-2">
          <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 text-white shadow-xl">
             <Camera size={16} className={`text-${cameraActive ? 'green' : 'orange'}-500 animate-pulse`} />
             <span className="text-xs font-bold tracking-wider">{cameraActive ? 'AR CAMERA ACTIVE' : 'SIMULATION MODE'}</span>
          </div>
          {error && <span className="text-[10px] text-red-400 bg-black/80 px-2 py-1 rounded">{error}</span>}
        </div>
        <button onClick={onClose} className="bg-black/60 backdrop-blur-md p-3 rounded-full border border-white/10 text-white hover:bg-red-500/20 transition-colors shadow-xl">
          <X size={24} />
        </button>
      </div>

      <div 
        className="w-full h-full flex items-center justify-center perspective-1000 cursor-grab active:cursor-grabbing relative z-10"
        onMouseDown={e => handleStart(e.clientX, e.clientY)}
        onMouseMove={e => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={e => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={e => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handleEnd}
      >
        <div className="relative w-64 h-64 md:w-96 md:h-96 transition-transform duration-75" style={{ transformStyle: 'preserve-3d', transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${scale}) translate(${position.x}px, ${position.y}px)` }}>
          {layers.map((i) => (
            <div key={i} className="absolute inset-0 rounded-full bg-transparent" style={{ transform: `translateZ(-${i * 2}px)`, backfaceVisibility: 'visible', filter: `brightness(${1 - i * 0.05})` }}>
              {dish.videoUrl ? (
                <video src={dish.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover rounded-full" />
              ) : (
                <img src={dish.imageUrl} alt="Dish Layer" className="w-full h-full object-cover rounded-full" />
              )}
            </div>
          ))}
          <div className="absolute top-1/2 left-1/2 w-[120%] h-[120%] bg-black/60 blur-xl rounded-full -translate-x-1/2 -translate-y-1/2" style={{ transform: `translateZ(-60px) rotateX(90deg) scale(1.2)`, pointerEvents: 'none' }} />
        </div>
      </div>

      <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
        <div className="inline-flex flex-col items-center gap-2 animate-bounce">
          <Move3d size={32} className="text-white/80" />
          <p className="text-white/80 text-sm font-medium tracking-widest bg-black/40 backdrop-blur px-4 py-1 rounded-full border border-white/10">DRAG TO ROTATE • PINCH TO SCALE</p>
        </div>
      </div>

      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/10 pointer-events-auto">
         <button onClick={() => setScale(s => Math.min(s + 0.1, 2))} className="p-2 text-white hover:text-orange-400"><Plus size={20} /></button>
         <button onClick={() => setScale(1)} className="p-2 text-white/50 hover:text-white text-xs font-mono">1x</button>
         <button onClick={() => setScale(s => Math.max(s - 0.1, 0.5))} className="p-2 text-white hover:text-orange-400"><Minus size={20} /></button>
      </div>
    </div>
  );
};

/**
 * ==============================================================================
 * 5. ADMIN COMPONENTS
 * ==============================================================================
 */

const RestaurantCard = ({ restaurant, onManage, onGenerateQR }: { restaurant: Restaurant, onManage: () => void, onGenerateQR: () => void }) => (
  <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 hover:border-orange-500/50 transition-all group">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${restaurant.themeColor}-500 to-slate-700 flex items-center justify-center text-white font-bold text-xl`}>
           {restaurant.name.charAt(0)}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">{restaurant.name}</h3>
          <p className="text-xs text-slate-400 uppercase tracking-wider">{restaurant.cuisine} • {restaurant.menu.length} Items</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onGenerateQR} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-orange-400 transition-colors" title="Get QR Code">
          <QrCode size={20} />
        </button>
      </div>
    </div>
    <Button onClick={onManage} variant="secondary" className="w-full" icon={Edit3}>
      Manage Menu
    </Button>
  </div>
);

const DishEditor = ({ dish, onSave, onCancel }: { dish?: Partial<Dish>, onSave: (d: Dish) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState<Partial<Dish>>(dish || {
    id: generateId(),
    name: "",
    price: 0,
    category: "Main",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
    videoUrl: "", 
    description: "",
    ingredients: [],
    tags: [],
    isVeg: true,
    calories: 0
  });

  return (
    <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 space-y-4 animate-in slide-in-from-bottom-10">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-white">{dish ? 'Edit Dish' : 'Add New Dish'}</h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-white"><X size={20} /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Dish Name" value={formData.name} onChange={(e:any) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Truffle Pasta" />
        <Input label="Price" type="number" value={formData.price} onChange={(e:any) => setFormData({...formData, price: Number(e.target.value)})} />
        <Input label="Category" value={formData.category} onChange={(e:any) => setFormData({...formData, category: e.target.value})} placeholder="e.g. Starters" />
        <Input label="Image URL" value={formData.imageUrl} onChange={(e:any) => setFormData({...formData, imageUrl: e.target.value})} />
      </div>
      <Input label="Video URL (Optional - For AR)" value={formData.videoUrl} onChange={(e:any) => setFormData({...formData, videoUrl: e.target.value})} placeholder="https://example.com/video.mp4" />
      <Input label="Description" value={formData.description} onChange={(e:any) => setFormData({...formData, description: e.target.value})} />
      <div className="flex gap-3 pt-2">
        <Button onClick={() => onSave(formData as Dish)} className="flex-1" icon={Save}>Save Dish</Button>
        <Button onClick={onCancel} variant="ghost">Cancel</Button>
      </div>
    </div>
  );
};

const AdminDashboard = ({ restaurants, onUpdateRestaurants, onPreview }: { restaurants: Restaurant[], onUpdateRestaurants: (r: Restaurant[]) => void, onPreview: (id: string) => void }) => {
  const [view, setView] = useState<'list' | 'details'>('list');
  const [activeRestId, setActiveRestId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [editingDish, setEditingDish] = useState<boolean>(false);

  const activeRestaurant = restaurants.find(r => r.id === activeRestId);

  const handleAddRestaurant = () => {
    const newRest: Restaurant = {
      id: `rest-${generateId()}`,
      name: "New Restaurant",
      cuisine: "General",
      themeColor: "orange",
      logoUrl: "",
      menu: []
    };
    onUpdateRestaurants([...restaurants, newRest]);
    setActiveRestId(newRest.id);
    setView('details');
  };

  const handleAddDish = (dish: Dish) => {
    if (!activeRestaurant) return;
    const updatedRest = { ...activeRestaurant, menu: [...activeRestaurant.menu, dish] };
    onUpdateRestaurants(restaurants.map(r => r.id === activeRestaurant.id ? updatedRest : r));
    setEditingDish(false);
  };

  if (showQR) {
    const r = restaurants.find(r => r.id === showQR);
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-8 animate-in zoom-in-95">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-white">{r?.name}</h2>
          <p className="text-slate-400">Scan to view 360° AR Menu</p>
        </div>
        <div className="p-8 bg-white rounded-3xl shadow-[0_0_60px_rgba(249,115,22,0.3)] relative overflow-hidden">
           <QrCode size={200} className="text-slate-900" />
           <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent pointer-events-none" />
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setShowQR(null)} variant="secondary">Close</Button>
          <Button onClick={() => onPreview(r!.id)} icon={Smartphone}>Simulate Scan</Button>
        </div>
      </div>
    );
  }

  if (view === 'details' && activeRestaurant) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setView('list')} className="p-2 bg-white/5 rounded-full text-white hover:bg-white/10"><ArrowRight className="rotate-180" /></button>
          <div>
            <h2 className="text-2xl font-bold text-white">{activeRestaurant.name}</h2>
            <p className="text-slate-400">Menu Management</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="p-4 bg-slate-900 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center gap-2">
              <span className="text-3xl font-bold text-white">{activeRestaurant.menu.length}</span>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Total Dishes</span>
           </div>
           <Button variant="secondary" className="h-full flex-col gap-2" onClick={() => setShowQR(activeRestaurant.id)}>
              <QrCode size={24} /> <span className="text-sm">View QR Code</span>
           </Button>
           <Button className="h-full flex-col gap-2" onClick={() => setEditingDish(true)}>
              <PlusCircle size={24} /> <span className="text-sm">Add New Dish</span>
           </Button>
        </div>
        {editingDish && <DishEditor onSave={handleAddDish} onCancel={() => setEditingDish(false)} />}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-400 uppercase tracking-wider">Current Menu</h3>
          {activeRestaurant.menu.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-700 rounded-2xl text-slate-500">No dishes added yet.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {activeRestaurant.menu.map(dish => (
                <div key={dish.id} className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-800">
                    <img src={dish.imageUrl} className="w-full h-full object-cover" alt={dish.name} />
                    {dish.videoUrl && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Video size={12} className="text-white" /></div>}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white">{dish.name}</h4>
                    <p className="text-sm text-slate-400">{dish.category} • ₹{dish.price}</p>
                  </div>
                  <button className="p-2 text-slate-500 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">My Restaurants</h1>
          <p className="text-slate-400">Manage your venues and menus</p>
        </div>
        <Button onClick={handleAddRestaurant} icon={Plus}>Add Restaurant</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {restaurants.map(r => (
          <RestaurantCard key={r.id} restaurant={r} onManage={() => { setActiveRestId(r.id); setView('details'); }} onGenerateQR={() => setShowQR(r.id)} />
        ))}
      </div>
    </div>
  );
};

/**
 * ==============================================================================
 * 6. CUSTOMER COMPONENTS
 * ==============================================================================
 */

const ThreeDImage = ({ src, alt, videoUrl }: { src: string, alt: string, videoUrl?: string }) => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    setRotate({ x: ((clientY - centerY) / (rect.height / 2)) * -25, y: ((clientX - centerX) / (rect.width / 2)) * 25 });
    setGlare({ x: ((clientX - rect.left) / rect.width) * 100, y: ((clientY - rect.top) / rect.height) * 100 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onTouchMove={(e) => e.touches[0] && handleMove(e.touches[0].clientX, e.touches[0].clientY)}
      onMouseLeave={() => { setRotate({ x: 0, y: 0 }); setGlare({ x: 50, y: 50 }); }}
      onTouchEnd={() => { setRotate({ x: 0, y: 0 }); setGlare({ x: 50, y: 50 }); }}
      className="relative z-20 transition-transform duration-100 ease-linear will-change-transform touch-none w-full max-w-md aspect-square"
      style={{ perspective: "800px" }}
    >
      <div className="w-full h-full rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden relative" style={{ transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale(1.1)`, transition: "transform 0.1s ease-out" }}>
        {videoUrl ? (
          <video src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover pointer-events-none" />
        ) : (
          <img src={src} alt={alt} className="w-full h-full object-cover pointer-events-none" />
        )}
        <div className="absolute inset-0 pointer-events-none mix-blend-soft-light" style={{ background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)` }} />
      </div>
      <div className="absolute -bottom-8 left-10 right-10 h-8 bg-black/40 blur-xl rounded-[100%]" style={{ transform: `translateX(${rotate.y * -1}px) scale(${1 - (Math.abs(rotate.x)/100)})`, opacity: 0.6, transition: "transform 0.1s ease-out" }} />
    </div>
  );
};

const CustomerMenu = ({ restaurant, onBack }: { restaurant: Restaurant, onBack: () => void }) => {
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const categories = ["All", ...Array.from(new Set(restaurant.menu.map(d => d.category)))];
  const filteredDishes = restaurant.menu.filter(d => activeCategory === "All" || d.category === activeCategory);

  const DishCard = ({ dish, onClick }: { dish: Dish, onClick: () => void }) => (
    <div onClick={onClick} className="group relative bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden h-64 flex flex-col hover:border-orange-500/30 transition-colors cursor-pointer">
      <div className="relative h-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10" />
        {dish.videoUrl ? (
          <video src={dish.videoUrl} muted loop onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        )}
        {dish.videoUrl && <div className="absolute top-2 right-2 z-20 bg-black/50 p-1 rounded-full"><Video size={12} className="text-white" /></div>}
        <div className="absolute bottom-2 right-2 z-20 bg-black/60 backdrop-blur px-2 py-1 rounded-lg text-white font-bold text-sm">₹{dish.price}</div>
      </div>
      <div className="p-4 flex-1">
        <h3 className="text-lg font-bold text-white truncate">{dish.name}</h3>
        <p className="text-xs text-slate-400 line-clamp-2">{dish.description}</p>
      </div>
    </div>
  );

  const DetailModal = ({ dish, onClose }: { dish: Dish, onClose: () => void }) => {
    const [arMode, setArMode] = useState(false);
    if (arMode) return <RealARViewer dish={dish} onClose={() => setArMode(false)} />;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
        <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
           <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-black/50 text-white p-2 rounded-full"><X size={20} /></button>
           <div className="w-full md:w-1/2 bg-gradient-to-b from-slate-800 to-slate-900 flex flex-col items-center justify-center p-8">
             <ThreeDImage src={dish.imageUrl} alt={dish.name} videoUrl={dish.videoUrl} />
             <Button onClick={() => setArMode(true)} className="mt-8" icon={Box}>View in 360° AR</Button>
           </div>
           <div className="w-full md:w-1/2 p-8 overflow-y-auto">
              <h2 className="text-3xl font-black text-white mb-2">{dish.name}</h2>
              <p className="text-2xl text-orange-500 font-light mb-6">₹{dish.price}</p>
              <p className="text-slate-400 mb-8">{dish.description}</p>
              <Button onClick={() => { 
                setCart([...cart, { ...dish, quantity: 1 }]); 
                onClose(); 
              }} className="w-full py-4" icon={ShoppingBag}>Add to Order</Button>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <nav className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/10 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold text-lg">
           <button onClick={onBack}><ArrowRight className="rotate-180 text-slate-400" /></button>
           {restaurant.name}
        </div>
        <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-white">
           <ShoppingBag />
           {cart.length > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-orange-500 rounded-full text-[10px] flex items-center justify-center">{cart.length}</span>}
        </button>
      </nav>

      <div className="p-4 space-y-6">
        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
          {categories.map(cat => (
             <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${activeCategory === cat ? 'bg-orange-600 text-white' : 'bg-white/5 text-slate-400'}`}>
               {cat}
             </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
           {filteredDishes.map(dish => (
             <DishCard key={dish.id} dish={dish} onClick={() => setSelectedDish(dish)} />
           ))}
        </div>
      </div>

      {selectedDish && <DetailModal dish={selectedDish} onClose={() => setSelectedDish(null)} />}
      
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
           <div className="absolute inset-0 bg-black/50" onClick={() => setIsCartOpen(false)} />
           <div className="relative w-80 bg-slate-900 h-full p-6 flex flex-col">
              <h2 className="text-white font-bold text-xl mb-4">Your Order</h2>
              <div className="flex-1 space-y-4 overflow-y-auto">
                 {cart.map((item, i) => (
                    <div key={i} className="flex justify-between text-slate-300 text-sm">
                       <span>{item.name}</span>
                       <span>₹{item.price}</span>
                    </div>
                 ))}
                 {cart.length === 0 && <p className="text-slate-500">Cart is empty.</p>}
              </div>
              {cart.length > 0 && <Button onClick={() => { setOrderSuccess(true); setCart([]); setIsCartOpen(false); }}>Place Order</Button>}
           </div>
        </div>
      )}

      {orderSuccess && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80">
           <div className="bg-slate-900 p-8 rounded-3xl text-center border border-green-500/20">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-white font-bold text-2xl">Order Placed!</h2>
              <p className="text-slate-400 mt-2">Kitchen is preparing your food.</p>
              <Button className="mt-6" onClick={() => setOrderSuccess(false)}>Awesome</Button>
           </div>
        </div>
      )}
    </div>
  );
};

/**
 * ==============================================================================
 * 7. MAIN APP ORCHESTRATOR
 * ==============================================================================
 */

const AdminLoginModal = ({ onLogin, onCancel }: { onLogin: () => void, onCancel: () => void }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (password === "arproakb123") {
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl w-full max-w-sm space-y-6 shadow-2xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Owner Login</h2>
          <p className="text-slate-400 text-sm mt-1">Restricted access for management</p>
        </div>
        
        <div className="space-y-2">
          <input 
            type="password" 
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Enter Password"
            className="w-full px-4 py-3 bg-slate-800 rounded-xl border border-white/10 text-white focus:border-orange-500 outline-none transition-colors"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          {error && <p className="text-red-500 text-xs ml-1">Incorrect password. Please try again.</p>}
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={handleLogin} className="flex-1 py-3 rounded-xl font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">Login</button>
        </div>
      </div>
    </div>
  );
};

const Landing = ({ onSelectMode }: { onSelectMode: (mode: 'admin' | 'customer') => void }) => {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-orange-900/20 rounded-full blur-[120px] animate-pulse" />
      
      {/* Admin Login Button - Top Right */}
      <button 
        onClick={() => setShowLogin(true)}
        className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm font-medium backdrop-blur-sm"
      >
        <Store size={16} />
        <span className="hidden sm:inline">Owner Access</span>
      </button>

      {showLogin && (
        <AdminLoginModal 
          onLogin={() => onSelectMode('admin')} 
          onCancel={() => setShowLogin(false)} 
        />
      )}
      
      <div className="relative z-10 text-center space-y-8 max-w-md w-full">
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-orange-500/20 transform hover:scale-105 transition-transform duration-500">
          <ChefHat size={48} />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none">
            AR MENU <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">PLATFORM</span>
          </h1>
          <p className="text-slate-500 text-xs font-mono tracking-widest opacity-60">made by AkB</p>
          <p className="text-slate-400 text-lg max-w-xs mx-auto">Experience the future of dining with immersive 3D menus.</p>
        </div>

        <div className="pt-4">
          <button 
            onClick={() => onSelectMode('customer')}
            className="group relative w-full overflow-hidden rounded-3xl bg-white p-1 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
             <div className="relative bg-slate-950 rounded-[1.4rem] p-8 flex flex-col items-center gap-4 border border-white/10 group-hover:border-orange-500/50 transition-colors">
               <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 mb-2 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                 <ScanLine size={32} />
               </div>
               <div className="space-y-1">
                 <span className="text-white font-black text-2xl block tracking-tight">SCAN QR CODE</span>
                 <p className="text-slate-500 text-sm">Point your camera to view menu</p>
               </div>
             </div>
             <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
          </button>
        </div>

        <p className="text-slate-600 text-xs uppercase tracking-widest pt-8">Powered by WebXR</p>
      </div>
    </div>
  );
};

const ScanSimulator = ({ onScan, onCancel }: { onScan: (id: string) => void, onCancel: () => void }) => {
  const [scanning, setScanning] = useState(true);
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white">
       <button onClick={onCancel} className="absolute top-6 right-6 p-2"><X /></button>
       <div className="w-64 h-64 border-2 border-orange-500 rounded-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/20 to-transparent animate-scan" style={{ height: '50%', top: '-50%', animation: 'scan 2s linear infinite' }} />
          <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20" size={48} />
       </div>
       <p className="mt-8 animate-pulse">Scanning for Restaurant QR...</p>
       <div className="mt-8 p-4 bg-slate-900 rounded-xl border border-white/10 max-w-xs">
          <p className="text-xs text-slate-500 mb-2 uppercase font-bold">Demo Shortcut</p>
          <div className="flex gap-2 flex-wrap justify-center">
             {INITIAL_RESTAURANTS.map(r => (
                <button key={r.id} onClick={() => onScan(r.id)} className="px-3 py-1 bg-white/10 hover:bg-orange-500 rounded text-xs">{r.name}</button>
             ))}
          </div>
       </div>
       <style>{`@keyframes scan { 0% { transform: translateY(0%); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(200%); opacity: 0; } }`}</style>
    </div>
  );
};

const App = () => {
  const [view, setView] = useState<'landing' | 'admin' | 'customer' | 'scanner'>('landing');
  const [restaurants, setRestaurants] = useState<Restaurant[]>(INITIAL_RESTAURANTS);
  const [activeRestaurantId, setActiveRestaurantId] = useState<string | null>(null);

  const activeRestaurant = restaurants.find(r => r.id === activeRestaurantId);

  return (
    <>
      {view === 'landing' && <Landing onSelectMode={(mode) => setView(mode === 'customer' ? 'scanner' : 'admin')} />}
      
      {view === 'admin' && (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8">
           <div className="mb-8 flex justify-between items-center max-w-5xl mx-auto">
              <button onClick={() => setView('landing')} className="text-slate-400 hover:text-white flex items-center gap-2"><LogOut size={16}/> Exit Admin</button>
           </div>
           <AdminDashboard 
              restaurants={restaurants} 
              onUpdateRestaurants={setRestaurants} 
              onPreview={(id) => { setActiveRestaurantId(id); setView('customer'); }}
           />
        </div>
      )}

      {view === 'scanner' && (
        <ScanSimulator 
           onCancel={() => setView('landing')} 
           onScan={(id) => {
              const exists = restaurants.find(r => r.id === id);
              if (exists) {
                setActiveRestaurantId(id);
                setView('customer');
              }
           }} 
        />
      )}

      {view === 'customer' && activeRestaurant && (
        <CustomerMenu 
           restaurant={activeRestaurant} 
           onBack={() => setView('landing')} 
        />
      )}
    </>
  );
};

export default App;
