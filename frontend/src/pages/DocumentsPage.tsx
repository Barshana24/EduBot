import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Trash2, UploadCloud, FolderSearch, Check, Info } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { uploadAPI } from '@/services/api'
import PageHeader from '@/components/ui/PageHeader'
import { SUBJECTS, subjectMeta, ACCENTS, EASE } from '@/lib/design'
import type { UploadedDocument } from '@/types'

export default function DocumentsPage() {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [uploading, setUploading] = useState(false)

  const { data, isLoading } = useQuery<{ documents: UploadedDocument[]; count: number }>({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await uploadAPI.listDocuments()
      return res.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => uploadAPI.deleteDocument(docId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['documents'] }); toast.success('Document removed') },
    onError: () => toast.error("Couldn't remove that document"),
  })

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    let success = 0
    for (const file of Array.from(files)) {
      try {
        await uploadAPI.uploadDocument(file, selectedSubject || undefined)
        success++
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        toast.error(msg || `${file.name} failed to upload`)
      }
    }
    if (success > 0) {
      toast.success(`${success} document${success > 1 ? 's' : ''} indexed`)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    }
    setUploading(false)
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-10">
        <PageHeader eyebrow="Documents" title="Teach it your notes" subtitle="Upload PDFs and notes, then ask questions against them in chat." icon={FolderSearch} accent={ACCENTS.rose} />

        <div className="card p-5 mb-6">
          <div className="mb-4">
            <label className="label-eyebrow" htmlFor="d-subject">Tag with a subject</label>
            <select id="d-subject" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="select-field sm:!w-72 !py-2.5 !text-xs">
              <option value="">No subject</option>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div
            role="button" tabIndex={0}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleUpload(e.dataTransfer.files) }}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click() }}
            className="relative rounded-3xl p-10 text-center cursor-pointer transition-all"
            style={{ border: `3px dashed ${dragging ? ACCENTS.violet : 'var(--border-bold)'}`, background: dragging ? `${ACCENTS.violet}1A` : 'transparent' }}
          >
            <input ref={fileRef} type="file" multiple accept=".pdf,.txt,.docx" className="hidden" onChange={(e) => handleUpload(e.target.files)} />

            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid var(--border-soft)', borderTopColor: ACCENTS.violet }} />
                <p className="text-sm font-bold" style={{ color: 'var(--text-mid)' }}>Uploading and indexing</p>
              </div>
            ) : (
              <>
                <motion.div
                  animate={{ y: [0, -7, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: ACCENTS.violet }}
                >
                  <UploadCloud size={20} color="#3A3226" strokeWidth={2.5} />
                </motion.div>
                <p className="text-sm font-bold mb-1.5" style={{ color: 'var(--text-hi)' }}>Drop files here, or click to browse</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-lo)' }}>PDF, TXT, or DOCX · up to 10MB each</p>
              </>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid var(--border-soft)', borderTopColor: ACCENTS.violet }} />
          </div>
        ) : (
          <>
            {data && data.count > 0 && (
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-extrabold uppercase" style={{ letterSpacing: '0.14em', color: 'var(--text-lo)' }}>Indexed</h2>
                <span className="text-[11px] font-bold" style={{ color: 'var(--text-lo)' }}>{data.count} files</span>
              </div>
            )}

            <div className="space-y-2.5">
              <AnimatePresence>
                {data?.documents.map((doc, i) => {
                  const meta = subjectMeta(doc.subject)
                  const Icon = doc.subject ? meta.icon : FileText
                  return (
                    <motion.div
                      key={doc.doc_id} layout
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 24 }}
                      transition={{ delay: Math.min(i * 0.03, 0.25), ease: EASE }}
                      className="card card-interactive p-4 flex items-center gap-3.5"
                    >
                      <span className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: meta.accent }}>
                        <Icon size={16} color="#3A3226" strokeWidth={2.5} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: 'var(--text-hi)' }}>{doc.filename}</p>
                        <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--text-lo)' }}>
                          {doc.subject ? `${doc.subject} · ` : ''}{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'Date unknown'}
                        </p>
                      </div>
                      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex-shrink-0 text-black" style={{ background: ACCENTS.mint }}>
                        <Check size={10} strokeWidth={3} /> Indexed
                      </span>
                      <button onClick={() => deleteMutation.mutate(doc.doc_id)} className="icon-btn !p-2 flex-shrink-0" aria-label={`Remove ${doc.filename}`}>
                        <Trash2 size={14} style={{ color: ACCENTS.rose }} />
                      </button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {data?.count === 0 && (
                <div className="card p-12 text-center">
                  <div className="w-14 h-14 rounded-3xl mx-auto mb-5 flex items-center justify-center" style={{ background: ACCENTS.rose }}>
                    <FileText size={22} color="#3A3226" />
                  </div>
                  <h3 className="font-display text-xl font-extrabold mb-2" style={{ color: 'var(--text-hi)' }}>No documents yet</h3>
                  <p className="text-sm max-w-xs mx-auto font-semibold" style={{ color: 'var(--text-mid)' }}>Upload your lecture notes and EduBot will answer from them.</p>
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex gap-3 mt-6 p-4 rounded-2xl" style={{ background: `${ACCENTS.cyan}30`, border: `1px solid ${ACCENTS.cyan}66` }}>
          <Info size={14} style={{ color: ACCENTS.cyan }} className="flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed font-semibold" style={{ color: 'var(--text-mid)' }}>
            Turn on <strong style={{ color: 'var(--text-hi)' }}>My notes</strong> in the chat toolbar to have EduBot answer from these files instead of general knowledge.
          </p>
        </div>
      </div>
    </div>
  )
}
