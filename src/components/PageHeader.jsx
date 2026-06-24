export default function PageHeader({ title, subtitle, action }) {
  return (
    <div style={s.wrap}>
      <div style={s.left}>
        <div style={s.accent} />
        <div>
          <h1 style={s.title}>{title}</h1>
          {subtitle && <p style={s.sub}>{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

const s = {
  wrap:  {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '1.5rem', background: 'var(--c-bg)', borderRadius: '12px',
    padding: '1rem 1.25rem', border: '1px solid var(--c-border)',
    boxShadow: 'var(--c-shadow-sm)',
  },
  left:  { display: 'flex', alignItems: 'center', gap: '12px' },
  accent:{ width: '4px', height: '36px', borderRadius: '4px',
           background: 'linear-gradient(135deg, var(--c-primary) 0%, #3b5bdb 100%)', flexShrink: 0 },
  title: { fontSize: '18px', fontWeight: '800', color: 'var(--c-primary)', margin: 0 },
  sub:   { fontSize: '12px', color: 'var(--c-muted)', marginTop: '2px' },
}
