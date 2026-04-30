export default function Spinner({ size = 'md', center = false }) {
  const el = <span className={`spinner spinner-${size}`} aria-label="Loading..." />
  if (center) return <div className="spinner-center">{el}</div>
  return el
}
