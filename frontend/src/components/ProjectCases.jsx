import { Link } from 'react-router-dom';

const ProjectCases = () => {
  const projects = [
    { id: 1, title: "HZS180 in Philippines", img: "https://www.batchingplantchina.com/wp-content/uploads/2017/06/HZS-180-concrete-batching-plant-in-Philippines.jpg" },
    { id: 2, title: "MHZS60 in Cambodia", img: "https://www.batchingplantchina.com/wp-content/uploads/2017/06/MHZS60-Concrete-Barching-plant-in-Cambodia.jpg" },
    { id: 3, title: "HZS90 in Indonesia", img: "https://www.batchingplantchina.com/wp-content/uploads/2017/06/HZS90-concrete-batching-plant-in-Indonesia.jpg" },
  ];

  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Unified Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
              Project <span className="text-orange-600">Cases</span>
            </h2>
            <div className="w-20 h-1.5 bg-orange-600 mt-4 rounded-full"></div>
          </div>
          <Link to="/projects" className="text-sm font-bold border-b-2 border-gray-400 pb-1 text-gray-300 hover:text-orange-500 hover:border-orange-500 transition-all uppercase tracking-wider">
            View All Projects
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {projects.map((p) => (
            <div key={p.id} className="group relative overflow-hidden rounded-2xl h-[400px] cursor-pointer shadow-2xl">
              <img 
                src={p.img} 
                alt={p.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="absolute bottom-0 left-0 w-full p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <div className="w-10 h-1 bg-orange-600 mb-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100"></div>
                <h3 className="font-bold text-2xl text-white leading-tight">{p.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectCases;