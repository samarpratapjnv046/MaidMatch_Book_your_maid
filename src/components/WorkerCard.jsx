import { Link } from 'react-router-dom'
import { Star, MapPin, Clock, Heart, Calendar } from 'lucide-react'
import { useAuth } from '../App'

export default function WorkerCard({ worker, onQuickBook }) {
  const { saveWorker, unsaveWorker, isWorkerSaved, user } = useAuth()
  const isSaved = isWorkerSaved(worker.id)

  const handleSaveClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isSaved) {
      unsaveWorker(worker.id)
    } else {
      saveWorker(worker)
    }
  }

  const handleQuickBook = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onQuickBook) {
      onQuickBook(worker)
    }
  }

  return (
    <div className="bg-white rounded-card shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden hover:-translate-y-1 group">
      {/* Profile Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={worker.photo} 
          alt={worker.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {worker.available && (
          <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center space-x-1">
            <span className="w-2 h-2 bg-white rounded-full"></span>
            <span>Available</span>
          </div>
        )}
        
        {/* Save Button Overlay */}
        <button
          onClick={handleSaveClick}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
            isSaved 
              ? 'bg-red-500 text-white' 
              : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
          }`}
          title={isSaved ? 'Remove from saved' : 'Save helper'}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-20"></div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Name & Profession */}
        <div className="mb-3">
          <h3 className="font-heading text-lg font-semibold text-text-primary">
            {worker.name}
          </h3>
          <p className="text-primary text-sm font-medium">{worker.profession}</p>
        </div>

        {/* Rating */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-secondary fill-current" />
            <span className="font-semibold text-sm">{worker.rating}</span>
          </div>
          <span className="text-text-secondary text-sm">({worker.reviews} reviews)</span>
          {worker.rating >= 4.5 && (
            <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
              Top Rated
            </span>
          )}
        </div>

        {/* Location & Response */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-text-secondary text-sm">
            <MapPin className="w-4 h-4" />
            <span>{worker.location}</span>
          </div>
          <div className="flex items-center space-x-2 text-text-secondary text-sm">
            <Clock className="w-4 h-4" />
            <span>Responds {worker.responseTime}</span>
          </div>
        </div>

        {/* Skills Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {worker.skills.slice(0, 3).map((skill, index) => (
            <span 
              key={index}
              className="text-xs bg-gray-100 text-text-secondary px-2 py-1 rounded-full"
            >
              {skill}
            </span>
          ))}
          {worker.skills.length > 3 && (
            <span className="text-xs bg-gray-100 text-text-secondary px-2 py-1 rounded-full">
              +{worker.skills.length - 3} more
            </span>
          )}
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <span className="text-text-secondary text-xs">Hourly Rate</span>
            <p className="text-primary font-bold text-xl">₹{worker.hourlyRate}</p>
          </div>
          <div className="flex gap-2">
            {user && worker.available && (
              <button
                onClick={handleQuickBook}
                className="px-3 py-2 bg-green-100 text-primary rounded-btn hover:bg-green-200 transition-colors font-medium text-sm flex items-center gap-1"
                title="Quick Book"
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>
            )}
            <Link
              to={`/worker/${worker.id}`}
              className="px-4 py-2 bg-primary text-white rounded-btn hover:bg-green-700 transition-colors font-medium text-sm"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
