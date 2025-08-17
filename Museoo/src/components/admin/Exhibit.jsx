import React, { useState, useEffect } from "react";

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

const Exhibit = () => {
  const [exhibits, setExhibits] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    images: [],
    startDate: "",
    endDate: "",
    location: "",
    curator: "",
    category: "",
  });
  const [modalExhibit, setModalExhibit] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming'); // Add tab state

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "images") {
      setForm((prev) => ({
        ...prev,
        images: Array.from(files),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const fetchExhibits = () => {
    fetch('http://localhost:3000/api/activities/exhibits')
      .then(res => res.json())
      .then(data => {
        // Map snake_case to camelCase
        const mapped = data.map(ex => ({
          ...ex,
          startDate: ex.start_date,
          endDate: ex.end_date,
          images: ex.images,
          location: ex.location,
          curator: ex.curator,
          category: ex.category,
          // Optionally remove snake_case fields if you want
        }));
        setExhibits(mapped);
      })
      .catch(() => setExhibits([]));
  };

  useEffect(() => {
    fetchExhibits();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.startDate ||
      !form.endDate ||
      !form.location.trim() ||
      !form.curator.trim() ||
      !form.category.trim()
    ) {
      alert("Please fill all required fields.");
      return;
    }

    setSubmitting(true);

    // 1. Build FormData
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('type', 'exhibit');
    formData.append('start_date', form.startDate);
    formData.append('end_date', form.endDate);
    formData.append('location', form.location);
    formData.append('curator', form.curator);
    formData.append('category', form.category);
    for (const file of form.images) {
      formData.append('images', file);
    }

    // 2. Send to backend
    try {
      const res = await fetch('http://localhost:3000/api/activities', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        alert('Exhibit added successfully!');
        setForm({
          title: "",
          description: "",
          images: [],
          startDate: "",
          endDate: "",
          location: "",
          curator: "",
          category: "",
        });
        e.target.reset();
        setShowForm(false);
        fetchExhibits();
      } else {
        alert('Failed to add exhibit.');
      }
    } catch (err) {
      alert('Error adding exhibit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this exhibit?')) return;
    setExhibits(exhibits.filter((item) => item.id !== id));
  };

  // Categorize exhibits (with ongoing state)
  const now = new Date();
  const upcoming = exhibits.filter(
    (ex) => new Date(ex.startDate) > now
  );
  const ongoing = exhibits.filter(
    (ex) => new Date(ex.startDate) <= now && new Date(ex.endDate) >= now
  );
  const history = exhibits.filter(
    (ex) => new Date(ex.endDate) < now
  );
  
  // Calculate stats
  const totalExhibits = exhibits.length;
  const upcomingCount = upcoming.length;
  const ongoingCount = ongoing.length;
  const pastCount = history.length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#2e2b41] mb-2">
              <i className="fa-solid fa-eye mr-3"></i>
              Exhibit Management
            </h1>
            <p className="text-gray-600 text-sm md:text-base">Create and manage museum exhibits and collections</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#AB8841] text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-[#8B6B21] transition-colors font-semibold shadow-md text-sm md:text-base"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            {showForm ? "Cancel" : "Add Exhibit"}
          </button>
        </div>
      </div>

      {/* Add Exhibit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-8 border border-gray-200">
          <h3 className="text-xl md:text-2xl font-bold text-[#2e2b41] mb-4 md:mb-6">
            <i className="fa-solid fa-plus-circle mr-3"></i>
            Add New Exhibit
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2 text-sm md:text-base">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-sm md:text-base"
                  placeholder="Enter exhibit title"
                  required
                />
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2 text-sm md:text-base">
                  Category *
                </label>
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-sm md:text-base"
                  placeholder="e.g., Modern Art, History, Science"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[#2e2b41] font-semibold mb-2 text-sm md:text-base">
                Description *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-sm md:text-base"
                rows="3"
                placeholder="Enter exhibit description"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2 text-sm md:text-base">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-sm md:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2 text-sm md:text-base">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-sm md:text-base"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2 text-sm md:text-base">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-sm md:text-base"
                  placeholder="e.g., Gallery A, Main Hall"
                  required
                />
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2 text-sm md:text-base">
                  Curator *
                </label>
                <input
                  type="text"
                  name="curator"
                  value={form.curator}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-sm md:text-base"
                  placeholder="Enter curator name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[#2e2b41] font-semibold mb-2 text-sm md:text-base">
                Images (optional, you can select multiple)
              </label>
              <input
                type="file"
                name="images"
                accept="image/*"
                multiple
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] bg-white text-sm md:text-base"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#AB8841] hover:bg-[#8B6B21] text-white px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Adding Exhibit...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-plus mr-2"></i>
                    Add Exhibit
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold transition-colors shadow-md text-sm md:text-base"
              >
                <i className="fa-solid fa-times mr-2"></i>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3 md:mr-4">
              <i className="fa-solid fa-eye text-blue-600 text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Exhibits</p>
              <p className="text-xl md:text-2xl font-bold text-blue-600">{exhibits.length}</p>
            </div>
          </div>
        </div>

                 <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
           <div className="flex items-center">
             <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mr-3 md:mr-4">
               <i className="fa-solid fa-clock text-green-600 text-lg md:text-xl"></i>
             </div>
             <div>
               <p className="text-sm text-gray-600">Upcoming</p>
               <p className="text-xl md:text-2xl font-bold text-green-600">{upcomingCount}</p>
             </div>
           </div>
         </div>

         <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
           <div className="flex items-center">
             <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3 md:mr-4">
               <i className="fa-solid fa-play text-blue-600 text-lg md:text-xl"></i>
             </div>
             <div>
               <p className="text-sm text-gray-600">Ongoing</p>
               <p className="text-xl md:text-2xl font-bold text-blue-600">{ongoingCount}</p>
             </div>
           </div>
         </div>

         <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
           <div className="flex items-center">
             <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-full flex items-center justify-center mr-3 md:mr-4">
               <i className="fa-solid fa-history text-orange-600 text-lg md:text-xl"></i>
             </div>
             <div>
               <p className="text-sm text-gray-600">Past</p>
               <p className="text-xl md:text-2xl font-bold text-orange-600">{pastCount}</p>
             </div>
           </div>
         </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="border-b border-gray-200">
                     <nav className="flex space-x-8 px-4 md:px-6">
             <button
               onClick={() => setActiveTab('upcoming')}
               className={`py-3 md:py-4 px-1 border-b-2 font-medium text-sm md:text-base transition-colors ${
                 activeTab === 'upcoming'
                   ? 'border-[#AB8841] text-[#AB8841]'
                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
               }`}
             >
               <i className="fa-solid fa-calendar-plus mr-2"></i>
               Upcoming Exhibits ({upcomingCount})
             </button>
             <button
               onClick={() => setActiveTab('ongoing')}
               className={`py-3 md:py-4 px-1 border-b-2 font-medium text-sm md:text-base transition-colors ${
                 activeTab === 'ongoing'
                   ? 'border-[#AB8841] text-[#AB8841]'
                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
               }`}
             >
               <i className="fa-solid fa-play mr-2"></i>
               Ongoing Exhibits ({ongoingCount})
             </button>
             <button
               onClick={() => setActiveTab('history')}
               className={`py-3 md:py-4 px-1 border-b-2 font-medium text-sm md:text-base transition-colors ${
                 activeTab === 'history'
                   ? 'border-[#AB8841] text-[#AB8841]'
                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
               }`}
             >
               <i className="fa-solid fa-history mr-2"></i>
               Exhibit History ({pastCount})
             </button>
           </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 md:p-6">
                     {activeTab === 'upcoming' && (
             <div>
               
               {upcoming.length > 0 ? (
                 <ExhibitSection data={upcoming} onDelete={handleDelete} onView={setModalExhibit} />
               ) : (
                 <div className="text-center py-8 md:py-12">
                   <i className="fa-solid fa-calendar-plus text-4xl md:text-6xl mb-4 text-gray-300"></i>
                   <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2">No Upcoming Exhibits</h3>
                   <p className="text-sm md:text-base text-gray-500">No exhibits are scheduled for the future</p>
                 </div>
               )}
             </div>
           )}

           {activeTab === 'ongoing' && (
             <div>
             
               {ongoing.length > 0 ? (
                 <ExhibitSection data={ongoing} onDelete={handleDelete} onView={setModalExhibit} />
               ) : (
                 <div className="text-center py-8 md:py-12">
                   <i className="fa-solid fa-play text-4xl md:text-6xl mb-4 text-gray-300"></i>
                   <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2">No Ongoing Exhibits</h3>
                   <p className="text-sm md:text-base text-gray-500">No exhibits are currently running</p>
                 </div>
               )}
             </div>
           )}

           {activeTab === 'history' && (
             <div>
              
               {history.length > 0 ? (
                 <ExhibitSection data={history} faded onDelete={handleDelete} onView={setModalExhibit} />
               ) : (
                 <div className="text-center py-8 md:py-12">
                   <i className="fa-solid fa-history text-4xl md:text-6xl mb-4 text-gray-300"></i>
                   <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2">No Past Exhibits</h3>
                   <p className="text-sm md:text-base text-gray-500">No exhibits have been completed yet</p>
                 </div>
               )}
             </div>
           )}
        </div>
      </div>

      {/* Show this only when there are no exhibits at all */}
      {exhibits.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
          <div className="text-center py-8 md:py-12">
            <i className="fa-solid fa-eye text-4xl md:text-6xl mb-4 text-gray-300"></i>
            <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2">No Exhibits Found</h3>
            <p className="text-sm md:text-base text-gray-500">Start by adding your first exhibit using the "Add Exhibit" button above</p>
          </div>
        </div>
      )}

      {/* Modal for viewing details */}
      {modalExhibit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#2e2b41] to-[#AB8841] p-4 md:p-6 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-bold text-white truncate">{modalExhibit.title}</h2>
                <button 
                  className="text-white hover:text-gray-200 text-2xl font-bold ml-4"
                  onClick={() => setModalExhibit(null)}
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-4 md:p-6">
              {modalExhibit.images && modalExhibit.images.length > 0 && (
                <div className="mb-4 md:mb-6">
                  <h3 className="text-base md:text-lg font-semibold text-[#2e2b41] mb-3">
                    <i className="fa-solid fa-images mr-2"></i>
                    Exhibit Images
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    {modalExhibit.images.map((img, idx) => (
                      <img 
                        key={idx} 
                        src={`http://localhost:3000${img}`} 
                        alt="exhibit" 
                        className="w-full h-24 md:h-32 object-cover rounded-lg shadow-md" 
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <h3 className="text-xs md:text-sm font-semibold text-[#2e2b41] uppercase tracking-wide">Description</h3>
                    <p className="text-gray-800 mt-1 text-sm md:text-base">{modalExhibit.description}</p>
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-semibold text-[#2e2b41] uppercase tracking-wide">Location</h3>
                    <p className="text-gray-800 mt-1 text-sm md:text-base">
                      <i className="fa-solid fa-map-marker-alt mr-2 text-[#AB8841]"></i>
                      {modalExhibit.location}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-semibold text-[#2e2b41] uppercase tracking-wide">Curator</h3>
                    <p className="text-gray-800 mt-1 text-sm md:text-base">
                      <i className="fa-solid fa-user mr-2 text-[#AB8841]"></i>
                      {modalExhibit.curator}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <h3 className="text-xs md:text-sm font-semibold text-[#2e2b41] uppercase tracking-wide">Category</h3>
                    <span className="inline-block bg-[#AB8841] text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium mt-1">
                      {modalExhibit.category}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-semibold text-[#2e2b41] uppercase tracking-wide">Start Date</h3>
                    <p className="text-gray-800 mt-1 text-sm md:text-base">
                      <i className="fa-solid fa-calendar mr-2 text-[#AB8841]"></i>
                      {formatDate(modalExhibit.startDate)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-semibold text-[#2e2b41] uppercase tracking-wide">End Date</h3>
                    <p className="text-gray-800 mt-1 text-sm md:text-base">
                      <i className="fa-solid fa-calendar mr-2 text-[#AB8841]"></i>
                      {formatDate(modalExhibit.endDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Section Component
const ExhibitSection = ({ data, onDelete, onView, faded }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Image</th>
            <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Title</th>
            <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Category</th>
            <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Location</th>
            <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Curator</th>
            <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Start Date</th>
            <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">End Date</th>
            <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((exhibit) => (
            <tr key={exhibit.id} className={`hover:bg-gray-50 transition-colors${faded ? " opacity-70" : ""}`}>
              <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                {exhibit.images && exhibit.images.length > 0 ? (
                  <div className="flex gap-1 md:gap-2 flex-wrap">
                    {exhibit.images.map((img, idx) => (
                      <img key={idx} src={`http://localhost:3000${img}`} alt="exhibit" className="w-8 h-8 md:w-12 md:h-12 object-cover rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-image text-gray-400 text-xs md:text-sm"></i>
                  </div>
                )}
              </td>
              <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-[#2e2b41] truncate max-w-20 md:max-w-32">{exhibit.title}</div>
              </td>
              <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                <span className="inline-block bg-[#AB8841] text-white px-2 py-1 rounded-full text-xs font-medium truncate max-w-20 md:max-w-32">
                  {exhibit.category}
                </span>
              </td>
              <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                <div className="text-sm text-gray-600 truncate max-w-20 md:max-w-32">{exhibit.location}</div>
              </td>
              <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                <div className="text-sm text-gray-600 truncate max-w-20 md:max-w-32">{exhibit.curator}</div>
              </td>
              <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                <div className="text-sm text-[#2e2b41] truncate max-w-20 md:max-w-32">{formatDate(exhibit.startDate)}</div>
              </td>
              <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                <div className="text-sm text-[#2e2b41] truncate max-w-20 md:max-w-32">{formatDate(exhibit.endDate)}</div>
              </td>
              <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                  <button
                    onClick={() => onView(exhibit)}
                    className="text-blue-600 hover:text-blue-800 font-semibold text-xs md:text-sm"
                  >
                    <i className="fa-solid fa-eye mr-1"></i>
                    View
                  </button>
                  {!faded && (
                    <button
                      onClick={() => onDelete(exhibit.id)}
                      className="text-red-600 hover:text-red-800 font-semibold text-xs md:text-sm"
                    >
                      <i className="fa-solid fa-trash mr-1"></i>
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Exhibit;
