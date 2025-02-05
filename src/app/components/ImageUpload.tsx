"use client"

import { useState, useCallback, useEffect } from 'react'
import { Upload } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '../../../utils/superbase/client'

interface FileUploadProps {
  onImageUploaded: () => void
}

const FileUpload: React.FC<FileUploadProps> = ({ onImageUploaded }) => {
  const [uploading, setUploading] = useState(false)
  const [user, setUser] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Error getting user:', error)
        return
      }
      setUser(user)
    }
    
    getCurrentUser()
  }, [])
  
  const onDrop = useCallback(async (acceptedFiles) => {
    if (!user) {
      console.error('No user logged in')
      return
    }

    try {
      setUploading(true)
      const file = acceptedFiles[0]
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`
      
      // Upload to single images bucket
      const { error: uploadError } = await supabase.storage
        .from('gallery')  // Single bucket for all images
        .upload(filePath, file)
        
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('gallery')
        .getPublicUrl(filePath)
      
      // Create record in gallery_images table
      const { error: dbError } = await supabase
        .from('gallery_images')
        .insert({
          user_id: user.id,
          title: file.name,
          storage_path: filePath,
          visibility: 'public', // Default visibility
          metadata: {
            size: file.size,
            type: file.type,
            originalName: file.name
          }
        })

      if (dbError) throw dbError
      
      // Notify parent component
      onImageUploaded()
      
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }, [user, onImageUploaded])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    multiple: false
  })
  
  if (!user) {
    return (
      <div className="w-full max-w-2xl mx-auto mb-8 p-4 bg-yellow-50 rounded-lg text-yellow-700">
        Please log in to upload images
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8
          flex flex-col items-center justify-center
          cursor-pointer transition-colors duration-200
          ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}
        `}
      >
        <input {...getInputProps()} />
        <Upload 
          size={32} 
          className={`mb-4 ${isDragActive ? 'text-indigo-500' : 'text-gray-400'}`}
        />
        <p className="text-sm text-gray-600 text-center">
          {uploading ? 'Uploading...' : 
            isDragActive ? 'Drop the image here' : 
            'Drag & drop an image here, or click to select'}
        </p>
      </div>
    </div>
  )
}

export default FileUpload;






















// "use client"

// import { useState, useCallback, useEffect } from 'react'
// import { Upload } from 'lucide-react'
// import { useDropzone } from 'react-dropzone'
// import { createClient } from '../../../utils/superbase/client'

// interface ImageUploadedProps {
//   id: string
//   src: string
//   isPrivate: boolean
//   isShared: boolean
//   userId: string
// }

// interface FileUploadProps {
//   onImageUploaded: (image: ImageUploadedProps) => void
// }

// const FileUpload: React.FC<FileUploadProps> = ({ onImageUploaded }) => {
//   const [uploading, setUploading] = useState(false)
//   const [user, setUser] = useState(null)
//   const supabase = createClient()

//   useEffect(() => {
//     const getCurrentUser = async () => {
//       const { data: { user }, error } = await supabase.auth.getUser()
//       if (error) {
//         console.error('Error getting user:', error)
//         return
//       }
//       setUser(user)
//     }
    
//     getCurrentUser()
//   }, [])
  
//   const onDrop = useCallback(async (acceptedFiles) => {
//     if (!user) {
//       console.error('No user logged in')
//       return
//     }

//     try {
//       setUploading(true)
//       const file = acceptedFiles[0]
      
//       const fileExt = file.name.split('.').pop()
//       const fileName = `${Date.now()}.${fileExt}`
//       const filePath = `${user.id}/${fileName}`
      
//       const { error: uploadError } = await supabase.storage
//         .from('Images')
//         .upload(filePath, file)
        
//       if (uploadError) throw uploadError
      
//       const { data, error: urlError } = await supabase
//         .storage
//         .from('Images')
//         .createSignedUrl(filePath, 60 * 60) // 1 hour expiry

//       if (urlError) throw urlError
      
//       onImageUploaded({
//         id: fileName,
//         src: data.signedUrl,
//         isPrivate: false,
//         isShared: false,
//         userId: user.id
//       })
      
//     } catch (error) {
//       console.error('Upload error:', error)
//     } finally {
//       setUploading(false)
//     }
//   }, [user, onImageUploaded])
  
//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     accept: {
//       'image/*': ['.jpeg', '.jpg', '.png', '.gif']
//     },
//     multiple: false
//   })
  
//   if (!user) {
//     return (
//       <div className="w-full max-w-2xl mx-auto mb-8 p-4 bg-yellow-50 rounded-lg text-yellow-700">
//         Please log in to upload images
//       </div>
//     )
//   }

//   return (
//     <div className="w-full max-w-2xl mx-auto mb-8">
//       <div
//         {...getRootProps()}
//         className={`
//           border-2 border-dashed rounded-lg p-8
//           flex flex-col items-center justify-center
//           cursor-pointer transition-colors duration-200
//           ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}
//         `}
//       >
//         <input {...getInputProps()} />
//         <Upload 
//           size={32} 
//           className={`mb-4 ${isDragActive ? 'text-indigo-500' : 'text-gray-400'}`}
//         />
//         <p className="text-sm text-gray-600 text-center">
//           {uploading ? 'Uploading...' : 
//             isDragActive ? 'Drop the image here' : 
//             'Drag & drop an image here, or click to select'}
//         </p>
//       </div>
//     </div>
//   )
// }

// export default FileUpload;