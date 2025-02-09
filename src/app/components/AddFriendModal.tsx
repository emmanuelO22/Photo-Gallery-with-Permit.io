"use client"

import { useState } from "react"
import { UserPlus } from "lucide-react"

interface AddFriendModalProps {
  isOpen: boolean
  onClose: () => void
  onShareSubmit: (email: string, role: 'viewer' | 'curator') => Promise<void>
}

export function AddFriendModal({ isOpen, onClose, onShareSubmit }: AddFriendModalProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<'viewer' | 'curator'>('viewer')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await onShareSubmit(email, role)
      setEmail("")
      setRole('viewer')
      onClose()
    } catch (error) {
      console.error('Error sharing:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold">Share with Friend</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Friends Email
            </label>
            <input
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Level
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'viewer' | 'curator')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            >
              <option value="viewer">Viewer (view only)</option>
              <option value="curator">Curator (view, comment, and move)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">◌</span>
                  Sharing...
                </>
              ) : (
                'Share'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}