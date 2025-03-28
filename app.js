let tasks = [];
let archivedTasks = [];
let completedTasks = [];
let showingArchived = false;
let showingCompleted = false;
let taskLists = [];
let currentTaskListId = null;

document.addEventListener('DOMContentLoaded', () => {
    const savedTasks = localStorage.getItem('tasks');
    const savedArchivedTasks = localStorage.getItem('archivedTasks');
    const savedCompletedTasks = localStorage.getItem('completedTasks');
    
    tasks = savedTasks ? JSON.parse(savedTasks) : [];
    archivedTasks = savedArchivedTasks ? JSON.parse(savedArchivedTasks) : [];
    completedTasks = savedCompletedTasks ? JSON.parse(savedCompletedTasks) : [];
    
    showingArchived = window.location.pathname.includes('archived.html');
    showingCompleted = window.location.pathname.includes('completed.html');

    if (showingArchived) {
        document.querySelector('h1').textContent = 'Archived Tasks';
        const inputSection = document.querySelector('.input-section');
        if (inputSection) inputSection.style.display = 'none';
    }

    if (showingCompleted) {
        document.querySelector('h1').textContent = 'Completed Tasks';
        const inputSection = document.querySelector('.input-section');
        if (inputSection) inputSection.style.display = 'none';
    }

    renderTasks();
    updateArchivedCount();
    updateCompletedCount();
    
    document.querySelector('.section-toggle').addEventListener('click', toggleSection);

    // Load task lists
    const savedTaskLists = localStorage.getItem('taskLists');
    taskLists = savedTaskLists ? JSON.parse(savedTaskLists) : [];
    
    // Add this block to load all tasks on initial page load if no list is selected
    if (!currentTaskListId) {
        tasks = getAllTasks();
    }
    
    updateTaskListSelector();
    
    // Fix the selector change handler
    document.getElementById('taskListSelector').addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        
        if (selectedValue === 'new') {
            // Reset selection to previous value
            e.target.value = currentTaskListId || '';
            // Show dialog
            document.getElementById('newTaskListDialog').showModal();
            return;
        }
        
        if (currentTaskListId) {
            // Save current tasks to current task list
            const oldList = taskLists.find(list => list.id === currentTaskListId);
            if (oldList) {
                oldList.tasks = tasks;
                saveTaskLists();
            }
        }
        
        const newTaskListId = parseInt(selectedValue);
        if (!selectedValue) {
            // "All Tasks" selected - merge tasks from all lists
            tasks = getAllTasks();
            currentTaskListId = null;  // Fix the typo here
        } else {
            // Load selected task list
            const newList = taskLists.find(list => list.id === newTaskListId);
            if (newList) {
                tasks = [...newList.tasks];
                currentTaskListId = newTaskListId;
            }
        }
        
        renderTasks();
    });
});

function addTask() {
    const titleInput = document.getElementById('taskInput');
    const descriptionInput = document.getElementById('taskDescription');
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    
    if (title) {
        tasks.push({
            id: Date.now(),
            text: title,
            description: description,
            completed: false
        });
        titleInput.value = '';
        descriptionInput.value = '';
        saveToLocalStorage();
        renderTasks();
    }
}

function toggleMenu(id) {
    const taskElement = document.querySelector(`li[data-id="${id}"]`);
    const menu = taskElement.querySelector('.task-menu');
    menu.classList.toggle('show');
}

function toggleTask(id) {
    if (showingCompleted) {
        // If in completed view, restore task when unchecked
        const taskToRestore = completedTasks.find(task => task.id === id);
        if (taskToRestore) {
            completedTasks = completedTasks.filter(task => task.id !== id);
            const { completedDate, ...restoredTask } = taskToRestore;
            restoredTask.completed = false;
            tasks.push(restoredTask);
            saveToLocalStorage();
            renderTasks();
            updateCompletedCount();
            
            if (completedTasks.length === 0) {
                window.location.href = 'index.html';
            }
        }
    } else {
        // If in main view, mark task as completed
        const task = tasks.find(t => t.id === id);
        if (task) {
            tasks = tasks.filter(t => t.id !== id);
            completedTasks.push({
                ...task,
                completed: true,
                completedDate: new Date()
            });
            saveToLocalStorage();
            renderTasks();
            updateCompletedCount();
        }
    }
}

function archiveTask(id) {
    const taskToArchive = tasks.find(task => task.id === id);
    if (taskToArchive) {
        tasks = tasks.filter(task => task.id !== id);
        archivedTasks.push({
            ...taskToArchive, 
            archivedDate: new Date(),
            autoArchived: false
        });
        
        saveToLocalStorage();
        renderTasks();
        updateArchivedCount();
        
        const toggleBtn = document.querySelector('.section-toggle');
        toggleBtn.classList.add('highlight');
        setTimeout(() => toggleBtn.classList.remove('highlight'), 1000);
    }
}

function saveToLocalStorage() {
    localStorage.setItem('archivedTasks', JSON.stringify(archivedTasks));
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
    saveTaskLists();
}

