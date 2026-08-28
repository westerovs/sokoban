const createFieldsetGrid = (panel, title) => {
  const fieldset = document.createElement('fieldset')
  fieldset.className = 'admin-panel__fieldset'

  const legend = document.createElement('legend')
  legend.innerText = title
  fieldset.appendChild(legend)

  const grid = document.createElement('div')
  grid.className = 'admin-panel__fieldset-container'

  fieldset.appendChild(grid)
  panel.appendChild(fieldset)

  return grid
}

const createFieldsetCheckbox = (grid, data, onChange) => {
  const legend = grid.closest('fieldset')?.querySelector('legend')
  const input = document.createElement('input')

  input.id = `cb_${data.key}`
  input.type = 'checkbox'
  input.checked = !!data.value
  input.disabled = !!data.disabled
  input.dataset.key = data.key
  input.setAttribute('aria-label', data.ariaLabel)
  if (data.tooltip) input.title = data.tooltip
  input.addEventListener('change', onChange)

  legend?.classList.add('admin-panel__fieldset-legend--with-checkbox')
  legend?.append(input)

  return input
}

const createCheckboxRow = (data, onChange) => {
  const row = document.createElement('div')
  row.className = 'admin-panel__row'

  row.innerHTML = `
  <label for="cb_${data.key}"${data.tooltip ? ` title="${data.tooltip}"` : ''}>${data.label}</label>
  <input id="cb_${data.key}" type="checkbox" ${data.value ? 'checked' : ''} ${data.disabled ? 'disabled' : ''}>
`

  const input = row.querySelector('input')
  input.dataset.key = data.key
  input.addEventListener('change', onChange)

  return row
}

const createCheckboxItem = (data, onChange) => {
  const item = document.createElement('div')
  item.className = 'admin-panel__fieldset-item'

  item.innerHTML = `
  <label for="cb_${data.key}"${data.tooltip ? ` title="${data.tooltip}"` : ''}>${data.label}</label>
  <input id="cb_${data.key}" type="checkbox" ${data.value ? 'checked' : ''} ${data.disabled ? 'disabled' : ''}>
`

  const input = item.querySelector('input')
  input.dataset.key = data.key
  input.addEventListener('change', onChange)

  return item
}

const createNumberItem = (data, onChange) => {
  const item = document.createElement('div')
  item.className = 'admin-panel__fieldset-item--store'

  item.innerHTML = `
    <label for="num_${data.key}"${data.tooltip ? ` title="${data.tooltip}"` : ''}>${data.label}</label>
    <input
      id="num_${data.key}"
      type="number"
      class="admin-panel__input"
      inputmode="numeric"
      min="${data.min ?? 0}"
      max="${data.max ?? 9999}"
      value="${data.value}"
      ${data.disabled ? 'disabled' : ''}
    >
  `

  const input = item.querySelector('input')
  input.dataset.key = data.key
  input.addEventListener('input', onChange)

  return item
}

const createNumberRow = (data, onChange) => {
  const row = document.createElement('div')
  row.className = 'admin-panel__row'

  row.innerHTML = `
    <label for="num_${data.key}"${data.tooltip ? ` title="${data.tooltip}"` : ''}>${data.label}</label>
    <input
      id="num_${data.key}"
      type="number"
      class="admin-panel__input"
      inputmode="numeric"
      min="${data.min ?? 0}"
      max="${data.max ?? 9999}"
      value="${data.value}"
      ${data.disabled ? 'disabled' : ''}
    >
  `

  const input = row.querySelector('input')
  input.dataset.key = data.key
  input.addEventListener('input', onChange)

  return row
}

const createSelectRow = (data, options, onChange) => {
  const row = document.createElement('div')
  row.className = 'admin-panel__row'

  const opts = options.map((o) => `<option value="${o.value}" ${o.value === data.value ? 'selected' : ''}>${o.label}</option>`).join('')

  row.innerHTML = `
    <label for="sel_${data.key}"${data.tooltip ? ` title="${data.tooltip}"` : ''}>${data.label}</label>
    <select id="sel_${data.key}" class="admin-panel__select" ${data.disabled ? 'disabled' : ''}>${opts}</select>
  `

  const select = row.querySelector('select')
  select.dataset.key = data.key
  select.addEventListener('change', onChange)

  return row
}

const createButton = (text, className, onClick) => {
  const btn = document.createElement('button')
  btn.className = className
  btn.innerText = text
  btn.addEventListener('click', onClick, {once: true})
  return btn
}

export {
  createButton,
  createCheckboxItem,
  createCheckboxRow,
  createFieldsetCheckbox,
  createFieldsetGrid,
  createNumberItem,
  createNumberRow,
  createSelectRow,
}
