'use strict';

const lookup = document.querySelector('#lookup');
const editor = document.querySelector('#editor');
const equipmentId = document.querySelector('#equipment-id');
const editorTitle = document.querySelector('#editor-title');
const status = document.querySelector('#status');
const save = document.querySelector('#save');
const remove = document.querySelector('#delete');
const reset = document.querySelector('#reset');
const fields = ['name', 'category', 'quantity', 'condition'];
let activeId = '';

async function request(method, id, body) {
  const elementStates = [...document.querySelectorAll('button')];
  elementStates.forEach((button) => { button.disabled = true; });
  status.textContent = 'Working…';
  try {
    const response = await fetch(id ? `/equipment/${encodeURIComponent(id)}` : '/equipment', {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    if (response.status === 204) return null;
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || `Request failed (${response.status}).`);
    return result;
  } finally {
    elementStates.forEach((button) => { button.disabled = false; });
  }
}

function showRecord(record) {
  activeId = record?.equipment_id || '';
  equipmentId.value = activeId;
  editorTitle.textContent = activeId ? 'Edit equipment' : 'Add equipment';
  save.textContent = activeId ? 'Save changes' : 'Create record';
  reset.hidden = remove.hidden = !activeId;
  editor.reset();
  if (record) {
    fields.forEach((field) => { editor.elements[field].value = record[field]; });
  }
}

lookup.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    showRecord(await request('GET', equipmentId.value.trim()));
    status.textContent = 'Equipment loaded.';
  } catch (error) {
    status.textContent = error.message;
  }
});

editor.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const body = Object.fromEntries(new FormData(editor));
    body.quantity = Number(body.quantity);
    const method = activeId ? 'PUT' : 'POST';
    showRecord(await request(method, activeId, body));
    status.textContent = method === 'POST' ? `Created equipment ${activeId}.` : 'Changes saved.';
  } catch (error) {
    status.textContent = error.message;
  }
});

reset.addEventListener('click', () => {
  showRecord(null);
  status.textContent = '';
  editor.elements.name.focus();
});

remove.addEventListener('click', async () => {
  if (!window.confirm('Delete this equipment record?')) return;
  try {
    await request('DELETE', activeId);
    showRecord(null);
    status.textContent = 'Equipment record deleted.';
    editor.elements.name.focus();
  } catch (error) {
    status.textContent = error.message;
  }
});
