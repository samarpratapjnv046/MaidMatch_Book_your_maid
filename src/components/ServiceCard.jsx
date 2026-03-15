import { Sparkles, Baby, Utensils, Heart } from 'lucide-react'

const icons = {
  'House Cleaning': Sparkles,
  'Baby Care': Baby,
  'Cooking': Utensils,
  'Elder Care': Heart
}

const colors = {
  'House Cleaning': 'bg-green-100 text-primary',
  'Baby Care': 'bg-pink-100 text-pink-600',
  'Cooking': 'bg-orange-100 text-orange-600',
  'Elder Care': 'bg-blue-100 text-blue-600'
}

export default function ServiceCard({ service, onClick }) {
  const Icon = icons[service.title] || Sparkles
  const colorClass = colors[service.title] || 'bg-green-100 text-primary'

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-card p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer hover:-translate-y-1"
    >
      <div className={`w-16 h-16 ${colorClass} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="font-heading text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
        {service.title}
      </h3>
      <p className="text-text-secondary text-sm mb-4">
        {service.description}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-text-secondary text-sm">
          Starting at
        </span>
        <span className="text-primary font-semibold">
          ₹{service.startingPrice}/hr
        </span>
      </div>
    </div>
  )
}
