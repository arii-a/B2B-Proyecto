import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { api } from '../api/client'

function normalize(s) { return String(s ?? '').trim() }

function levenshtein(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase()
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return dp[m][n]
}

function bestMatch(input, list, key = 'nombre') {
  if (!input) return null
  const q = input.toLowerCase().trim()
  // 1. exact
  let found = list.find(x => x[key]?.toLowerCase() === q)
  if (found) return { item: found, fuzzy: false }
  // 2. contains either way
  found = list.find(x => x[key]?.toLowerCase().includes(q) || q.includes(x[key]?.toLowerCase()))
  if (found) return { item: found, fuzzy: true }
  // 3. Levenshtein — accept if distance <= 40% of the longer string
  let best = null, bestDist = Infinity
  for (const x of list) {
    const d = levenshtein(q, x[key] ?? '')
    const threshold = Math.ceil(Math.max(q.length, (x[key] ?? '').length) * 0.4)
    if (d < bestDist && d <= threshold) { bestDist = d; best = x }
  }
  return best ? { item: best, fuzzy: true } : null
}

function parseSheet(wb) {
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  if (rows.length < 2) return []
  const header = rows[0].map(h => normalize(h).toLowerCase())
  const idx = {
    sku:         header.findIndex(h => h.includes('sku')),
    nombre:      header.findIndex(h => h.includes('nombre')),
    descripcion: header.findIndex(h => h.includes('descrip')),
    categoria:   header.findIndex(h => h.includes('categ')),
    unidad:      header.findIndex(h => h.includes('unidad') || h.includes('medida')),
    precio:      header.findIndex(h => h.includes('precio')),
  }
  return rows.slice(1).map((r, i) => ({
    _row:        i + 2,
    sku:         normalize(r[idx.sku]),
    nombre:      normalize(r[idx.nombre]),
    descripcion: normalize(r[idx.descripcion]),
    categoria:   normalize(r[idx.categoria]),
    unidad:      normalize(r[idx.unidad]),
    precio:      normalize(r[idx.precio]),
  })).filter(r => r.sku || r.nombre)
}

function validar(filas, categorias, unidades) {
  return filas.map(f => {
    const errores = []
    if (!f.sku)    errores.push('SKU vacío')
    if (!f.nombre) errores.push('Nombre vacío')
    const precioNum = Number(f.precio)
    if (f.precio && (isNaN(precioNum) || precioNum < 0)) errores.push('Precio inválido')
    const catMatch = bestMatch(f.categoria, categorias)
    const uniMatch = bestMatch(f.unidad, unidades)
    if (!catMatch && f.categoria) errores.push(`Categoría "${f.categoria}" no reconocida`)
    if (!uniMatch && f.unidad)    errores.push(`Unidad "${f.unidad}" no reconocida`)
    return {
      ...f,
      _cat:      catMatch?.item ?? null,
      _catFuzzy: catMatch?.fuzzy ?? false,
      _uni:      uniMatch?.item ?? null,
      _uniFuzzy: uniMatch?.fuzzy ?? false,
      _precio:   f.precio ? precioNum : null,
      _errores:  errores,
      _ok:       errores.length === 0,
    }
  })
}

