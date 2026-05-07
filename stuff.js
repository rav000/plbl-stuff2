const storageKey = 'sidebarLists';
    const contentStorageKey = 'listContents';
    const defaultItems = ['Lists'];

    function loadLists() {
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : defaultItems;
        } catch (err) {
            console.warn('Failed to load sidebar lists:', err);
            return defaultItems;
        }
    }

    function saveLists(items) {
        localStorage.setItem(storageKey, JSON.stringify(items));
    }

    function loadListContent(listName) {
        try {
            const saved = localStorage.getItem(contentStorageKey);
            const contents = saved ? JSON.parse(saved) : {};
            return contents[listName] || [];
        } catch (err) {
            console.warn('Failed to load list content:', err);
            return [];
        }
    }

    function saveListContent(listName, items) {
        try {
            const saved = localStorage.getItem(contentStorageKey);
            const contents = saved ? JSON.parse(saved) : {};
            contents[listName] = items;
            localStorage.setItem(contentStorageKey, JSON.stringify(contents));
        } catch (err) {
            console.warn('Failed to save list content:', err);
        }
    }

    function renderLists() {
        const list = loadLists();
        const container = document.getElementById('navList');
        container.innerHTML = '';

        list.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            const link = document.createElement('a');
            link.textContent = item;
            link.href = `#${item.toLowerCase().replace(/\s+/g, '-')}`;
            if (index === 0 && !document.querySelector('.sidebar a.active')) {
                link.classList.add('active');
                renderListContent(item);
            }
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.sidebar a').forEach(el => el.classList.remove('active'));
                link.classList.add('active');
                renderListContent(item);
            });

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-button';
            const trashImg = document.createElement('img');
            trashImg.src = 'img/trash.png';
            trashImg.alt = 'Delete';
            deleteButton.appendChild(trashImg);
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const newList = loadLists();
                newList.splice(index, 1);
                saveLists(newList);
                renderLists();
                // If deleted list was active, switch to first remaining list
                if (link.classList.contains('active') && newList.length > 0) {
                    renderListContent(newList[0]);
                }
            });

            li.appendChild(link);
            li.appendChild(deleteButton);
            container.appendChild(li);
        });
    }

    function renderListContent(listName) {
        const titleElement = document.getElementById('listTitle');
        const itemsContainer = document.getElementById('listItems');
        const completedCount = document.getElementById('completedCount');
        const totalCount = document.getElementById('totalCount');
        const emptyState = document.getElementById('emptyState');

        titleElement.textContent = listName;

        const items = loadListContent(listName);
        itemsContainer.innerHTML = '';

        const completed = items.filter(item => item.completed).length;
        const total = items.length;

        completedCount.textContent = completed;
        totalCount.textContent = total;

        // Show/hide empty state
        if (total === 0) {
            emptyState.style.display = 'block';
            itemsContainer.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            itemsContainer.style.display = 'block';
        }

        items.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = `list-item ${item.completed ? 'completed' : ''}`;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = item.completed || false;
            checkbox.addEventListener('change', () => {
                item.completed = checkbox.checked;
                saveListContent(listName, items);
                renderListContent(listName);
            });

            const textSpan = document.createElement('span');
            textSpan.textContent = item.text;
            textSpan.className = 'item-text';

            const dateSpan = document.createElement('span');
            dateSpan.className = 'item-date';
            dateSpan.textContent = item.date ? new Date(item.date).toLocaleDateString() : '';

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'item-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'edit-item-btn';
            const editImg = document.createElement('img');
            editImg.src = 'img/pencil.png';
            editImg.alt = 'edit';
            editBtn.appendChild(editImg);
            editBtn.addEventListener('click', () => {
                const newText = prompt('Edit item:', item.text);
                if (newText && newText.trim() !== item.text) {
                    item.text = newText.trim();
                    saveListContent(listName, items);
                    renderListContent(listName);
                }
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-item-btn';
            const trashImg = document.createElement('img');
            trashImg.src = 'img/trash.png';
            trashImg.alt = 'delete';
            deleteBtn.appendChild(trashImg);
            deleteBtn.addEventListener('click', () => {
                if (confirm('Delete this item?')) {
                    items.splice(index, 1);
                    saveListContent(listName, items);
                    renderListContent(listName);
                }
            });

            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);

            itemDiv.appendChild(checkbox);
            itemDiv.appendChild(textSpan);
            if (item.date) itemDiv.appendChild(dateSpan);
            itemDiv.appendChild(actionsDiv);
            itemsContainer.appendChild(itemDiv);
        });
    }

    document.getElementById('addButton').addEventListener('click', () => {
        const item = prompt('Masukkan nama list baru:');
        if (!item) return;

        const list = loadLists();
        list.push(item.trim());
        saveLists(list);
        renderLists();
    });

    document.getElementById('addItemButton').addEventListener('click', () => {
        const activeList = document.querySelector('.sidebar a.active');
        if (!activeList) return;

        const listName = activeList.textContent;
        const itemText = prompt('Add new item:');
        if (!itemText) return;

        const items = loadListContent(listName);
        items.push({
            text: itemText.trim(),
            completed: false,
            date: new Date().toISOString()
        });
        saveListContent(listName, items);
        renderListContent(listName);
    });

    document.getElementById('sortButton').addEventListener('click', () => {
        const activeList = document.querySelector('.sidebar a.active');
        if (!activeList) return;

        const listName = activeList.textContent;
        const items = loadListContent(listName);

        // Sort: incomplete first, then by date
        items.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            return new Date(b.date || 0) - new Date(a.date || 0);
        });

        saveListContent(listName, items);
        renderListContent(listName);
    });

    renderLists();