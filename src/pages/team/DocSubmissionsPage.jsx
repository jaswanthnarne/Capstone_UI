import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UploadCloud, CheckCircle, Clock, AlertTriangle, FileText, Download, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { getTeamDocRequests, submitDocRequest } from '../../services/api'

export default function DocSubmissionsPage() {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [uploadingId, setUploadingId] = useState(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const res = await getTeamDocRequests()
      setRequests(res.data.data)
    } catch (err) {
      toast.error('Failed to load document requests')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (requestId, file, docRequest) => {
    if (!file) return

    // 1. Client-side Size Validation
    const fileSizeInMB = file.size / (1024 * 1024)
    if (fileSizeInMB > docRequest.maxSize) {
      return toast.error(`File size (${fileSizeInMB.toFixed(2)}MB) exceeds the request limit of ${docRequest.maxSize}MB`)
    }

    // 2. Client-side Extension Validation
    const ext = file.name.split('.').pop().toLowerCase()
    if (docRequest.fileType !== 'any') {
      let allowed = false;
      if (docRequest.fileType === 'pdf' && ext === 'pdf') allowed = true;
      if (docRequest.fileType === 'zip' && (ext === 'zip' || ext === 'rar' || ext === '7z')) allowed = true;
      if (docRequest.fileType === 'doc' && (ext === 'doc' || ext === 'docx')) allowed = true;

      if (!allowed) {
        return toast.error(`Invalid file type. The request requires a ${docRequest.fileType.toUpperCase()} file.`)
      }
    }

    setUploadingId(requestId)

    try {
      let res;
      
      // If file size > 1.5MB or docx/pdf file, convert to Base64 to bypass Vercel 4.5MB 413 limit
      if (fileSizeInMB > 1.5 || ext === 'docx' || ext === 'doc' || ext === 'pdf') {
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = () => resolve(reader.result)
          reader.onerror = error => reject(error)
        })

        res = await submitDocRequest({
          requestId,
          fileName: file.name,
          fileData: base64Data,
          fileSize: fileSizeInMB.toFixed(2)
        })
      } else {
        const formData = new FormData()
        formData.append('requestId', requestId)
        formData.append('docFile', file)
        res = await submitDocRequest(formData)
      }
      
      // Update local state to show uploaded file info and updated changeCount
      const updatedRequests = requests.map(req => {
        if (req._id === requestId) {
          return {
            ...req,
            submission: {
              fileUrl: res.data.data.fileUrl,
              fileName: res.data.data.fileName,
              fileSize: res.data.data.fileSize,
              changeCount: res.data.data.changeCount || 1,
              submittedAt: new Date().toISOString()
            }
          }
        }
        return req
      })
      setRequests(updatedRequests)
      toast.success(`Document "${file.name}" uploaded successfully!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload document')
    } finally {
      setUploadingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-2">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <UploadCloud className="text-blue-600" /> Document Submissions
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload required documents (synopsis reports, diagrams, code zip files) as requested by your trainer.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
          <FileText className="mx-auto mb-2 opacity-50" size={32} />
          <span className="text-sm font-medium">No document requests are currently assigned to your team.</span>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((reqItem) => {
            const hasSubmission = !!reqItem.submission
            const changeCount = hasSubmission ? reqItem.submission.changeCount || 0 : 0
            const isLocked = changeCount >= 3

            return (
              <div 
                key={reqItem._id}
                className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6
                  ${isLocked ? 'border-rose-200 bg-rose-50/5' : 'border-slate-200'}
                `}
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{reqItem.title}</h3>
                    
                    {isLocked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                        <Lock size={11} /> Locked (Limit Reached)
                      </span>
                    ) : hasSubmission ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <CheckCircle size={11} /> Uploaded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                        <Clock size={11} /> Pending
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-sm">{reqItem.description || 'No specific instructions provided.'}</p>
                  
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <span>Format: <span className="uppercase text-slate-700">{reqItem.fileType}</span></span>
                    <span className="text-slate-200">|</span>
                    <span>Max Size: <span className="text-slate-700">{reqItem.maxSize} MB</span></span>
                    {hasSubmission && (
                      <>
                        <span className="text-slate-200">|</span>
                        <span>
                          Uploads: <span className={isLocked ? 'text-rose-600 font-bold' : 'text-slate-700'}>{changeCount}/3</span>
                        </span>
                      </>
                    )}
                  </div>

                  {hasSubmission && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 mt-4 text-xs text-emerald-800 flex items-center justify-between gap-4">
                      <div className="truncate">
                        <span className="font-bold">File: </span>
                        <span className="font-medium text-slate-700 underline truncate">{reqItem.submission.fileName}</span>
                        <span className="text-slate-400"> ({reqItem.submission.fileSize} MB)</span>
                      </div>
                      <a 
                        href={reqItem.submission.fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1 text-emerald-700 hover:text-emerald-950 font-bold shrink-0"
                      >
                        <Download size={13} /> View Upload
                      </a>
                    </div>
                  )}
                  
                  {isLocked && (
                    <div className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-3">
                      <AlertTriangle size={13} />
                      <span>Upload limit reached (3/3). Please contact your trainer/administrator to reset your limit.</span>
                    </div>
                  )}
                </div>

                {/* Upload Button area */}
                <div className="shrink-0 flex items-center justify-end">
                  {isLocked ? (
                    <button 
                      disabled
                      className="bg-slate-100 border border-slate-200 text-slate-400 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-not-allowed shadow-none"
                    >
                      <Lock size={16} />
                      <span>Upload Locked</span>
                    </button>
                  ) : (
                    <label className={`
                      cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200
                      ${hasSubmission 
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700' 
                        : 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white shadow-sm shadow-blue-600/10'
                      }
                      ${uploadingId === reqItem._id ? 'opacity-65 pointer-events-none' : ''}
                    `}>
                      <input 
                        type="file"
                        className="hidden"
                        onChange={e => handleFileUpload(reqItem._id, e.target.files[0], reqItem)}
                        disabled={uploadingId === reqItem._id}
                        accept={
                          reqItem.fileType === 'pdf' ? '.pdf' :
                          reqItem.fileType === 'zip' ? '.zip,.rar,.7z' :
                          reqItem.fileType === 'doc' ? '.doc,.docx' :
                          '*'
                        }
                      />
                      {uploadingId === reqItem._id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                      ) : (
                        <UploadCloud size={16} />
                      )}
                      <span>{hasSubmission ? 'Re-upload Document' : 'Upload Document'}</span>
                    </label>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
