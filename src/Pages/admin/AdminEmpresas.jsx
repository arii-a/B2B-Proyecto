import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'

const PAGE_SIZE = 12

const MAIN_TABS   = [{ key: 'directorio', label: 'Directorio' }, { key: 'verificacion', label: 'Verificación' }]
const TIPO_CHIPS  = [{ key: 'todas', label: 'Todas' }, { key: 'empresa', label: 'Solo Empresas' }, { key: 'proveedor', label: 'Solo Proveedores' }]

export default function AdminEmpresas() {
  const [empresas,    setEmpresas]    = useState([])
  const [proveedores, setProveedores] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [loadError,   setLoadError]   = useState(null)

  const [mainTab,  setMainTab]  = useState('directorio')
  const [tipoFilter, setTipoFilter] = useState('todas')
  const [search,   setSearch]   = useState('')
  const [searchBy, setSearchBy] = useState('ambos')
  const [page,     setPage]     = useState(0)
  const [verPage,  setVerPage]  = useState(0)

  const [selected,      setSelected]      = useState(null)
  const [editing,       setEditing]       = useState(false)
  const [editForm,      setEditForm]      = useState({})
  const [saving,        setSaving]        = useState(false)
  const [feedback,      setFeedback]      = useState(null)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const cargar = async (p = 0) => {
    setLoading(true)
    setLoadError(null)
    try {
      const [empRes, provRes] = await Promise.all([
        api.get(`/api/v1/empresas?page=${p}&size=${PAGE_SIZE}&sortBy=nombre`),
        api.get('/api/v1/proveedores'),
      ])
      const empArr  = Array.isArray(empRes)  ? empRes  : (empRes?.content  ?? [])
      const provArr = Array.isArray(provRes) ? provRes : (provRes?.content ?? [])
      setEmpresas(empArr)
      setProveedores(provArr)
      setTotalPages(empRes?.totalPages    ?? 0)
      setTotalElements(empRes?.totalElements ?? 0)
      setPage(p)
    } catch (e) {
      setLoadError(e.message || 'Error cargando datos.')
    }
    setLoading(false)
  }

  useEffect(() => { cargar(0) }, [])

  // Enrich current page with proveedor data
  const enriched = empresas.map(e => ({
    ...e,
    proveedor: proveedores.find(p => p.idEmpresa?.id === e.id) ?? null,
  }))

  // ── Directorio filters (within current backend page) ──
  const filtered = enriched
    .filter(e => {
      if (tipoFilter === 'proveedor') return e.proveedor != null
      if (tipoFilter === 'empresa')   return e.proveedor == null
      return true
    })
    .filter(e => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      if (searchBy === 'nit')    return e.nit?.toLowerCase().includes(q)
      if (searchBy === 'nombre') return e.nombre?.toLowerCase().includes(q)
      return e.nit?.toLowerCase().includes(q) || e.nombre?.toLowerCase().includes(q)
    })

  // ── Verification list — derived from all proveedores (no empresa pagination needed) ──
  const pendientes    = proveedores.filter(p => !p.activo)
  const verTotalPages = Math.ceil(pendientes.length / PAGE_SIZE)
  const verPageSlice  = pendientes.slice(verPage * PAGE_SIZE, (verPage + 1) * PAGE_SIZE)

  // ── Actions ──
  const openDetail = (item) => {
    setSelected(item)
    setEditing(false)
    setFeedback(null)
    setEditForm({
      nombre:      item.nombre      ?? '',
      razonSocial: item.razonSocial ?? '',
      nit:         item.nit         ?? '',
      dominio:     item.dominio     ?? '',
      activo:      item.activo      ?? true,
    })
  }

  const saveEdit = async () => {
    setSaving(true); setFeedback(null)
    try {
      await api.put(`/api/v1/empresas/${selected.id}`, {
        nombre:      editForm.nombre      || null,
        razon_social: editForm.razonSocial || null,
        nit:         editForm.nit         || null,
        dominio:     editForm.dominio     || null,
        activo:      editForm.activo,
      })
      setFeedback({ ok: true, msg: 'Empresa actualizada.' })
      setEditing(false)
      await cargar(page)
    } catch (e) { setFeedback({ ok: false, msg: e.message || 'Error al guardar.' }) }
    setSaving(false)
  }

  const setProvActivo = async (provId, activo) => {
    setSaving(true); setFeedback(null)
    try {
      await api.put(`/api/v1/proveedores/${provId}`, { activo })
      setFeedback({ ok: true, msg: activo ? 'Proveedor aprobado.' : 'Proveedor desactivado.' })
      await cargar(page)
    } catch (e) { setFeedback({ ok: false, msg: e.message || 'Error.' }) }
    setSaving(false)
  }

  const crearProveedor = async (empresaId) => {
    setSaving(true); setFeedback(null)
    try {
      await api.post(`/api/v1/proveedores/${empresaId}`, { activo: false })
      setFeedback({ ok: true, msg: 'Perfil de proveedor creado (pendiente de aprobación).' })
      await cargar(page)
    } catch (e) { setFeedback({ ok: false, msg: e.message || 'Error.' }) }
    setSaving(false)
  }

  const rechazarSolicitud = async (provId) => {
    setSaving(true); setFeedback(null)
    try {
      await api.delete(`/api/v1/proveedores/${provId}`)
      setFeedback({ ok: true, msg: 'Solicitud rechazada. La empresa puede volver a solicitarlo.' })
      setSelected(null)
      await cargar(page)
    } catch (e) { setFeedback({ ok: false, msg: e.message || 'Error al rechazar.' }) }
    setSaving(false)
  }

  const openDetailFromProv = (prov) => {
    setSelected({
      id:          prov.idEmpresa.id,
      nombre:      prov.idEmpresa.nombre,
      razonSocial: prov.idEmpresa.razonSocial,
      nit:         prov.idEmpresa.nit,
      dominio:     prov.idEmpresa.dominio,
      logoUrl:     prov.idEmpresa.logoUrl,
      activo:      true,
      proveedor:   prov,
    })
    setEditing(false)
    setFeedback(null)
  }

  const pendientesCount = pendientes.length

  return (
    <div>
      <PageHeader
        title="Empresas & Proveedores"
        subtitle={`${totalElements} empresas · ${proveedores.filter(p => p.activo).length} proveedores aprobados`}
      />

      {/* ── Main tab bar ── */}
      <div style={s.tabBar}>
        {MAIN_TABS.map(t => (
          <button key={t.key}
            style={{ ...s.tab, ...(mainTab === t.key ? s.tabActive : {}) }}
            onClick={() => { setMainTab(t.key); setSelected(null); setFeedback(null) }}>
            {t.label}
            {t.key === 'verificacion' && pendientesCount > 0 && (
              <span style={s.notifBadge}>{pendientesCount}</span>
            )}
          </button>
        ))}
      </div>

      {loadError && <div style={s.errorBanner}>{loadError}</div>}

      {/* ══════════════ DIRECTORIO ══════════════ */}
      {mainTab === 'directorio' && (
        <>
          {/* Toolbar */}
          <div style={s.toolbar}>
            <div style={s.searchWrap}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9599AE" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <select style={s.searchSelect} value={searchBy}
                onChange={e => { setSearchBy(e.target.value); setPage(0); setSelected(null) }}>
                <option value="ambos">Nombre o NIT</option>
                <option value="nombre">Nombre</option>
                <option value="nit">NIT</option>
              </select>
              <div style={{ width: 1, height: 16, background: 'var(--c-border)', flexShrink: 0 }} />
              <input style={s.searchInput}
                placeholder={searchBy === 'nit' ? 'Buscar por NIT...' : searchBy === 'nombre' ? 'Buscar por nombre...' : 'Buscar...'}
                value={search} onChange={e => { setSearch(e.target.value); setPage(0); setSelected(null) }} />
              {search && <button style={s.clearBtn} onClick={() => { setSearch(''); setPage(0) }}>✕</button>}
            </div>
            <div style={s.chips}>
              {TIPO_CHIPS.map(f => (
                <button key={f.key}
                  style={{ ...s.chip, ...(tipoFilter === f.key ? s.chipActive : {}) }}
                  onClick={() => { setTipoFilter(f.key); setPage(0); setSelected(null) }}>
                  {f.label}
                  <span style={{ ...s.chipCount, ...(tipoFilter === f.key ? s.chipCountActive : {}) }}>
                    {f.key === 'todas'     ? totalElements :
                     f.key === 'proveedor' ? enriched.filter(e => e.proveedor).length :
                                            enriched.filter(e => !e.proveedor).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Table + panel */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {loading ? (
                <div style={s.tableWrap}><p style={s.empty}>Cargando...</p></div>
              ) : filtered.length === 0 ? (
                <div style={s.tableWrap}><p style={s.empty}>Sin resultados.</p></div>
              ) : (
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead><tr>
                      {['Empresa', 'Razón social', 'NIT', 'Dominio', 'Tipo', 'Estado'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {filtered.map((item, i) => {
                        const sel = selected?.id === item.id
                        return (
                          <tr key={item.id}
                            onClick={() => openDetail(item)}
                            style={{
                              background: sel ? 'var(--c-primary-light)' : i % 2 === 0 ? 'var(--c-bg)' : 'var(--c-bg-subtle)',
                              cursor: 'pointer',
                              borderLeft: `3px solid ${sel ? 'var(--c-primary)' : 'transparent'}`,
                            }}>
                            <td style={{ ...s.td, fontWeight: 600 }}>{item.nombre || '—'}</td>
                            <td style={s.td}>{item.razonSocial || '—'}</td>
                            <td style={{ ...s.td, fontFamily: 'monospace' }}>{item.nit || '—'}</td>
                            <td style={s.td}>{item.dominio || '—'}</td>
                            <td style={s.td}>
                              {item.proveedor
                                ? <Chip bg="var(--c-primary-light)" color="var(--c-primary)">Proveedor</Chip>
                                : <Chip bg="var(--c-bg-page)" color="var(--c-muted)">Empresa</Chip>}
                            </td>
                            <td style={s.td}>
                              {item.activo
                                ? <Chip bg="#f0fdf4" color="#16a34a">Activo</Chip>
                                : <Chip bg="#fef2f2" color="#dc2626">Inactivo</Chip>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {totalPages > 1 && (
                    <Paginacion page={page} totalPages={totalPages}
                      totalElements={totalElements} pageSize={PAGE_SIZE}
                      onChange={p => { cargar(p); setSelected(null) }} />
                  )}
                </div>
              )}
            </div>

            {/* Detail panel */}
            {selected && (
              <div style={s.panel}>
                {/* Panel header */}
                <div style={s.panelHead}>
                  <div style={s.panelAvatar}>
                    {selected.logoUrl
                      ? <img src={selected.logoUrl} alt={selected.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 10 }} />
                      : selected.nombre?.charAt(0)?.toUpperCase() ?? 'E'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={s.panelNombre}>{selected.nombre}</p>
                    <span style={{ fontSize: 11, color: selected.activo ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                      ● {selected.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <button style={s.closeBtn} onClick={() => { setSelected(null); setFeedback(null); setEditing(false) }}>✕</button>
                </div>

                {feedback && <FeedbackBanner feedback={feedback} />}

                <div style={s.panelScroll}>
                  {/* Info / Edit section */}
                  <Section title="Datos de la empresa" number="1">
                    {editing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <Field label="Nombre comercial">
                          <input style={s.input} value={editForm.nombre}
                            onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} />
                        </Field>
                        <Field label="Razón social">
                          <input style={s.input} value={editForm.razonSocial}
                            onChange={e => setEditForm(f => ({ ...f, razonSocial: e.target.value }))} />
                        </Field>
                        <Field label="NIT">
                          <input style={s.input} value={editForm.nit}
                            onChange={e => setEditForm(f => ({ ...f, nit: e.target.value }))} />
                        </Field>
                        <Field label="Dominio">
                          <input style={s.input} value={editForm.dominio}
                            onChange={e => setEditForm(f => ({ ...f, dominio: e.target.value }))} />
                        </Field>
                        <Field label="Estado">
                          <div style={{ display: 'flex', gap: 6 }}>
                            {[true, false].map(v => (
                              <button key={String(v)}
                                style={{ ...s.toggleBtn, ...(editForm.activo === v ? s.toggleBtnActive : {}) }}
                                onClick={() => setEditForm(f => ({ ...f, activo: v }))}>
                                {v ? 'Activo' : 'Inactivo'}
                              </button>
                            ))}
                          </div>
                        </Field>
                      </div>
                    ) : (
                      <>
                        <InfoRow label="Nombre comercial"  value={selected.nombre}      />
                        <InfoRow label="Razón social"      value={selected.razonSocial} />
                        <InfoRow label="NIT"               value={selected.nit}         mono />
                        <InfoRow label="Dominio"           value={selected.dominio}     />
                      </>
                    )}
                  </Section>

                  {/* Proveedor section */}
                  <Section title="Estado como proveedor" number="2">
                    {selected.proveedor ? (
                      <>
                        <InfoRow label="Estado verificación"
                          value={selected.proveedor.activo ? 'Aprobado' : 'Pendiente de aprobación'}
                          valueColor={selected.proveedor.activo ? '#16a34a' : '#d97706'} />
                        <InfoRow label="ID proveedor" value={selected.proveedor.id} mono />
                      </>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--c-muted)' }}>
                        Esta empresa no tiene perfil de proveedor.
                      </p>
                    )}
                  </Section>

                  {selected.proveedor && (
                    <Section title="Documentos de verificación" number="3">
                      <DocLink label="Matrícula de Comercio"      url={selected.proveedor.urlMatricula} />
                      <DocLink label="CI Representante (frontal)" url={selected.proveedor.urlCiFrontal} />
                      <DocLink label="CI Representante (reverso)" url={selected.proveedor.urlCiReverso} />
                    </Section>
                  )}
                </div>

                {/* Panel actions */}
                <div style={s.panelActions}>
                  {editing ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ ...s.actionBtn, ...s.actionBtnSecondary, flex: 1 }}
                        onClick={() => { setEditing(false); setFeedback(null) }} disabled={saving}>
                        Cancelar
                      </button>
                      <button style={{ ...s.actionBtn, flex: 2 }} onClick={saveEdit} disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                    </div>
                  ) : (
                    <button style={{ ...s.actionBtn, width: '100%' }} onClick={() => setEditing(true)}>
                      Editar empresa
                    </button>
                  )}

                  {/* Proveedor actions */}
                  {!editing && selected.proveedor ? (
                    selected.proveedor.activo ? (
                      <button style={{ ...s.actionBtn, ...s.actionBtnDanger, width: '100%', marginTop: 8 }}
                        onClick={() => setProvActivo(selected.proveedor.id, false)} disabled={saving}>
                        {saving ? '...' : 'Desactivar como proveedor'}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                        <button style={{ ...s.actionBtn, ...s.actionBtnSuccess, width: '100%' }}
                          onClick={() => setProvActivo(selected.proveedor.id, true)} disabled={saving}>
                          {saving ? '...' : '✓ Aprobar como proveedor'}
                        </button>
                        <button style={{ ...s.actionBtn, ...s.actionBtnDanger, width: '100%' }}
                          onClick={() => rechazarSolicitud(selected.proveedor.id)} disabled={saving}>
                          {saving ? '...' : '✕ Rechazar solicitud'}
                        </button>
                      </div>
                    )
                  ) : !editing && (
                    <button style={{ ...s.actionBtn, ...s.actionBtnSecondary, width: '100%', marginTop: 8 }}
                      onClick={() => crearProveedor(selected.id)} disabled={saving}>
                      {saving ? '...' : 'Crear perfil proveedor'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════ VERIFICACIÓN ══════════════ */}
      {mainTab === 'verificacion' && (
        <>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {loading ? (
                <div style={s.tableWrap}><p style={s.empty}>Cargando...</p></div>
              ) : pendientes.length === 0 ? (
                <div style={s.tableWrap}><p style={s.empty}>No hay solicitudes pendientes.</p></div>
              ) : (
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead><tr>
                      {['Empresa', 'NIT', 'Dominio', 'Estado'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {verPageSlice.map((prov, i) => {
                        const sel = selected?.id === prov.idEmpresa?.id
                        return (
                          <tr key={prov.id}
                            onClick={() => { openDetailFromProv(prov); setFeedback(null) }}
                            style={{
                              background: sel ? 'var(--c-primary-light)' : i % 2 === 0 ? 'var(--c-bg)' : 'var(--c-bg-subtle)',
                              cursor: 'pointer',
                              borderLeft: `3px solid ${sel ? 'var(--c-primary)' : 'transparent'}`,
                            }}>
                            <td style={{ ...s.td, fontWeight: 600 }}>{prov.idEmpresa?.nombre || '—'}</td>
                            <td style={{ ...s.td, fontFamily: 'monospace' }}>{prov.idEmpresa?.nit || '—'}</td>
                            <td style={s.td}>{prov.idEmpresa?.dominio || '—'}</td>
                            <td style={s.td}><Chip bg="#fffbeb" color="#d97706">Pendiente</Chip></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {verTotalPages > 1 && (
                    <Paginacion page={verPage} totalPages={verTotalPages}
                      totalElements={pendientes.length} pageSize={PAGE_SIZE}
                      onChange={p => { setVerPage(p); setSelected(null) }} />
                  )}
                </div>
              )}
            </div>

            {/* Verification detail panel */}
            {selected && (
              <div style={s.panel}>
                <div style={s.panelHead}>
                  <div style={s.panelAvatar}>
                    {selected.logoUrl
                      ? <img src={selected.logoUrl} alt={selected.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 10 }} />
                      : selected.nombre?.charAt(0)?.toUpperCase() ?? 'E'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={s.panelNombre}>{selected.nombre}</p>
                    <span style={{ fontSize: 11, color: 'var(--c-muted)', fontWeight: 500 }}>
                      {selected.razonSocial || 'Sin razón social'}
                    </span>
                  </div>
                  <button style={s.closeBtn} onClick={() => { setSelected(null); setFeedback(null) }}>✕</button>
                </div>

                {feedback && <FeedbackBanner feedback={feedback} />}

                <div style={s.panelScroll}>
                  <Section title="Identificación" number="1">
                    <InfoRow label="Nombre comercial"  value={selected.nombre}      />
                    <InfoRow label="Razón social"      value={selected.razonSocial} />
                    <InfoRow label="NIT"               value={selected.nit}         mono />
                    <InfoRow label="Dominio"           value={selected.dominio}     />
                  </Section>
                  <Section title="Estado verificación" number="2">
                    {selected.proveedor ? (
                      <InfoRow label="Estado"
                        value={selected.proveedor.activo ? 'Aprobado' : 'Pendiente de aprobación'}
                        valueColor={selected.proveedor.activo ? '#16a34a' : '#d97706'} />
                    ) : (
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--c-muted)' }}>Sin solicitud enviada.</p>
                    )}
                  </Section>

                  {selected.proveedor && (
                    <Section title="Documentos adjuntos" number="3">
                      <DocLink label="Matrícula de Comercio"      url={selected.proveedor.urlMatricula} />
                      <DocLink label="CI Representante (frontal)" url={selected.proveedor.urlCiFrontal} />
                      <DocLink label="CI Representante (reverso)" url={selected.proveedor.urlCiReverso} />
                    </Section>
                  )}
                </div>

                <div style={s.panelActions}>
                  {selected.proveedor && !selected.proveedor.activo && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button style={{ ...s.actionBtn, ...s.actionBtnSuccess, width: '100%' }}
                        onClick={() => setProvActivo(selected.proveedor.id, true)} disabled={saving}>
                        {saving ? 'Procesando...' : '✓ Aprobar como proveedor'}
                      </button>
                      <button style={{ ...s.actionBtn, ...s.actionBtnDanger, width: '100%' }}
                        onClick={() => rechazarSolicitud(selected.proveedor.id)} disabled={saving}>
                        {saving ? 'Procesando...' : '✕ Rechazar solicitud'}
                      </button>
                    </div>
                  )}
                  {selected.proveedor && selected.proveedor.activo && (
                    <button style={{ ...s.actionBtn, ...s.actionBtnDanger, width: '100%' }}
                      onClick={() => setProvActivo(selected.proveedor.id, false)} disabled={saving}>
                      {saving ? 'Procesando...' : '✕ Desactivar proveedor'}
                    </button>
                  )}
                  {!selected.proveedor && (
                    <button style={{ ...s.actionBtn, width: '100%' }}
                      onClick={() => crearProveedor(selected.id)} disabled={saving}>
                      {saving ? '...' : 'Crear perfil proveedor'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Small components ────────────────────────────────────────────────────── */

function Section({ number, title, children }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--c-primary-light)', color: 'var(--c-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10, flexShrink: 0 }}>
          {number}
        </span>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 12, color: 'var(--c-text)' }}>{title}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  )
}

function InfoRow({ label, value, mono, valueColor }) {
  const empty = value == null || value === ''
  return (
    <div>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: .4 }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600,
        color: empty ? '#C4C7D6' : valueColor ?? 'var(--c-text)',
        fontStyle: empty ? 'italic' : 'normal',
        fontFamily: mono ? 'monospace' : 'inherit' }}>
        {empty ? 'No proporcionado' : value}
      </p>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: .4 }}>{label}</p>
      {children}
    </div>
  )
}

function Chip({ bg, color, children }) {
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color }}>
      {children}
    </span>
  )
}

function DocLink({ label, url }) {
  const isPdf = url?.toLowerCase().endsWith('.pdf')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: .4, minWidth: 140 }}>{label}</span>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid var(--c-border)' }}>
          {isPdf ? '📄' : '🖼'} Ver {isPdf ? 'PDF' : 'imagen'}
        </a>
      ) : (
        <span style={{ fontSize: 12, color: '#C4C7D6', fontStyle: 'italic' }}>No proporcionado</span>
      )}
    </div>
  )
}

function FeedbackBanner({ feedback }) {
  return (
    <div style={{ margin: '0 1rem 8px', padding: '8px 12px', borderRadius: 8, fontSize: 12,
      background: feedback.ok ? '#f0fdf4' : '#fef2f2',
      color:      feedback.ok ? '#16a34a' : '#dc2626',
      border: `1px solid ${feedback.ok ? '#bbf7d0' : '#fca5a5'}` }}>
      {feedback.msg}
    </div>
  )
}

function Paginacion({ page, totalPages, totalElements, pageSize, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid var(--c-border-light)' }}>
      <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>
        {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)} de {totalElements}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button style={s.pageBtn} onClick={() => onChange(page - 1)} disabled={page === 0}>‹</button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} style={{ ...s.pageBtn, ...(i === page ? s.pageBtnActive : {}) }} onClick={() => onChange(i)}>{i + 1}</button>
        ))}
        <button style={s.pageBtn} onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1}>›</button>
      </div>
    </div>
  )
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = {
  tabBar:       { display: 'flex', gap: 4, marginBottom: '1rem', background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 10, padding: 4 },
  tab:          { flex: 1, padding: '8px 14px', border: 'none', borderRadius: 7, background: 'transparent', fontSize: 13, fontWeight: 500, color: 'var(--c-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  tabActive:    { background: 'var(--c-primary-light)', color: 'var(--c-primary)', fontWeight: 700 },
  notifBadge:   { padding: '1px 7px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#d97706', color: '#fff' },

  toolbar:      { display: 'flex', gap: '12px', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' },
  searchWrap:   { display: 'flex', alignItems: 'center', gap: 8, background: 'var(--c-bg)', border: '1.5px solid var(--c-border)', borderRadius: 8, padding: '8px 12px', flex: 1, minWidth: 200 },
  searchInput:  { border: 'none', outline: 'none', fontSize: 13, color: 'var(--c-text)', flex: 1, background: 'transparent' },
  searchSelect: { border: 'none', outline: 'none', fontSize: 12, fontWeight: 600, color: 'var(--c-primary)', background: 'transparent', cursor: 'pointer', paddingRight: 4 },
  clearBtn:     { border: 'none', background: 'none', color: 'var(--c-muted)', cursor: 'pointer', fontSize: 12, padding: 0 },
  chips:        { display: 'flex', gap: 6 },
  chip:         { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', border: '1.5px solid var(--c-border)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--c-muted)', background: 'var(--c-bg)', cursor: 'pointer' },
  chipActive:   { background: 'var(--c-primary)', color: '#fff', borderColor: 'var(--c-primary)' },
  chipCount:    { fontSize: 11, background: 'var(--c-primary-light)', color: 'var(--c-muted)', borderRadius: 20, padding: '1px 7px', fontWeight: 700 },
  chipCountActive:{ background: 'rgba(255,255,255,0.2)', color: '#fff' },

  errorBanner:  { background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12 },

  tableWrap:    { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 10, overflow: 'hidden' },
  table:        { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:           { padding: '10px 14px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', fontWeight: 700, textAlign: 'left', borderBottom: '1px solid var(--c-border)', whiteSpace: 'nowrap' },
  td:           { padding: '10px 14px', color: 'var(--c-text)', borderBottom: '1px solid var(--c-border-light)', whiteSpace: 'nowrap' },
  empty:        { padding: '2.5rem', color: 'var(--c-muted)', fontSize: 14, textAlign: 'center', margin: 0 },

  pageBtn:      { padding: '4px 10px', fontSize: 12, fontWeight: 600, background: 'var(--c-bg)', color: 'var(--c-muted)', border: '1px solid var(--c-border)', borderRadius: 6, cursor: 'pointer' },
  pageBtnActive:{ background: 'var(--c-primary)', color: '#fff', borderColor: 'var(--c-primary)' },

  panel:        { width: 300, flexShrink: 0, background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 10, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 220px)', overflow: 'hidden' },
  panelHead:    { display: 'flex', alignItems: 'center', gap: 10, padding: '1rem', borderBottom: '1px solid var(--c-border-light)', flexShrink: 0 },
  panelAvatar:  { width: 56, height: 56, borderRadius: 10, background: 'var(--c-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, flexShrink: 0, overflow: 'hidden' },
  panelNombre:  { margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--c-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  closeBtn:     { background: 'none', border: 'none', color: 'var(--c-muted)', cursor: 'pointer', fontSize: 14, flexShrink: 0, padding: 4 },
  panelScroll:  { flex: 1, overflowY: 'auto', padding: '1rem' },
  panelActions: { padding: '1rem', borderTop: '1px solid var(--c-border-light)', flexShrink: 0 },

  input:        { width: '100%', padding: '8px 10px', border: '1.5px solid var(--c-border)', borderRadius: 7, fontSize: 13, color: 'var(--c-text)', boxSizing: 'border-box', outline: 'none', background: 'var(--c-input-bg)' },
  toggleBtn:    { flex: 1, padding: '7px 10px', border: '1.5px solid var(--c-border)', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--c-bg)', color: 'var(--c-muted)' },
  toggleBtnActive:{ background: 'var(--c-primary)', color: '#fff', borderColor: 'var(--c-primary)' },

  actionBtn:        { padding: '10px 14px', background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  actionBtnSecondary:{ background: 'var(--c-bg)', color: 'var(--c-text)', border: '1.5px solid var(--c-border)' },
  actionBtnSuccess:  { background: '#16a34a', color: '#fff', border: 'none' },
  actionBtnDanger:   { background: 'var(--c-bg)', color: '#dc2626', border: '1.5px solid #fca5a5' },

}
