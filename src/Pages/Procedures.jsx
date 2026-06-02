import PageHeader from '../components/PageHeader'

export default function Procedures() {
  return (
    <div>
      <PageHeader title="Procedimientos" subtitle="Operaciones especiales" action={null} />
      <div style={styles.box}>
        <p style={styles.icon}>🚧</p>
        <p style={styles.text}>Los procedimientos almacenados no están disponibles en la integración REST.</p>
        <p style={styles.sub}>Usa las páginas del menú para realizar operaciones.</p>
      </div>
    </div>
  )
}

const styles = {
  box: { background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: '12px', padding: '3rem', textAlign: 'center' },
  icon: { fontSize: '32px', margin: '0 0 1rem' },
  text: { margin: '0 0 6px', fontWeight: '600', color: '#334155', fontSize: '15px' },
  sub: { margin: 0, color: '#94a3b8', fontSize: '13px' },
}