export default function ImportarProductosModal({ proveedorId, categorias, unidades, onClose, onDone }) {
  const inputRef    = useRef()
  const [filas,     setFilas]     = useState([])
  const [fileName,  setFileName]  = useState('')
  const [importing, setImporting] = useState(false)
  const [progress,  setProgress]  = useState(null)
  const [done,      setDone]      = useState(false)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setDone(false)
    setProgress(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb  = XLSX.read(ev.target.result, { type: 'array' })
      const raw = parseSheet(wb)
      setFilas(validar(raw, categorias, unidades))
    }
    reader.readAsArrayBuffer(file)
  }

  const handleImport = async () => {
    const validas = filas.filter(f => f._ok)
    if (!validas.length) return
    setImporting(true)
    let errors = 0
    const ahora = new Date().toISOString()
    for (let i = 0; i < validas.length; i++) {
      const f = validas[i]
      try {
        const prod = await api.post('/api/v1/products', {
          sku:            f.sku,
          nombre:         f.nombre,
          descripcion:    f.descripcion || null,
          idCategoria:    f._cat?.id    ?? null,
          idUnidadMedida: f._uni?.id    ?? null,
          idProveedor:    proveedorId,
          activo:         true,
        })
        if (f._precio != null && prod?.id) {
          await api.post('/api/v1/precios-base', {
            precioBase:   f._precio,
            vigenteDesde: ahora,
            vigenteHasta: null,
            idProveedor:  proveedorId,
            idProducto:   prod.id,
          })
        }
      } catch {
        errors++
      }
      setProgress({ done: i + 1, total: validas.length, errors })
    }
    setImporting(false)
    setDone(true)
    onDone()
  }

  const validas   = filas.filter(f => f._ok).length
  const invalidas = filas.filter(f => !f._ok).length

  const downloadPlantilla = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['SKU', 'Nombre', 'Descripcion', 'Categoria', 'UnidadMedida', 'Precio'],
      ['PROD-001', 'Producto ejemplo', 'Descripción opcional',
       categorias[0]?.nombre ?? 'Categoría',
       unidades[0]?.nombre   ?? 'Unidad',
       '100.00'],
    ])
    ws['!cols'] = [14, 22, 24, 16, 16, 10].map(w => ({ wch: w }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Productos')
    XLSX.writeFile(wb, 'plantilla_productos.xlsx')
  }

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget && !importing) onClose() }}>
      <div style={s.modal}>

        <div style={s.header}>
          <div>
            <p style={s.title}>Importar productos desde Excel</p>
            <p style={s.sub}>Columnas: SKU · Nombre · Descripcion · Categoria · UnidadMedida · Precio</p>
          </div>
          <button style={s.closeBtn} onClick={onClose} disabled={importing}>✕</button>
        </div>

        <div style={s.body}>
          <div style={s.uploadRow}>
            <button style={s.uploadBtn} onClick={() => inputRef.current.click()} disabled={importing}>
              📂 {fileName || 'Seleccionar archivo .xlsx'}
            </button>
            <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFile} />
            <button style={s.plantillaBtn} onClick={downloadPlantilla}>⬇ Descargar plantilla</button>
          </div>

          {filas.length === 0 && (
            <div style={s.hintGrid}>
              <div style={s.hintBox}>
                <p style={s.hintTitle}>Categorías disponibles</p>
                <p style={s.hintList}>{categorias.map(c => c.nombre).join(', ') || '—'}</p>
              </div>
              <div style={s.hintBox}>
                <p style={s.hintTitle}>Unidades de medida disponibles</p>
                <p style={s.hintList}>{unidades.map(u => u.nombre).join(', ') || '—'}</p>
              </div>
            </div>
          )}

          {filas.length > 0 && (
            <>
              <div style={s.summary}>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ {validas} listos para importar</span>
                {invalidas > 0 && <span style={{ color: '#dc2626', fontWeight: 700, marginLeft: 14 }}>✕ {invalidas} con errores (se omitirán)</span>}
              </div>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {['Fila', 'SKU', 'Nombre', 'Descripción', 'Categoría', 'Unidad', 'Precio', 'Estado'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((f, i) => (
                      <tr key={i} style={{ background: f._ok ? (i % 2 === 0 ? '#fff' : '#FAFBFD') : '#fef2f2' }}>
                        <td style={{ ...s.td, color: '#9599AE', fontSize: 11 }}>{f._row}</td>
                        <td style={{ ...s.td, fontFamily: 'monospace', fontWeight: 600 }}>{f.sku || '—'}</td>
                        <td style={s.td}>{f.nombre || '—'}</td>
                        <td style={{ ...s.td, color: '#9599AE', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.descripcion || '—'}</td>
                        <td style={{ ...s.td, color: f._cat ? '#1A1D3B' : (f.categoria ? '#dc2626' : '#9599AE') }}>
                          {f._cat
                            ? <>{f._cat.nombre}{f._catFuzzy && <span style={s.fuzzyTag} title={`Escrito: "${f.categoria}"`}>~</span>}</>
                            : f.categoria || '—'}
                        </td>
                        <td style={{ ...s.td, color: f._uni ? '#1A1D3B' : (f.unidad ? '#dc2626' : '#9599AE') }}>
                          {f._uni
                            ? <>{f._uni.nombre}{f._uniFuzzy && <span style={s.fuzzyTag} title={`Escrito: "${f.unidad}"`}>~</span>}</>
                            : f.unidad || '—'}
                        </td>
                        <td style={{ ...s.td, fontWeight: f._precio != null ? 600 : 400, color: f._precio != null ? '#059669' : '#9599AE' }}>
                          {f._precio != null ? `Bs. ${f._precio.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td style={s.td}>
                          {f._ok
                            ? <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 11 }}>✓ OK</span>
                            : <span style={{ color: '#dc2626', fontSize: 11 }} title={f._errores.join(' · ')}>✕ {f._errores[0]}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {progress && (
            <div style={s.progressWrap}>
              <div style={{ ...s.progressBar, width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
              <p style={s.progressText}>
                {done
                  ? `Importación completa — ${progress.done - progress.errors} producto${progress.done - progress.errors !== 1 ? 's' : ''} importados${progress.errors ? `, ${progress.errors} error${progress.errors !== 1 ? 'es' : ''}` : ''}.`
                  : `Importando ${progress.done} de ${progress.total}...`}
              </p>
            </div>
          )}
        </div>

        <div style={s.footer}>
          <button style={s.cancelBtn} onClick={onClose} disabled={importing}>
            {done ? 'Cerrar' : 'Cancelar'}
          </button>
          {!done && (
            <button
              style={{ ...s.importBtn, opacity: (!validas || importing) ? 0.5 : 1 }}
              onClick={handleImport}
              disabled={!validas || importing}
            >
              {importing ? 'Importando...' : `Importar ${validas} producto${validas !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

const s = {
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(6,23,93,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
  modal:       { background: '#fff', borderRadius: 14, width: '100%', maxWidth: 820, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(6,23,93,0.2)' },
  header:      { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #EEF1FB' },
  title:       { margin: '0 0 3px', fontSize: 16, fontWeight: 800, color: '#06175D' },
  sub:         { margin: 0, fontSize: 12, color: '#9599AE' },
  closeBtn:    { background: 'none', border: 'none', fontSize: 16, color: '#9599AE', cursor: 'pointer', padding: 4, flexShrink: 0 },
  body:        { flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  footer:      { display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '1rem 1.5rem', borderTop: '1px solid #EEF1FB' },
  uploadRow:   { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  uploadBtn:   { padding: '9px 16px', background: '#EEF1FB', color: '#06175D', border: '1.5px dashed #C5CADF', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  plantillaBtn:{ padding: '9px 16px', background: '#fff', color: '#9599AE', border: '1.5px solid #DDE0EE', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  hintGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  hintBox:     { background: '#FAFBFD', border: '1px solid #EEF1FB', borderRadius: 8, padding: '12px 14px' },
  hintTitle:   { margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#9599AE', textTransform: 'uppercase', letterSpacing: .5 },
  hintList:    { margin: 0, fontSize: 12, color: '#1A1D3B', lineHeight: 1.6 },
  summary:     { fontSize: 13 },
  tableWrap:   { border: '1px solid #EEF1FB', borderRadius: 8, overflow: 'auto', maxHeight: 300 },
  table:       { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th:          { padding: '8px 12px', background: '#EEF1FB', color: '#06175D', fontWeight: 700, textAlign: 'left', borderBottom: '1px solid #DDE0EE', whiteSpace: 'nowrap', position: 'sticky', top: 0 },
  td:          { padding: '7px 12px', color: '#1A1D3B', borderBottom: '1px solid #F0F2FA' },
  progressWrap:{ background: '#F7F8FC', border: '1px solid #EEF1FB', borderRadius: 8, padding: '12px 14px' },
  progressBar: { height: 6, background: 'linear-gradient(90deg,#06175D,#4f46e5)', borderRadius: 4, marginBottom: 8, transition: 'width .3s' },
  progressText:{ margin: 0, fontSize: 12, color: '#1A1D3B', fontWeight: 600 },
  cancelBtn:   { padding: '9px 20px', background: '#fff', color: '#9599AE', border: '1.5px solid #DDE0EE', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  importBtn:   { padding: '9px 20px', background: '#06175D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  fuzzyTag:    { display: 'inline-block', marginLeft: 4, fontSize: 10, fontWeight: 700, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 4, padding: '0 4px', cursor: 'default' },
}
