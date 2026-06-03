import { useState, useEffect, useRef } from 'react'

export default function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1200, className = '', style = {} }) {
  const [display, setDisplay] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef(null)

  // Start when element enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true) },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    let startTime = null
    const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplay(Math.floor(eased * numericValue))
      if (progress < 1) requestAnimationFrame(step)
      else setDisplay(numericValue) // ensure exact final value
    }
    requestAnimationFrame(step)
  }, [started, value, duration])

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}{typeof value === 'number' ? display.toLocaleString() : display}{suffix}
    </span>
  )
}
