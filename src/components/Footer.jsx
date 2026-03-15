import { Link } from 'react-router-dom'
import { Home, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-text-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading text-2xl font-bold">MaidMatch</span>
            </Link>
            <p className="text-gray-400 mb-4">
              Connecting families with reliable domestic help. Your trusted partner for household services.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/search" className="text-gray-400 hover:text-primary transition-colors">
                  Find Help
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-400 hover:text-primary transition-colors">
                  Become a Helper
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-400 hover:text-primary transition-colors">
                  My Dashboard
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-heading text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  House Cleaning
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  Baby Care
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  Cooking
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  Elder Care
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  All Services
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3 text-gray-400">
                <MapPin className="w-5 h-5 flex-shrink-0" />
                <span>123 Service Lane, Mumbai, Maharashtra 400001</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span>support@maidmatch.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} MaidMatch. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
