import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import Fuse from 'fuse.js'
import { api } from '../api/client'

function normalize(s) { return String(s ?? '').trim() }

function bestMatch(input, list, keys) {
  if (!input) return null
  const fuse = new Fuse(list, { keys, threshold: 0.4, includeScore: true, ignoreLocation: true, useExtendedSearch: false })
  const results = fuse.search(input)
  if (!results.length) return null
  const exact = results[0].score === 0
  return { item: results[0].item, fuzzy: !exact }
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
    almacen:     header.findIndex(h => h.includes('almac')),
    stock:       header.findIndex(h => h.includes('stock') || h.includes('cantidad')),
    min:         header.findIndex(h => h === 'min' || h.includes('mínimo') || h.includes('minimo')),
    max:         header.findIndex(h => h === 'max' || h.includes('máximo') || h.includes('maximo')),
  }
  return rows.slice(1).map((r, i) => ({
    _row:        i + 2,
    sku:         normalize(r[idx.sku]),
    nombre:      normalize(r[idx.nombre]),
    descripcion: normalize(r[idx.descripcion]),
    categoria:   normalize(r[idx.categoria]),
    unidad:      normalize(r[idx.unidad]),
    precio:      normalize(r[idx.precio]),
    almacen:     idx.almacen  >= 0 ? normalize(r[idx.almacen])  : '',
    stock:       idx.stock    >= 0 ? normalize(r[idx.stock])    : '',
    min:         idx.min      >= 0 ? normalize(r[idx.min])      : '',
    max:         idx.max      >= 0 ? normalize(r[idx.max])      : '',
  })).filter(r => r.sku || r.nombre)
}

function validar(filas, categorias, unidades, almacenes) {
  return filas.map(f => {
    const errores = []
    if (!f.sku)    errores.push('SKU vacío')
    if (!f.nombre) errores.push('Nombre vacío')
    const precioNum = Number(f.precio)
    if (f.precio && (isNaN(precioNum) || precioNum < 0)) errores.push('Precio inválido')
    const catMatch = bestMatch(f.categoria, categorias, ['nombre'])
    const uniMatch = bestMatch(f.unidad,    unidades,   ['nombre', 'abreviatura'])
    const almMatch = bestMatch(f.almacen,   almacenes,  ['nombre'])
    if (!catMatch && f.categoria) errores.push(`Categoría "${f.categoria}" no reconocida`)
    if (!uniMatch && f.unidad)    errores.push(`Unidad "${f.unidad}" no reconocida`)
    if (!almMatch && f.almacen)   errores.push(`Almacén "${f.almacen}" no reconocido`)
    const stockNum = f.stock !== '' ? parseInt(f.stock, 10) : null
    const minNum   = f.min   !== '' ? parseInt(f.min,   10) : null
    const maxNum   = f.max   !== '' ? parseInt(f.max,   10) : null
    if (f.stock !== '' && (isNaN(stockNum) || stockNum < 0)) errores.push('Stock inválido')
    if (f.min   !== '' && (isNaN(minNum)   || minNum   < 0)) errores.push('Mínimo inválido')
    if (f.max   !== '' && (isNaN(maxNum)   || maxNum   < 0)) errores.push('Máximo inválido')
    return {
      ...f,
      _cat:      catMatch?.item ?? null,
      _catFuzzy: catMatch?.fuzzy ?? false,
      _uni:      uniMatch?.item ?? null,
      _uniFuzzy: uniMatch?.fuzzy ?? false,
      _alm:      almMatch?.item ?? null,
      _almFuzzy: almMatch?.fuzzy ?? false,
      _precio:   f.precio ? precioNum : null,
      _stock:    f.stock !== '' && !isNaN(stockNum) && stockNum >= 0 ? stockNum : null,
      _min:      f.min   !== '' && !isNaN(minNum)   && minNum   >= 0 ? minNum   : null,
      _max:      f.max   !== '' && !isNaN(maxNum)   && maxNum   >= 0 ? maxNum   : null,
      _errores:  errores,
      _ok:       errores.length === 0,
    }
  })
}

const PAGE_SIZE = 100

