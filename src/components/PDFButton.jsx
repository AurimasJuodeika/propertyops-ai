import { useState } from 'react'
import { Download, Loader } from 'lucide-react'

export default function PDFButton({ label = 'Export PDF', onGenerate, style = {}, className = 'btn-secondary' }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handle = async () => {
    setLoading(true)
    setDone(false)
    try {
      await onGenerate()
      setDone(true)
      setTimeout(() => setDone(false), 2500)
    } catch (e) {
      console.error('PDF error', e)
    }
    setLoading(false)
  }

  return (
    <button
      className={className}
      onClick={handle}
      disabled={loading}
      style={{ ...style, opacity: loading ? 0.7 : 1 }}
    >
      {loading
        ? <><span style={{ width: 13, height: 13, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Generating…</>
        : done
        ? <>✓ Downloaded!</>
        : <><Download size={13} /> {label}</>
      }
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </button>
  )
}
