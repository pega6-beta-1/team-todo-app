let tasks = [];
let archivedTasks = [];
let showingArchived = false;

document.addEventListener('DOMContentLoaded', () => {
    renderTasks();
    
    // Add click handler to section toggle button
    document.querySelector('.section-toggle').addEventListener('click', toggleSection);
});

function addTask() {
    const input = document.getElementById('taskInput');
    const task = input.value.trim();
    
    if (task) {
        tasks.push({
            id: Date.now(),
            text: task,
            completed: false
        });
        input.value = '';
        renderTasks();
    }
}

function toggleMenu(id) {
    const taskElement = document.querySelector(`li[data-id="${id}"]`);
    const menu = taskElement.querySelector('.task-menu');
    menu.classList.toggle('show');
}

function toggleTask(id) {
    tasks = tasks.map(task =>
        task.id === id ? {...task, completed: !task.completed} : task
    );
    renderTasks();
}

function archiveTask(id) {
    const taskToArchive = tasks.find(task => task.id === id);
    if (taskToArchive) {
        tasks = tasks.filter(task => task.id !== id);
        archivedTasks.push({...taskToArchive, archivedDate: new Date()});
        renderTasks();
    }
}

function deleteTask(id) {
    if (showingArchived) {
        archivedTasks = archivedTasks.filter(task => task.id !== id);
    } else {
        const taskToDelete = tasks.find(task => task.id === id);
        if (taskToDelete) {
            tasks = tasks.filter(task => task.id !== id);
            archivedTasks.push({...taskToDelete, archivedDate: new Date(), autoArchived: true});
        }
    }
    renderTasks();
}

function toggleSection() {
    showingArchived = !showingArchived;
    renderTasks();
}

function renderTasks() {
    const taskList = document.getElementById('taskList');
    const currentTasks = showingArchived ? archivedTasks : tasks;
    
    // Update section title and input visibility
    document.querySelector('h1').textContent = showingArchived ? 'Archived Tasks' : 'To-Do List';
    document.querySelector('.input-section').style.display = showingArchived ? 'none' : 'flex';
    
    // Update toggle button text
    const toggleBtn = document.querySelector('.section-toggle');
    toggleBtn.textContent = showingArchived ? 
        `Show Active Tasks (${tasks.length})` : 
        `Show Archived Tasks (${archivedTasks.length})`;
    
    taskList.innerHTML = currentTasks.map(task => `
        <li class="${task.completed ? 'completed' : ''} ${showingArchived ? 'archived' : ''}" 
            data-id="${task.id}"
            draggable="${!showingArchived}">
            <div class="checkbox" onclick="toggleTask(${task.id})">
                ${task.completed ? '✓' : ''}
            </div>
            <div class="task-content">
                <div class="task-header">
                    <span class="task-text">${task.text}</span>
                    ${showingArchived ? 
                        `<small class="archive-date">
                            ${task.autoArchived ? 'Deleted' : 'Archived'}: 
                            ${new Date(task.archivedDate).toLocaleDateString()}
                        </small>` 
                        : ''
                    }
                </div>
                ${!showingArchived ? `
                    <div class="progress-bar-container">
                        <div class="progress-indicator" style="width: ${task.progress || 0}%"></div>
                        <span class="progress-text" onclick="showProgressEditor(${task.id})">${task.progress || 0}%</span>
                    </div>
                    <div class="progress-editor" style="display: none;">
                        <input type="range" 
                            class="progress-range" 
                            value="${task.progress || 0}" 
                            min="0" 
                            max="100"
                            oninput="updateProgress(${task.id}, this.value)"
                            onmouseup="this.parentElement.style.display='none'">
                    </div>
                ` : ''}
            </div>
            <div class="task-actions">
                ${showingArchived ? 
                    `<button class="restore-btn" onclick="restoreTask(${task.id})">Restore</button>
                     <button class="delete-btn" onclick="deleteTask(${task.id})">Delete Permanently</button>` 
                    : `
                    <button class="trash-btn" onclick="archiveTask(${task.id})">🗑️</button>
                `}
            </div>
        </li>
    `).join('');

    // Add drag and drop event listeners
    const taskItems = taskList.querySelectorAll('li');
    taskItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
    });
}

// Add new restore function
function restoreTask(id) {
    const taskToRestore = archivedTasks.find(task => task.id === id);
    if (taskToRestore) {
        archivedTasks = archivedTasks.filter(task => task.id !== id);
        const { archivedDate, autoArchived, ...restoredTask } = taskToRestore;
        tasks.push(restoredTask);
        renderTasks();
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
    
    // Reorder tasks array
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
    
    // Update UI without re-render
    const progressIndicator = taskElement.querySelector('.progress-indicator');
    const progressText = taskElement.querySelector('.progress-text');
    if (progressIndicator) progressIndicator.style.width = `${progressValue}%`;
    if (progressText) progressText.textContent = `${progressValue}%`;
}
