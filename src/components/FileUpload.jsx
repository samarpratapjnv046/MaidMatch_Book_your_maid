import { useState, useRef } from 'react'
import { Upload, X, Image } from 'lucide-react'

export default function FileUpload({ label, value, onChange, accept = "image/*", maxSize = 5 }) {
  const [preview, setPreview] = useState(value || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      return
    }

    setError('')
    setUploading(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)

      // For now, we'll use the data URL directly
      // In production, you'd upload to a server and get a URL back
      const dataUrl = await fileToDataUrl(file)
      onChange(dataUrl)
    } catch (err) {
      setError('Failed to process image')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleRemove = () => {
    setPreview(null)
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      
      {preview ? (
        <div className="relative inline-block">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-32 h-32 object-cover rounded-lg border border-border"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
          {uploading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Click to upload</p>
              <p className="text-xs text-gray-400 mt-1">Max size: {maxSize}MB</p>
            </>
          )}
        </div>
      )}
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}
