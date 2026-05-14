import { useRef, useState } from 'react'
import api from '../api/client'

const TEMPLATE_COLUMNS = [
  { col: 'A', name: 'Student Name',     req: true },
  { col: 'B', name: 'Date of Birth',    req: true,  note: 'DD-MM-YYYY' },
  { col: 'C', name: 'Gender',           req: true,  note: 'Male/Female/Other' },
  { col: 'D', name: 'Class Name',       req: true },
  { col: 'E', name: 'Section Name',     req: false },
  { col: 'F', name: 'Admission Number', req: false, note: 'Auto-generated if empty' },
  { col: 'G', name: 'Parent Name',      req: true },
  { col: 'H', name: 'Parent Mobile',    req: true,  note: '10 digits' },
  { col: 'I', name: 'Parent Email',     req: false },
  { col: 'J', name: 'Blood Group',      req: false },
  { col: 'K', name: 'Address',          req: false },
]

export default function StudentImportModal({ school, onClose, onSuccess }) {
  const [step,        setStep]        = useState(1) // 1=upload, 2=preview, 3=result
  const [file,        setFile]        = useState(null)
  const [dragging,    setDragging]    = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [preview,     setPreview]     = useState(null)
  const [importing,   setImporting]   = useState(false)
  const [result,      setResult]      = useState(null)
  const [filter,      setFilter]      = useState('all') // all | valid | error
  const [error,       setError]       = useState('')
  const fileRef = useRef(null)

  // ── Download CSV template ─────────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get(`/schools/${school.id}/students/import-template`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'student_import_template.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e.response?.data?.message || 'Could not download template')
    }
  }

  const handleFile = (f) => {
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setError('Please upload a CSV or Excel file')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File too large — max 5 MB')
      return
    }
    setError('')
    setFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }

  // ── Preview upload ────────────────────────────────────────────────────────
  const handlePreview = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post(`/schools/${school.id}/students/import-preview`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (res.data.success) {
        setPreview(res.data)
        setStep(2)
      } else {
        setError(res.data.message || 'Preview failed')
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Preview failed')
    } finally {
      setUploading(false)
    }
  }

  // ── Execute import ────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!preview) return
    setImporting(true)
    setError('')
    try {
      const validRows = preview.preview.filter(r => r.status === 'valid')
      const res = await api.post(`/schools/${school.id}/students/import`, { rows: validRows })
      if (res.data.success) {
        setResult(res.data)
        setStep(3)
        onSuccess?.()
      } else {
        setError(res.data.message || 'Import failed')
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const filteredRows = (preview?.preview || [])
    .filter(r => filter === 'all' ? true : r.status === filter)

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, overflowY: 'auto',
      }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: 'min(820px, 100%)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#0F172A,#1E3A5F)', padding: '18px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>📥 Import Students</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>{school.name}</div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8,
            color: '#fff', width: 32, height: 32, fontSize: 16, cursor: 'pointer', fontWeight: 700,
          }}>✕</button>
        </div>

        {/* Stepper */}
        <div style={{
          display: 'flex', padding: '16px 24px', gap: 0, background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0', flexShrink: 0,
        }}>
          {[
            { num: 1, label: 'Upload File' },
            { num: 2, label: 'Preview & Validate' },
            { num: 3, label: 'Import Complete' },
          ].map((sStep, i) => (
            <div key={sStep.num} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: step >= sStep.num ? '#6366F1' : '#E2E8F0',
                  color:      step >= sStep.num ? '#fff'    : '#94A3B8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, flexShrink: 0,
                }}>{step > sStep.num ? '✓' : sStep.num}</div>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: step >= sStep.num ? '#4338CA' : '#94A3B8', whiteSpace: 'nowrap',
                }}>{sStep.label}</span>
              </div>
              {i < 2 && (
                <div style={{
                  flex: 1, height: 2, background: step > sStep.num ? '#6366F1' : '#E2E8F0',
                  margin: '0 12px',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>

          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10,
              padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#B91C1C', fontWeight: 600,
            }}>⚠️ {error}</div>
          )}

          {/* STEP 1 — Upload */}
          {step === 1 && (
            <div>
              <div style={{
                background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 14,
                padding: 20, marginBottom: 24, display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#4338CA' }}>Step 1: Download Template</div>
                  <div style={{ fontSize: 12, color: '#6366F1', marginTop: 4 }}>
                    Fill in student data, then upload below.
                  </div>
                </div>
                <button onClick={handleDownloadTemplate} style={{
                  background: '#6366F1', color: '#fff', border: 'none', borderRadius: 10,
                  padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>📥 Download Template</button>
              </div>

              <div style={{
                background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12,
                padding: 16, marginBottom: 24,
              }}>
                <div style={{
                  fontSize: 12, fontWeight: 800, color: '#0F172A',
                  marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8,
                }}>Template Columns</div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 6,
                }}>
                  {TEMPLATE_COLUMNS.map(col => (
                    <div key={col.col} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12 }}>
                      <span style={{
                        background: col.req ? '#6366F1' : '#94A3B8', color: '#fff',
                        borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 800, flexShrink: 0,
                      }}>{col.col}</span>
                      <div>
                        <span style={{ fontWeight: 600, color: '#374151' }}>{col.name}</span>
                        {col.req && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
                        {col.note && <div style={{ fontSize: 10, color: '#94A3B8' }}>{col.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? '#6366F1' : file ? '#10B981' : '#C7D2FE'}`,
                  borderRadius: 16, padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
                  background: dragging ? '#EEF2FF' : file ? '#ECFDF5' : '#F8FAFF',
                  transition: 'all 0.2s',
                }}>
                <input ref={fileRef} type='file' accept='.csv,.xlsx,.xls' style={{ display: 'none' }}
                  onChange={e => handleFile(e.target.files[0])} />
                <div style={{ fontSize: 40, marginBottom: 12 }}>{file ? '✅' : '📎'}</div>
                {file ? (
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#059669' }}>{file.name}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                      {(file.size / 1024).toFixed(1)} KB · Click to change file
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#4338CA' }}>Drop your file here</div>
                    <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 6 }}>or click to browse</div>
                    <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 8 }}>Supports: CSV, XLSX, XLS · Max 5MB</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2 — Preview */}
          {step === 2 && preview && (
            <div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20,
              }}>
                {[
                  { label: 'Total Rows',       value: preview.total_rows,    color: '#6366F1', bg: '#EEF2FF', icon: '📋' },
                  { label: 'Ready to Import',  value: preview.valid_count,   color: '#10B981', bg: '#ECFDF5', icon: '✅' },
                  { label: 'Rows with Errors', value: preview.invalid_count, color: '#EF4444', bg: '#FEF2F2', icon: '❌' },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: stat.bg, border: `1px solid ${stat.color}22`, borderRadius: 12,
                    padding: '16px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{stat.icon}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: 600 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {preview.invalid_count > 0 && (
                <div style={{
                  background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10,
                  padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#92400E',
                }}>
                  ⚠️ {preview.invalid_count} row(s) have errors and will be skipped. Only{' '}
                  {preview.valid_count} valid rows will be imported. Fix errors in your file and re-upload to import them.
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {[
                  { key: 'all',   label: `All (${preview.total_rows})` },
                  { key: 'valid', label: `✅ Valid (${preview.valid_count})` },
                  { key: 'error', label: `❌ Errors (${preview.invalid_count})` },
                ].map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)} style={{
                    padding: '6px 14px', borderRadius: 20, border: '1px solid #E2E8F0',
                    background: filter === f.key ? '#6366F1' : '#fff',
                    color:      filter === f.key ? '#fff' : '#64748B',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>{f.label}</button>
                ))}
              </div>

              <div style={{
                border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden',
                maxHeight: 340, overflowY: 'auto',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr style={{ background: '#0F172A' }}>
                      {['Row', 'Status', 'Name', 'DOB', 'Gender', 'Class', 'Parent', 'Mobile', 'Errors'].map(h => (
                        <th key={h} style={{
                          padding: '9px 12px', textAlign: 'left', fontSize: 10, fontWeight: 800,
                          color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map(row => (
                      <tr key={row.row} style={{
                        borderBottom: '1px solid #F1F5F9',
                        background: row.status === 'error' ? '#FEF9F9' : '#fff',
                      }}>
                        <td style={{ padding: '9px 12px', fontWeight: 700, color: '#64748B' }}>{row.row}</td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{
                            background: row.status === 'valid' ? '#ECFDF5' : '#FEF2F2',
                            color:      row.status === 'valid' ? '#059669' : '#EF4444',
                            padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800,
                          }}>{row.status === 'valid' ? '✅ Valid' : '❌ Error'}</span>
                        </td>
                        <td style={{ padding: '9px 12px', fontWeight: 600, color: '#0F172A' }}>{row.data.name || '—'}</td>
                        <td style={{ padding: '9px 12px', color: '#64748B' }}>{row.data.dob || '—'}</td>
                        <td style={{ padding: '9px 12px', color: '#64748B' }}>{row.data.gender || '—'}</td>
                        <td style={{ padding: '9px 12px', color: '#64748B' }}>
                          {row.data.class_resolved || row.data.class_name || '—'}
                        </td>
                        <td style={{ padding: '9px 12px', color: '#64748B' }}>{row.data.parent_name || '—'}</td>
                        <td style={{ padding: '9px 12px', color: '#64748B' }}>{row.data.parent_mobile || '—'}</td>
                        <td style={{ padding: '9px 12px' }}>
                          {row.errors.length > 0
                            ? <ul style={{ margin: 0, padding: '0 0 0 14px', color: '#EF4444', fontSize: 11 }}>
                                {row.errors.map((e, i) => <li key={i}>{e}</li>)}
                              </ul>
                            : <span style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>No errors</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3 — Result */}
          {step === 3 && result && (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#059669', marginBottom: 8 }}>
                Import Complete!
              </div>
              <div style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>
                {result.message}
              </div>

              <div style={{
                display: 'inline-grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12,
                background: '#F8FAFC', borderRadius: 12, padding: 18, marginBottom: 24,
              }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#10B981' }}>{result.imported_count}</div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Imported</div>
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#EF4444' }}>{result.failed_count}</div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Failed</div>
                </div>
              </div>

              {result.failed_rows?.length > 0 && (
                <div style={{
                  textAlign: 'left', background: '#FEF2F2', border: '1px solid #FCA5A5',
                  borderRadius: 10, padding: 14, marginBottom: 20,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#B91C1C', marginBottom: 6 }}>Failed Rows:</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#7F1D1D' }}>
                    {result.failed_rows.map((f, i) => <li key={i}>Row {f.row}: {f.error}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid #F1F5F9', background: '#FAFAFA',
          display: 'flex', gap: 10, flexShrink: 0,
        }}>
          {step === 1 && (
            <>
              <button onClick={onClose} style={ftBtnSecondary()}>Cancel</button>
              <button onClick={handlePreview} disabled={!file || uploading} style={ftBtnPrimary(!file || uploading)}>
                {uploading ? 'Validating…' : 'Next — Preview →'}
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button onClick={() => { setPreview(null); setFile(null); setStep(1) }} style={ftBtnSecondary()}>← Back</button>
              <button onClick={handleImport} disabled={!preview?.valid_count || importing} style={ftBtnPrimary(!preview?.valid_count || importing)}>
                {importing ? 'Importing…' : `Import ${preview?.valid_count || 0} Student${preview?.valid_count === 1 ? '' : 's'}`}
              </button>
            </>
          )}
          {step === 3 && (
            <>
              <button onClick={() => { setStep(1); setFile(null); setPreview(null); setResult(null) }} style={ftBtnSecondary()}>
                Import More
              </button>
              <button onClick={onClose} style={ftBtnPrimary(false)}>Done</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const ftBtnPrimary = (disabled) => ({
  flex: 2,
  background: disabled ? '#A5B4FC' : 'linear-gradient(135deg,#6366F1,#4F46E5)',
  color: '#fff', border: 'none', borderRadius: 10, padding: 12,
  fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
  boxShadow: disabled ? 'none' : '0 4px 12px rgba(99,102,241,0.35)',
})

const ftBtnSecondary = () => ({
  flex: 1, background: '#F1F5F9', color: '#64748B', border: 'none',
  borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
})
