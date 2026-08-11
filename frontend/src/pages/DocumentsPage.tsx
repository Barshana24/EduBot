import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, UploadCloud, ArrowLeft, Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { uploadAPI } from '@/services/api'
import { SUBJECTS, subjectMeta, C, EASE } from '@/lib/design'
import Mascot from '@/components/ui/Mascot'
import type { UploadedDocument } from '@/types'

export default function DocumentsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [subject, setSubject] = useState('')
  const [uploading, setUploading] = useState(false)

  const { data, isLoading } = useQuery<{ documents: UploadedDocument[]; count: number }>({
    queryKey: ['documents'],
    queryFn: async () => (await uploadAPI.listDocuments()).data,
  })

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => uploadAPI.deleteDocument(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Removed')
    },
    onError: () => toast.error("Couldn't remove that file"),
  })

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    let ok = 0
    for (const file of Array.from(files)) {
      try {
        await uploadAPI.uploadDocument(file, subject || undefined)
        ok++
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        toast.error(msg || `${file.name} didn't upload`)
      }
    }
    if (ok > 0) {
      toast.success(`${ok} file${ok > 1 ? 's' : ''} added!`)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    }
    setUploading(false)
  }

  return (
    <div className="page scroll-y">
      <div className="page-inner">
        <button onClick={() => navigate('/profile')} className="btn btn-ghost btn-sm -ml-2 mb-2">
          <ArrowLeft size={17} /> Back
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <Mascot size={92} />
          <h1 className="t-title mt-2">My notes</h1>
          <p className="t-body mt-1">
            Upload your PDFs and I'll answer from them instead of guessing.
          </p>
        </div>

        <label className="block mb-3">
          <span className="t-cap block mb-1.5">Tag with a subject (optional)</span>
          <select
            id="d-subject" value={subject} onChange={(e) => setSubject(e.target.value)}
            className="field field-select"
          >
            <option value="">No subject</option>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <div
          role="button" tabIndex={0}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files) }}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click() }}
          className="card flex flex-col items-center justify-center text-center py-9 mb-6 cursor-pointer transition-colors"
          style={{
            borderStyle: 'dashed',
            borderWidth: 3,
            borderColor: dragging ? C.brand : 'var(--line-strong)',
            background: dragging ? 'var(--brand-soft)' : 'var(--card)',
          }}
        >
          <input
            ref={fileRef} type="file" multiple accept=".pdf,.txt,.docx"
            className="hidden" onChange={(e) => upload(e.target.files)}
          />
          {uploading ? (
            <>
              <Mascot size={64} mood="thinking" />
              <p className="t-head mt-2">Reading your notes…</p>
            </>
          ) : (
            <>
              <span
                className="grid place-items-center mb-3"
                style={{ width: 54, height: 54, borderRadius: 18, background: 'var(--brand-soft)' }}
              >
                <UploadCloud size={26} style={{ color: C.brand }} strokeWidth={2.3} />
              </span>
              <p className="t-head">Drop files here</p>
              <p className="t-small mt-1">or tap to browse · PDF, TXT, DOCX</p>
            </>
          )}
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-8">
            <Mascot size={56} mood="thinking" />
          </div>
        ) : data && data.count > 0 ? (
          <>
            <p className="t-cap mb-3">{data.count} file{data.count > 1 ? 's' : ''} ready</p>
            <div className="space-y-2.5">
              <AnimatePresence>
                {data.documents.map((doc, i) => {
                  const meta = subjectMeta(doc.subject)
                  const Icon = meta.icon
                  return (
                    <motion.div
                      key={doc.doc_id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ delay: Math.min(i * 0.03, 0.25), ease: EASE }}
                      className="card p-3.5 flex items-center gap-3"
                    >
                      <span
                        className="shrink-0 grid place-items-center"
                        style={{ width: 40, height: 40, borderRadius: 14, background: `${meta.colour}22` }}
                      >
                        <Icon size={19} style={{ color: meta.colour }} strokeWidth={2.4} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-display font-semibold truncate" style={{ color: 'var(--ink)' }}>
                          {doc.filename}
                        </span>
                        <span className="t-small flex items-center gap-1 mt-0.5">
                          <Check size={12} color={C.mint} strokeWidth={3} />
                          Ready {doc.subject ? `· ${meta.short}` : ''}
                        </span>
                      </span>
                      <button
                        onClick={() => deleteMutation.mutate(doc.doc_id)}
                        className="icon-btn shrink-0"
                        aria-label={`Remove ${doc.filename}`}
                      >
                        <Trash2 size={17} style={{ color: C.coral }} />
                      </button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="card p-6 text-center">
            <p className="t-head">Nothing here yet</p>
            <p className="t-body mt-1">
              Add a lecture PDF and switch on <strong>My notes</strong> in chat.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
