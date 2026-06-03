export function SkeletonLine({ width = '100%', height = 14, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: 6,
      background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      ...style,
    }} />
  )
}

export function SkeletonCard({ rows = 3, style = {} }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, ...style }}>
      <SkeletonLine width="60%" height={16} style={{ marginBottom: 12 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} width={`${90 - i * 10}%`} height={12} style={{ marginBottom: 8 }} />
      ))}
    </div>
  )
}

export function SkeletonStatGrid({ cols = 6 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, marginBottom: 24 }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
          <SkeletonLine width="40%" height={10} style={{ marginBottom: 10 }} />
          <SkeletonLine width="60%" height={28} style={{ marginBottom: 8 }} />
          <SkeletonLine width="70%" height={10} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} height={10} width="70%" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, padding: '14px 16px', borderBottom: ri < rows - 1 ? '1px solid #f8fafc' : 'none' }}>
          {Array.from({ length: cols }).map((_, ci) => (
            <SkeletonLine key={ci} height={12} width={`${60 + Math.random() * 30}%`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function PageSkeleton() {
  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <SkeletonLine width={220} height={24} style={{ marginBottom: 8 }} />
          <SkeletonLine width={320} height={14} />
        </div>
        <SkeletonLine width={110} height={36} style={{ borderRadius: 8 }} />
      </div>
      <SkeletonStatGrid cols={4} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <SkeletonCard rows={4} />
        <SkeletonCard rows={4} />
      </div>
      <SkeletonTable rows={6} cols={5} />
    </div>
  )
}
