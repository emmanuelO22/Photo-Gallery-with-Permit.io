"use client"

import { useState } from "react"

interface AddFriendModalProps {
  isOpen: boolean
  onClose: () => void
  onShareSubmit: (email: string) => Promise<void>
}

export function AddFriendModal({ isOpen, onClose, onShareSubmit }: AddFriendModalProps) {
  const [email, setEmail] = useState("")

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    
    try {
      await onShareSubmit(email)
      setEmail("")
      onClose()
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Share with Friendsss</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
            required
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Share
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}