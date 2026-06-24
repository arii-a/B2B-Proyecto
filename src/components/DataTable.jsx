export default function DataTable({ data, loading, emptyMsg = 'Sin datos.' }) {
  if (loading) return (
    <div style={s.empty}>
      <div style={s.spinner} />
      <span style={{ color: 'var(--c-muted)' }}>Cargando...</span>
    </div>
  )
  if (!data || data.length === 0) return <p style={s.emptyText}>{emptyMsg}</p>

  const cols = Object.keys(data[0])

  return (
    <div style={s.wrapper}>
      <table style={s.table}>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c} style={s.th}>{c.replace(/_/g, ' ')}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'var(--c-bg)' : 'var(--c-bg-subtle)' }}>
              {cols.map(c => (
                <td key={c} style={s.td}>
                  {row[c] === null || row[c] === undefined
                    ? <span style={{ color: '#C5C8D8' }}>—</span>
                    : typeof row[c] === 'boolean'
                      ? (
                        <span style={{
                          display: 'inline-block',
                          width: '10px', height: '10px', borderRadius: '50%',
                          background: row[c] ? '#16a34a' : '#dc2626',
                          boxShadow: row[c] ? '0 0 0 3px #dcfce7' : '0 0 0 3px #fee2e2',
                        }} title={row[c] ? 'Activo' : 'Inactivo'} />
                      )
                      : String(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const s = {
  wrapper: { overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--c-border)', background: 'var(--c-bg)' },
  table:   { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th:      { padding: '11px 14px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', fontWeight: '700',
             textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '1px solid var(--c-border)',
             textTransform: 'capitalize', fontSize: '12px', letterSpacing: '.3px' },
  td:      { padding: '10px 14px', color: 'var(--c-text)', borderBottom: '1px solid var(--c-border-light)', whiteSpace: 'nowrap' },
  empty:   { display: 'flex', alignItems: 'center', gap: '10px', padding: '2.5rem', justifyContent: 'center' },
  emptyText: { color: 'var(--c-muted)', padding: '2rem', fontSize: '13px', textAlign: 'center' },
  spinner: { width: '18px', height: '18px', border: '2px solid var(--c-border)',
             borderTop: '2px solid var(--c-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}