export default function ImportarProductosModal({ proveedorId, categorias, unidades, almacenes = [], onClose, onDone }) {
  const inputRef    = useRef()
  const [filas,          setFilas]          = useState([])
  const [fileName,       setFileName]       = useState('')
  const [importing,      setImporting]      = useState(false)
  const [progress,       setProgress]       = useState(null)
  const [done,           setDone]           = useState(false)
  const [page,           setPage]           = useState(0)
  const [defaultAlmId,   setDefaultAlmId]   = useState(almacenes[0]?.id ?? '')

  const sinAlmacenes = almacenes.length === 0

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setDone(false)
    setProgress(null)
    setPage(0)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb  = XLSX.read(ev.target.result, { type: 'array' })
      const raw = parseSheet(wb)
      setFilas(validar(raw, categorias, unidades, almacenes))
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
        const almId = f._alm?.id ?? defaultAlmId
        if (almId && f._stock != null && prod?.id) {
          await api.post('/api/v1/producto-almacen', {
            idAlmacen:  almId,
            idProducto: prod.id,
            stock:      f._stock,
            min:        f._min ?? null,
            max:        f._max ?? null,
            activo:     true,
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

  const validas    = filas.filter(f => f._ok).length
  const invalidas  = filas.filter(f => !f._ok).length
  const totalPages = Math.ceil(filas.length / PAGE_SIZE)
  const filasPage  = filas.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const downloadPlantilla = () => {
    const almNombre = almacenes[0]?.nombre ?? 'Almacén Principal'
    const ws = XLSX.utils.aoa_to_sheet([
      ['SKU', 'Nombre', 'Descripcion', 'Categoria', 'UnidadMedida', 'Precio', 'Almacen', 'Stock', 'Min', 'Max'],
      ['PROD-001', 'Producto ejemplo', 'Descripción opcional',
       categorias[0]?.nombre ?? 'Categoría',
       unidades[0]?.nombre   ?? 'Unidad',
       '100.00',
       almNombre,
       '50', '10', '200'],
    ])
    ws['!cols'] = [14, 22, 24, 16, 16, 10, 20, 8, 8, 8].map(w => ({ wch: w }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Productos')
    XLSX.writeFile(wb, 'plantilla_productos.xlsx')
  }

  const hasAlmacenCol = filas.some(f => f.almacen !== '')
  const hasMinMaxCol  = filas.some(f => f.min !== '' || f.max !== '')

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget && !importing) onClose() }}>
      <div style={s.modal}>

        <div style={s.header}>
          <div>
            <p style={s.title}>Importar productos desde Excel</p>
            <p style={s.sub}>Columnas: SKU · Nombre · Descripcion · Categoria · UnidadMedida · Precio · Almacen · Stock · Min · Max</p>
          </div>
          <button style={s.closeBtn} onClick={onClose} disabled={importing}>✕</button>
        </div>

        <div style={s.body}>
          {/* Advertencia sin almacenes */}
          {sinAlmacenes && (
            <div style={s.warnBanner}>
              <span style={s.warnIcon}>⚠</span>
              <span>Tu empresa no tiene almacenes registrados. Puedes importar productos, pero no se asignará stock. Crea un almacén primero en <strong>Mis Almacenes</strong>.</span>
            </div>
          )}

          <div style={s.uploadRow}>
            <button style={s.uploadBtn} onClick={() => inputRef.current.click()} disabled={importing}>
              📂 {fileName || 'Seleccionar archivo .xlsx'}
            </button>
            <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFile} />
            <button style={s.plantillaBtn} onClick={downloadPlantilla}>⬇ Descargar plantilla</button>
          </div>

          {/* Almacén por defecto */}
          {!sinAlmacenes && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--c-bg-alt)', border: '1px solid var(--c-primary-light)', borderRadius: 8, padding: '10px 14px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text)', whiteSpace: 'nowrap' }}>Almacén por defecto:</span>
              <select style={{ padding: '6px 10px', border: '1.5px solid var(--c-border)', borderRadius: 6, fontSize: 12, color: 'var(--c-text)', background: 'var(--c-bg)', flex: 1, minWidth: 160 }}
                value={defaultAlmId} onChange={e => setDefaultAlmId(e.target.value)}>
                <option value="">— Sin asignar —</option>
                {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
              <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>
                Se usa cuando la fila no tiene columna "Almacen" o no coincide con ninguno.
              </span>
            </div>
          )}

          {filas.length === 0 && (
            <div style={s.hintGrid}>
              <div style={s.hintBox}>
                <p style={s.hintTitle}>Categorías disponibles</p>
                <ul style={s.hintUl}>
                  {categorias.length ? categorias.map(c => <li key={c.id}>{c.nombre}</li>) : <li>—</li>}
                </ul>
              </div>
              <div style={s.hintBox}>
                <p style={s.hintTitle}>Unidades de medida</p>
                <ul style={s.hintUl}>
                  {unidades.length ? unidades.map(u => <li key={u.id}>{u.nombre} ({u.abreviatura})</li>) : <li>—</li>}
                </ul>
              </div>
              <div style={{ ...s.hintBox, ...(sinAlmacenes ? s.hintBoxWarn : {}) }}>
                <p style={s.hintTitle}>Almacenes disponibles</p>
                {sinAlmacenes
                  ? <p style={{ margin: 0, fontSize: 12, color: '#d97706', fontStyle: 'italic' }}>Sin almacenes — columna Almacen/Stock se ignorará</p>
                  : <ul style={s.hintUl}>{almacenes.map(a => <li key={a.id}>{a.nombre}</li>)}</ul>}
              </div>
            </div>
          )}

          {filas.length > 0 && (
            <>
              <div style={{ ...s.summary, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ {validas} listos para importar</span>
                  {invalidas > 0 && <span style={{ color: '#dc2626', fontWeight: 700, marginLeft: 14 }}>✕ {invalidas} con errores (se omitirán)</span>}
                  <span style={{ color: 'var(--c-muted)', marginLeft: 14 }}>{filas.length} filas en total</span>
                </div>
                {totalPages > 1 && (
                  <div style={s.pagNav}>
                    <button style={s.pagBtn} disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</button>
                    <span style={s.pagInfo}>Página {page + 1} / {totalPages}</span>
                    <button style={s.pagBtn} disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)}>›</button>
                  </div>
                )}
              </div>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {['Fila', 'SKU', 'Nombre', 'Descripción', 'Categoría', 'Unidad', 'Precio',
                        ...(hasAlmacenCol ? ['Almacén', 'Stock'] : []),
                        ...(hasMinMaxCol  ? ['Mín', 'Máx'] : []),
                        'Estado'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filasPage.map((f, i) => (
                      <tr key={f._row} style={{ background: f._ok ? (i % 2 === 0 ? 'var(--c-bg)' : 'var(--c-bg-alt)') : '#fef2f2' }}>
                        <td style={{ ...s.td, color: 'var(--c-muted)', fontSize: 11 }}>{f._row}</td>
                        <td style={{ ...s.td, fontFamily: 'monospace', fontWeight: 600 }}>{f.sku || '—'}</td>
                        <td style={s.td}>{f.nombre || '—'}</td>
                        <td style={{ ...s.td, color: 'var(--c-muted)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.descripcion || '—'}</td>
                        <td style={{ ...s.td, color: f._cat ? 'var(--c-text)' : (f.categoria ? '#dc2626' : 'var(--c-muted)') }}>
                          {f._cat
                            ? <>{f._cat.nombre}{f._catFuzzy && <span style={s.fuzzyTag} title={`Escrito: "${f.categoria}"`}>~</span>}</>
                            : f.categoria || '—'}
                        </td>
                        <td style={{ ...s.td, color: f._uni ? 'var(--c-text)' : (f.unidad ? '#dc2626' : 'var(--c-muted)') }}>
                          {f._uni
                            ? <>{f._uni.nombre}{f._uniFuzzy && <span style={s.fuzzyTag} title={`Escrito: "${f.unidad}"`}>~</span>}</>
                            : f.unidad || '—'}
                        </td>
                        <td style={{ ...s.td, fontWeight: f._precio != null ? 600 : 400, color: f._precio != null ? '#059669' : 'var(--c-muted)' }}>
                          {f._precio != null ? `Bs. ${f._precio.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` : '—'}
                        </td>
                        {hasAlmacenCol && <>
                          <td style={{ ...s.td, color: f._alm ? 'var(--c-text)' : (f.almacen ? '#dc2626' : 'var(--c-muted)') }}>
                            {f._alm
                              ? <>{f._alm.nombre}{f._almFuzzy && <span style={s.fuzzyTag} title={`Escrito: "${f.almacen}"`}>~</span>}</>
                              : f.almacen
                                ? <span style={{ color: '#dc2626' }}>{f.almacen}</span>
                                : defaultAlmId
                                  ? <span style={{ color: '#d97706' }}>{almacenes.find(a=>a.id===defaultAlmId)?.nombre ?? '—'} <span style={s.fuzzyTag}>dflt</span></span>
                                  : '—'}
                          </td>
                          <td style={{ ...s.td, color: f._stock != null ? '#059669' : 'var(--c-muted)', fontWeight: f._stock != null ? 600 : 400 }}>
                            {f._stock != null ? f._stock : '—'}
                          </td>
                        </>}
                        {hasMinMaxCol && <>
                          <td style={{ ...s.td, color: f._min != null ? 'var(--c-text)' : 'var(--c-muted)' }}>
                            {f._min != null ? f._min : '—'}
                          </td>
                          <td style={{ ...s.td, color: f._max != null ? 'var(--c-text)' : 'var(--c-muted)', fontWeight: f._max != null ? 600 : 400 }}>
                            {f._max != null ? f._max : '—'}
                          </td>
                        </>}
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
  modal:       { background: 'var(--c-bg)', borderRadius: 14, width: '100%', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(6,23,93,0.2)' },
  header:      { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--c-primary-light)' },
  title:       { margin: '0 0 3px', fontSize: 16, fontWeight: 800, color: 'var(--c-primary)' },
  sub:         { margin: 0, fontSize: 12, color: 'var(--c-muted)' },
  closeBtn:    { background: 'none', border: 'none', fontSize: 16, color: 'var(--c-muted)', cursor: 'pointer', padding: 4, flexShrink: 0 },
  body:        { flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  footer:      { display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '1rem 1.5rem', borderTop: '1px solid var(--c-primary-light)' },

  warnBanner:  { display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e' },
  warnIcon:    { fontSize: 16, flexShrink: 0, marginTop: 1 },

  uploadRow:   { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  uploadBtn:   { padding: '9px 16px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', border: '1.5px dashed var(--c-border)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  plantillaBtn:{ padding: '9px 16px', background: 'var(--c-bg)', color: 'var(--c-muted)', border: '1.5px solid var(--c-border)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },

  hintGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' },
  hintBox:     { background: 'var(--c-bg-alt)', border: '1px solid var(--c-primary-light)', borderRadius: 8, padding: '12px 14px' },
  hintBoxWarn: { borderColor: '#fde68a', background: '#fffbeb' },
  hintTitle:   { margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: .5 },
  hintUl:      { margin: 0, padding: '0 0 0 16px', fontSize: 12, color: 'var(--c-text)', lineHeight: 1.8, maxHeight: 160, overflowY: 'auto' },

  summary:     { fontSize: 13 },
  pagNav:      { display: 'flex', alignItems: 'center', gap: 6 },
  pagBtn:      { padding: '3px 10px', border: '1.5px solid var(--c-border)', borderRadius: 6, background: 'var(--c-bg)', color: 'var(--c-primary)', fontSize: 14, fontWeight: 700, cursor: 'pointer', lineHeight: 1 },
  pagInfo:     { fontSize: 12, color: 'var(--c-muted)', fontWeight: 600, whiteSpace: 'nowrap' },
  tableWrap:   { border: '1px solid var(--c-primary-light)', borderRadius: 8, overflow: 'auto', maxHeight: 300 },
  table:       { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th:          { padding: '8px 12px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', fontWeight: 700, textAlign: 'left', borderBottom: '1px solid var(--c-border)', whiteSpace: 'nowrap', position: 'sticky', top: 0 },
  td:          { padding: '7px 12px', color: 'var(--c-text)', borderBottom: '1px solid var(--c-border-light)' },

  progressWrap:{ background: 'var(--c-bg-subtle)', border: '1px solid var(--c-primary-light)', borderRadius: 8, padding: '12px 14px' },
  progressBar: { height: 6, background: 'linear-gradient(90deg,var(--c-primary),#4f46e5)', borderRadius: 4, marginBottom: 8, transition: 'width .3s' },
  progressText:{ margin: 0, fontSize: 12, color: 'var(--c-text)', fontWeight: 600 },

  cancelBtn:   { padding: '9px 20px', background: 'var(--c-bg)', color: 'var(--c-muted)', border: '1.5px solid var(--c-border)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  importBtn:   { padding: '9px 20px', background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  fuzzyTag:    { display: 'inline-block', marginLeft: 4, fontSize: 10, fontWeight: 700, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 4, padding: '0 4px', cursor: 'default' },
}