function deleteTask(id) {
    if (showingArchived) {
        archivedTasks = archivedTasks.filter(task => task.id !== id);
        saveToLocalStorage();
        renderTasks();
    } else if (showingCompleted) {
        completedTasks = completedTasks.filter(task => task.id !== id);
        saveToLocalStorage();
        renderTasks();
    } else {
        tasks = tasks.filter(task => task.id !== id);
        saveToLocalStorage();
        renderTasks();
    }
}

function toggleSection() {
    if (showingArchived) {
        window.location.href = 'index.html';
    } else if (showingCompleted) {
        window.location.href = 'index.html';
    } else {
        window.location.href = 'archived.html';
    }
}

function renderTasks() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;

    const currentTasks = showingArchived ? archivedTasks : 
                        showingCompleted ? completedTasks : tasks;
    
    taskList.innerHTML = '';
    
    if (showingArchived && archivedTasks.length === 0) {
        taskList.innerHTML = `
            <li class="no-tasks">
                <p>No archived tasks yet</p>
                <button onclick="window.location.href='index.html'" class="back-btn">Return to active tasks</button>
            </li>
        `;
        return;
    }

    if (showingCompleted && completedTasks.length === 0) {
        taskList.innerHTML = `
            <li class="no-tasks">
                <p>No completed tasks yet</p>
                <button onclick="window.location.href='index.html'" class="back-btn">Return to active tasks</button>
            </li>
        `;
        return;
    }

    currentTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `${task.completed ? 'completed' : ''} ${showingArchived ? 'archived' : ''}`;
        li.dataset.id = task.id;
        li.draggable = !showingArchived && !showingCompleted;
        
        li.innerHTML = `
            <div class="checkbox" onclick="toggleTask(${task.id})">
                ${task.completed ? '✓' : ''}
            </div>
            <div class="task-content">
                <div class="task-header">
                    <span class="task-text" title="${task.description || ''}">${task.text}</span>
                    ${showingArchived ? 
                        `<small class="archive-date">
                            Archived: ${new Date(task.archivedDate).toLocaleDateString()}
                        </small>` 
                        : showingCompleted ? 
                        `<small class="completed-date">
                            Completed: ${new Date(task.completedDate).toLocaleDateString()}
                        </small>` 
                        : ''
                    }
                </div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            </div>
            <div class="task-actions">
                ${showingArchived ? 
                    `<button class="action-btn restore-btn" title="Restore Task" onclick="restoreTask(${task.id})">↩️</button>
                     <button class="action-btn delete-btn" title="Delete Permanently" onclick="deleteTask(${task.id})">🗑️</button>` 
                    : showingCompleted ? 
                    `<button class="action-btn delete-btn" title="Delete Permanently" onclick="deleteTask(${task.id})">🗑️</button>` 
                    : `
                    <button class="action-btn edit-btn" title="Edit Task" onclick="editTask(${task.id})">✏️</button>
                    <button class="action-btn archive-btn" title="Archive Task" onclick="archiveTask(${task.id})">📥</button>
                    <button class="action-btn delete-btn" title="Delete Task" onclick="deleteTask(${task.id})">🗑️</button>
                `}
            </div>
        `;
        
        taskList.appendChild(li);
    });

    if (!showingArchived && !showingCompleted) {
        const taskItems = taskList.querySelectorAll('li');
        taskItems.forEach(item => {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragend', handleDragEnd);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('drop', handleDrop);
        });
    }
}

function restoreTask(id) {
    const taskToRestore = archivedTasks.find(task => task.id === id);
    if (taskToRestore) {
        archivedTasks = archivedTasks.filter(task => task.id !== id);
        const { archivedDate, autoArchived, ...restoredTask } = taskToRestore;
        tasks.push(restoredTask);
        
        saveToLocalStorage();
        renderTasks();
        
        if (showingArchived && archivedTasks.length === 0) {
            window.location.href = 'index.html';
        }
    }
}

function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
    const dropId = parseInt(e.target.closest('li').dataset.id);
    
    if (draggedId === dropId) return;

    const draggedIndex = tasks.findIndex(task => task.id === draggedId);
    const dropIndex = tasks.findIndex(task => task.id === dropId);
    
    const [draggedTask] = tasks.splice(draggedIndex, 1);
    tasks.splice(dropIndex, 0, draggedTask);
    
    renderTasks();
}

function showProgressEditor(id) {
    const taskElement = document.querySelector(`li[data-id="${id}"]`);
    const progressEditor = taskElement.querySelector('.progress-editor');
    progressEditor.style.display = 'block';
}

function updateProgress(id, value) {
    const progressValue = parseInt(value);
    const taskElement = document.querySelector(`li[data-id="${id}"]`);
    
    tasks = tasks.map(task =>
        task.id === id ? {...task, progress: progressValue} : task
    );
    
    const progressIndicator = taskElement.querySelector('.progress-indicator');
    const progressText = taskElement.querySelector('.progress-text');
    if (progressIndicator) progressIndicator.style.width = `${progressValue}%`;
    if (progressText) progressText.textContent = `${progressValue}%`;
}

