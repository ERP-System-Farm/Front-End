import React, { useEffect, useRef,useState } from 'react'

import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  UploadCloud,
  Video as VideoIcon,
  X,
} from 'lucide-react'

import { getAbsoluteFileUrl } from '../lib/utils'
import api from '../services/api'
import { reportsApi } from '../services/reportsApi'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ''
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''

export default function AttachmentUploader({
  value = [],
  onChange,
  onUploadStateChange, // Callback: (isUploading) => void
  type = 'daily-task', // 'daily-task' or 'harvest'
}) {
  const [uploads, setUploads] = useState({}) // key: tempId, value: { file, progress, status: 'uploading'|'success'|'error', errorMsg, url }
  const fileInputRef = useRef(null)
  const isUploadingRef = useRef(false)

  // Track if any file is currently uploading
  useEffect(() => {
    const isUploading = Object.values(uploads).some((up) => up.status === 'uploading')
    if (isUploadingRef.current !== isUploading) {
      isUploadingRef.current = isUploading
      if (onUploadStateChange) {
        onUploadStateChange(isUploading)
      }
    }
  }, [uploads, onUploadStateChange])

  // Get file type string
  const getFileType = (file) => {
    if (file.type.startsWith('image/')) return 'IMAGE'
    if (file.type.startsWith('video/')) return 'VIDEO'
    return 'FILE'
  }

  // Handle file upload
  const startUpload = async (tempId, file) => {
    setUploads((prev) => ({
      ...prev,
      [tempId]: {
        ...prev[tempId],
        progress: 0,
        status: 'uploading',
        errorMsg: null,
      },
    }))

    try {
      let fileUrl = ''

      // Attempt direct Cloudinary upload first if configured
      if (CLOUD_NAME && UPLOAD_PRESET) {
        try {
          const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`
          const formData = new FormData()
          formData.append('file', file)
          formData.append('upload_preset', UPLOAD_PRESET)

          const response = await reportsApi.uploadToCloudinary(
            cloudinaryUrl,
            formData,
            (progressEvent) => {
              const percentCompleted = progressEvent.total
                ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                : 0
              setUploads((prev) => {
                if (!prev[tempId]) return prev // already removed
                return {
                  ...prev,
                  [tempId]: {
                    ...prev[tempId],
                    progress: percentCompleted,
                  },
                }
              })
            }
          )
          fileUrl = response.data?.secure_url || response.data?.url
        } catch (cloudinaryError) {
          console.warn('Direct Cloudinary upload failed, falling back to local backend storage:', cloudinaryError)
        }
      }

      // Fallback to local backend storage if direct Cloudinary failed or is not configured
      if (!fileUrl) {
        const response = await reportsApi.uploadFile(file, (progressEvent) => {
          const percentCompleted = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0
          setUploads((prev) => {
            if (!prev[tempId]) return prev // already removed
            return {
              ...prev,
              [tempId]: {
                ...prev[tempId],
                progress: percentCompleted,
              },
            }
          })
        })
        fileUrl = response.data?.file_url
      }

      if (!fileUrl) {
        throw new Error('لم يتم إرجاع رابط الملف من الخادم')
      }

      setUploads((prev) => {
        if (!prev[tempId]) return prev
        return {
          ...prev,
          [tempId]: {
            ...prev[tempId],
            status: 'success',
            progress: 100,
            url: fileUrl,
          },
        }
      })

      // Notify parent — use a ref approach to avoid stale closure over `value`
      const fileType = getFileType(file)
      const newAttachment = {
        url: fileUrl,
        type: fileType,
        file_url: fileUrl,
        file_type: fileType,
        isNew: true,
        tempId,
      }
      // We use a custom event so the parent always appends to *current* state
      if (typeof onChange === 'function') {
        // onChange may be called with functional updater; if it can't handle that,
        // we read the latest value from the ref below.
        onChange((prev) => {
          // If parent passed a direct setter (useState setter), this works directly
          if (Array.isArray(prev)) return [...prev, newAttachment]
          // fallback: append to whatever `value` is at notification time
          return [...(Array.isArray(value) ? value : []), newAttachment]
        })
      }
    } catch (error) {
      console.error('File upload failed:', error)
      setUploads((prev) => {
        if (!prev[tempId]) return prev
        return {
          ...prev,
          [tempId]: {
            ...prev[tempId],
            status: 'error',
            errorMsg: error.message || 'فشل في رفع الملف',
          },
        }
      })
    }
  }

  const handleFiles = (files) => {
    files.forEach((file) => {
      const tempId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9)
      
      // Initialize local state
      setUploads((prev) => ({
        ...prev,
        [tempId]: {
          file,
          progress: 0,
          status: 'uploading',
          errorMsg: null,
          url: null,
        },
      }))

      // Start upload async
      startUpload(tempId, file)
    })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer?.files || [])
    if (files.length > 0) {
      handleFiles(files)
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFiles(files)
    }
  }

  const handleRetry = (tempId) => {
    const uploadItem = uploads[tempId]
    if (uploadItem && uploadItem.file) {
      startUpload(tempId, uploadItem.file)
    }
  }

  const handleRemoveNew = (tempId) => {
    // Remove from local uploads tracking
    setUploads((prev) => {
      const copy = { ...prev }
      delete copy[tempId]
      return copy
    })

    // Remove from value array passed to parent
    const updated = value.filter((item) => item.tempId !== tempId)
    onChange(updated)
  }

  const handleRemoveExisting = async (attachmentId) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المرفق نهائياً؟')) {
      return
    }

    try {
      const deleteUrl =
        type === 'daily-task'
          ? `/reports/attachments/${attachmentId}/`
          : `/production/harvest-attachments/${attachmentId}/`
      await api.delete(deleteUrl)

      // Notify parent to filter it out
      const updated = value.filter((item) => item.id !== attachmentId)
      onChange(updated)
    } catch (err) {
      console.error('Failed to delete attachment:', err)
      alert('فشل في حذف المرفق من الخادم. يرجى المحاولة مرة أخرى.')
    }
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-center items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-200 cursor-pointer p-6 min-h-[140px] text-center group"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-full text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-200">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <span className="block font-black text-slate-700 dark:text-slate-200 text-sm">
            اسحب الملفات هنا أو انقر للتصفح
          </span>
          <span className="block text-xs text-slate-400 dark:text-slate-500">
            يدعم الصور (JPG, PNG)، الفيديوهات (MP4)، والملفات (PDF) حتى 10 ميجابايت
          </span>
        </div>
      </div>

      {/* Upload/Attachment List */}
      {(value.length > 0 || Object.keys(uploads).length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Render Existing Saved Attachments */}
          {value.map((item) => {
            const fileUrl = item.url || item.file_url
            const fileType = item.type || item.file_type
            const absoluteUrl = getAbsoluteFileUrl(fileUrl)
            const isImage = fileType === 'IMAGE' || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl)
            const isVideo = fileType === 'VIDEO' || /\.(mp4|webm|ogg)$/i.test(fileUrl)

            return (
              <div
                key={item.id || item.tempId || fileUrl}
                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl relative overflow-hidden group shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* Media Preview */}
                <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800">
                  {isImage ? (
                    <img
                      src={absoluteUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                  ) : isVideo ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                      <VideoIcon className="w-6 h-6 text-slate-400" />
                    </div>
                  ) : (
                    <FileText className="w-6 h-6 text-slate-400" />
                  )}
                  {/* Fallback Icon for image loading errors */}
                  <div className="hidden w-full h-full items-center justify-center text-slate-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                </div>

                {/* Meta details */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 text-xs font-bold truncate">
                    <span className="truncate">
                      {fileUrl.split('/').pop() || 'مرفق'}
                    </span>
                    <span className="bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 px-1.5 py-0.5 rounded-md flex-shrink-0 font-medium">
                      {fileType === 'IMAGE' ? 'صورة' : fileType === 'VIDEO' ? 'فيديو' : 'ملف'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    تم الرفع والحفظ
                  </p>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (item.id) {
                      handleRemoveExisting(item.id)
                    } else {
                      handleRemoveNew(item.tempId)
                    }
                  }}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors duration-150 flex-shrink-0"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}

          {/* Render Active/Pending Uploads */}
          {Object.entries(uploads).map(([tempId, up]) => {
            const isImage = up.file?.type.startsWith('image/')
            const isVideo = up.file?.type.startsWith('video/')
            const localPreviewUrl = isImage ? URL.createObjectURL(up.file) : null

            // Avoid listing duplicate if it's already transitioned to the parent value list
            if (up.status === 'success') return null

            return (
              <div
                key={tempId}
                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl relative overflow-hidden shadow-sm"
              >
                {/* Preview */}
                <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800">
                  {isImage && localPreviewUrl ? (
                    <img src={localPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : isVideo ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-950">
                      <VideoIcon className="w-6 h-6 text-slate-400" />
                    </div>
                  ) : (
                    <FileText className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                {/* Progress / Status */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="text-slate-800 dark:text-slate-200 text-xs font-bold truncate">
                    {up.file?.name}
                  </div>
                  <div className="mt-2.5">
                    {up.status === 'uploading' && (
                      <div className="space-y-1.5">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${up.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-medium text-slate-500">
                          <span>جاري الرفع...</span>
                          <span>{up.progress}%</span>
                        </div>
                      </div>
                    )}
                    {up.status === 'error' && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-red-500">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{up.errorMsg || 'فشل الرفع'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Control Action Buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {up.status === 'error' && (
                    <button
                      type="button"
                      onClick={() => handleRetry(tempId)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 rounded-lg transition-colors"
                      title="إعادة المحاولة"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveNew(tempId)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                    title="إزالة"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
