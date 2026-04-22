const input = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');

const folderInput = document.getElementById('folder-input');
const addFolderBtn = document.getElementById('add-folder-btn');
const folderList = document.getElementById('folder-list');
const currentFolderTitle = document.getElementById('current-folder-title');

let currentFolder = 'Umum';

// Load data dari Local Storage saat startup
document.addEventListener('DOMContentLoaded', () => {
    ensureDefaultFolder();
    renderFolders();
    selectFolder(currentFolder);
});

addBtn.addEventListener('click', addTodo);
addFolderBtn.addEventListener('click', addFolder);

// Fitur tambah dengan tombol Enter
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});
folderInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addFolder();
});

function ensureDefaultFolder() {
    // Ensure folders array exists and contains 'Umum'
    const foldersRaw = localStorage.getItem('folders');
    let folders = foldersRaw ? JSON.parse(foldersRaw) : null;
    if (!folders) {
        folders = ['Umum'];
        localStorage.setItem('folders', JSON.stringify(folders));
    } else if (!folders.includes('Umum')) {
        folders.unshift('Umum');
        localStorage.setItem('folders', JSON.stringify(folders));
    }

    // Ensure todos is an object keyed by folder. Migrate legacy array format into 'Umum'
    const todosRaw = localStorage.getItem('todos');
    if (!todosRaw) {
        const todosObj = { 'Umum': [] };
        localStorage.setItem('todos', JSON.stringify(todosObj));
    } else {
        try {
            const parsed = JSON.parse(todosRaw);
            if (Array.isArray(parsed)) {
                // legacy format (array) -> migrate into Umum
                const todosObj = { 'Umum': parsed };
                localStorage.setItem('todos', JSON.stringify(todosObj));
            } else if (parsed && typeof parsed === 'object') {
                // already object: ensure Umum exists
                if (!parsed['Umum']) parsed['Umum'] = [];
                localStorage.setItem('todos', JSON.stringify(parsed));
            } else {
                // unexpected type, reset
                const todosObj = { 'Umum': [] };
                localStorage.setItem('todos', JSON.stringify(todosObj));
            }
        } catch (e) {
            // invalid JSON, reset
            const todosObj = { 'Umum': [] };
            localStorage.setItem('todos', JSON.stringify(todosObj));
        }
    }
}

function addFolder() {
    const name = folderInput.value.trim();
    if (!name) return;
    let folders = JSON.parse(localStorage.getItem('folders') || '[]');
    if (folders.includes(name)) {
        folderInput.value = '';
        return;
    }
    folders.push(name);
    localStorage.setItem('folders', JSON.stringify(folders));

    let todosObj = JSON.parse(localStorage.getItem('todos') || '{}');
    todosObj[name] = [];
    localStorage.setItem('todos', JSON.stringify(todosObj));

    folderInput.value = '';
    renderFolders();
    selectFolder(name);
}

function renderFolders() {
    folderList.innerHTML = '';
    const folders = JSON.parse(localStorage.getItem('folders') || '[]');
    folders.forEach(name => {
        const li = document.createElement('li');
        li.className = 'folder-item';

        const span = document.createElement('span');
        span.textContent = name;
        span.addEventListener('click', () => selectFolder(name));
        li.appendChild(span);

        // Tambahkan tombol hapus untuk folder selain 'Umum'
        if (name !== 'Umum') {
            const del = document.createElement('button');
            del.className = 'folder-delete';
            del.textContent = 'Hapus';
            del.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteFolder(name);
            });
            li.appendChild(del);
        }

        folderList.appendChild(li);
    });
}

function deleteFolder(name) {
    if (!name || name === 'Umum') return;
    const ok = confirm(`Hapus folder "${name}" dan semua tugas di dalamnya?`);
    if (!ok) return;

    // Remove folder from folders array
    const folders = JSON.parse(localStorage.getItem('folders') || '[]');
    const idx = folders.indexOf(name);
    if (idx > -1) folders.splice(idx, 1);
    localStorage.setItem('folders', JSON.stringify(folders));

    // Remove associated todos
    const todosObj = JSON.parse(localStorage.getItem('todos') || '{}');
    if (todosObj.hasOwnProperty(name)) delete todosObj[name];
    localStorage.setItem('todos', JSON.stringify(todosObj));

    // If deleted folder was current, switch to Umum
    if (currentFolder === name) {
        if (folders.includes('Umum')) selectFolder('Umum');
        else if (folders.length) selectFolder(folders[0]);
        else {
            // fallback: recreate Umum
            folders.unshift('Umum');
            localStorage.setItem('folders', JSON.stringify(folders));
            todosObj['Umum'] = todosObj['Umum'] || [];
            localStorage.setItem('todos', JSON.stringify(todosObj));
            selectFolder('Umum');
        }
    } else {
        // re-render folder list to reflect deletion
        renderFolders();
    }
}

function selectFolder(name) {
    currentFolder = name;
    currentFolderTitle.textContent = `Folder: ${name}`;
    // highlight
    Array.from(folderList.children).forEach(li => {
        li.classList.toggle('active', li.textContent === name);
    });
    // render todos
    loadTodosForCurrentFolder();
}

function addTodo() {
    if (input.value.trim() === "") return;

    const todoText = input.value;
    createTodoElement(todoText);
    saveLocalTodos(todoText, currentFolder);
    input.value = "";
}

function createTodoElement(text) {
    const li = document.createElement('li');
    li.innerHTML = `
        <span>${text}</span>
        <button class="delete-btn">Hapus</button>
    `;

    // Klik teks untuk menandai selesai
    li.querySelector('span').addEventListener('click', () => {
        li.classList.toggle('completed');
    });

    // Klik tombol hapus
    li.querySelector('.delete-btn').addEventListener('click', () => {
        li.remove();
        removeLocalTodos(text, currentFolder);
    });

    todoList.appendChild(li);
}

// --- FUNGSI LOCAL STORAGE ---
function saveLocalTodos(todo, folder) {
    const todosObj = JSON.parse(localStorage.getItem('todos') || '{}');
    if (!todosObj[folder]) todosObj[folder] = [];
    todosObj[folder].push(todo);
    localStorage.setItem('todos', JSON.stringify(todosObj));
}

function loadTodosForCurrentFolder() {
    todoList.innerHTML = '';
    const todosObj = JSON.parse(localStorage.getItem('todos') || '{}');
    const arr = todosObj[currentFolder] || [];
    arr.forEach(todo => createTodoElement(todo));
}

function removeLocalTodos(todo, folder) {
    const todosObj = JSON.parse(localStorage.getItem('todos') || '{}');
    const arr = todosObj[folder] || [];
    const idx = arr.indexOf(todo);
    if (idx > -1) arr.splice(idx, 1);
    todosObj[folder] = arr;
    localStorage.setItem('todos', JSON.stringify(todosObj));
}

// Optional: expose for debugging
window.__todoApp = {
    selectFolder, renderFolders, loadTodosForCurrentFolder
};