function updateArchivedCount() {
    const archivedCount = document.getElementById('archivedCount');
    if (archivedCount) {
        archivedCount.textContent = archivedTasks.length;
    }
}

function updateCompletedCount() {
    const completedCount = document.getElementById('completedCount');
    if (completedCount) {
        completedCount.textContent = completedTasks.length;
    }
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const taskElement = document.querySelector(`li[data-id="${id}"]`);
    const taskContent = taskElement.querySelector('.task-content');
    const taskActions = taskElement.querySelector('.task-actions');

    // Create task list selector options
    const taskListOptions = taskLists.map(list => 
        `<option value="${list.id}" ${list.id === currentTaskListId ? 'selected' : ''}>
            ${list.name}
        </option>`
    ).join('');

    // Create edit form
    const editForm = document.createElement('div');
    editForm.className = 'edit-form';
    editForm.innerHTML = `
        <input type="text" class="edit-title" value="${task.text}" placeholder="Task title">
        <input type="text" class="edit-description" value="${task.description || ''}" placeholder="Task description (optional)">
        <select class="edit-task-list">
            <option value="">Select Task List</option>
            ${taskListOptions}
        </select>
        <div class="edit-actions">
            <button class="save-btn" onclick="saveEdit(${id})">Save</button>
            <button class="cancel-btn" onclick="cancelEdit(${id})">Cancel</button>
        </div>
    `;

    // Hide original content and show edit form
    taskContent.style.display = 'none';
    taskActions.style.display = 'none';
    taskElement.appendChild(editForm);
    taskElement.classList.add('editing');

    // Focus on title input
    const titleInput = editForm.querySelector('.edit-title');
    titleInput.focus();
}

function saveEdit(id) {
    const taskElement = document.querySelector(`li[data-id="${id}"]`);
    const editForm = taskElement.querySelector('.edit-form');
    const titleInput = editForm.querySelector('.edit-title');
    const descriptionInput = editForm.querySelector('.edit-description');
    const taskListSelect = editForm.querySelector('.edit-task-list');
    const newTaskListId = parseInt(taskListSelect.value);

    const task = tasks.find(t => t.id === id);
    if (task) {
        // Update task details
        task.text = titleInput.value.trim();
        task.description = descriptionInput.value.trim();

        // Move task to new list if changed
        if (newTaskListId && newTaskListId !== currentTaskListId) {
            // Remove from current tasks
            tasks = tasks.filter(t => t.id !== id);
            
            // Add to new task list
            const newList = taskLists.find(list => list.id === newTaskListId);
            if (newList) {
                newList.tasks = newList.tasks || [];
                newList.tasks.push(task);
            }
        }

        saveToLocalStorage();
        renderTasks();
    }

    exitEditMode(id);
}

function cancelEdit(id) {
    exitEditMode(id);
}

function exitEditMode(id) {
    const taskElement = document.querySelector(`li[data-id="${id}"]`);
    const editForm = taskElement.querySelector('.edit-form');
    const taskContent = taskElement.querySelector('.task-content');
    const taskActions = taskElement.querySelector('.task-actions');

    // Remove edit form and show original content
    editForm.remove();
    taskContent.style.display = 'flex';
    taskActions.style.display = 'flex';
    taskElement.classList.remove('editing');
}

function createNewTaskList(event) {
    event.preventDefault();
    const nameInput = document.getElementById('taskListName');
    const name = nameInput.value.trim();
    
    if (name) {
        const newTaskList = {
            id: Date.now(),
            name: name,
            tasks: []
        };
        
        taskLists.push(newTaskList);
        saveTaskLists();
        updateTaskListSelector();
        
        // Switch to new task list
        currentTaskListId = newTaskList.id;
        document.getElementById('taskListSelector').value = currentTaskListId;
        
        // Clear and close dialog
        nameInput.value = '';
        document.getElementById('newTaskListDialog').close();
        
        // Clear current tasks display
        tasks = [];
        renderTasks();
    }
}

function saveTaskLists() {
    // Save current tasks to current task list
    if (currentTaskListId) {
        const currentList = taskLists.find(list => list.id === currentTaskListId);
        if (currentList) {
            currentList.tasks = tasks;
        }
    }
    localStorage.setItem('taskLists', JSON.stringify(taskLists));
}

function updateTaskListSelector() {
    const selector = document.getElementById('taskListSelector');
    
    selector.innerHTML = '<option value="">All Tasks</option>' +
        taskLists.map(list => 
            `<option value="${list.id}" ${list.id === currentTaskListId ? 'selected' : ''}>
                ${list.name}
            </option>`
        ).join('') +
        '<option value="new" class="new-list-option">New List...</option>';
}

function getAllTasks() {
    // Merge tasks from all lists
    const allTasks = taskLists.reduce((acc, list) => {
        return acc.concat(list.tasks || []);
    }, []);
    
    // Remove duplicates based on task ID
    return Array.from(new Map(allTasks.map(task => [task.id, task])).values());
}
