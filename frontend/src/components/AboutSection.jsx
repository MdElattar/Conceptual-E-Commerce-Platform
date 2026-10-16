import { Link } from 'react-router-dom';

const AboutSection = () => {
  return (
    <section className="py-20 bg-white border-t border-gray-200 overflow-hidden relative">
      
      {/* 🌟 Background Pattern (يعطي إحساس هندسي/صناعي) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          <div className="flex-1 relative w-full max-w-2xl mx-auto lg:mx-0">
            {/* 🌟 صورة مضمونة وعالية الجودة وتملأ المساحة */}
            <div className="aspect-[16/10] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative z-10 border border-gray-100">
                <img 
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80" 
                alt="Global Industrial Sourcing" 
                loading="lazy"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
            </div>
            
            {/* 🌟 Decorative elements (بدون تداخل مزعج) */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-orange-50 rounded-full z-0"></div>
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-sky-50 rounded-full z-0"></div>
            <div className="absolute top-1/2 -right-12 w-24 h-24 border-4 border-gray-100 rounded-full z-0 opacity-50"></div>
          </div>

          <div className="flex-1 text-left relative z-10">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-gray-900 mb-6 leading-tight">
              Global Sourcing for <br/><span className="text-orange-600">Heavy Industry</span>
            </h2>
            
            <div className="h-1.5 w-24 bg-orange-600 mb-8 rounded-full"></div>

            <p className="text-gray-600 text-lg mb-10 leading-relaxed font-medium">
              DKTEC provides a centralized marketplace connecting verified vendors of concrete batching plants, spare parts, and industrial equipment directly to buyers worldwide with full financial security.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              {[
                  { title: 'Verified Vendors', desc: 'Strict KYC & quality checks.' },
                  { title: 'Secure Escrow', desc: 'Funds protected until delivery.' },
                  { title: 'Global Logistics', desc: 'Automated shipping calculation.' },
                  { title: 'B2B Wholesale', desc: 'Volume discounts available.' }
              ].map((item, idx) => (
                <div key={idx} className="bg-gray-50 p-5 rounded-xl border border-gray-100 hover:border-orange-200 transition-colors">
                  <h4 className="font-black text-base text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-500 mt-1 font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
            
            <Link to="/about" className="inline-block bg-gray-900 text-white px-10 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-orange-600 transition duration-300 shadow-xl shadow-gray-900/20 active:scale-95">
              Learn More About DKTEC
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;