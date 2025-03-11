const MAX_TASKS = 20;

// Load tasks when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
});

function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    tasks.forEach(task => {
        const li = createTaskElement(task.text, task.description, task.progress || 0);
        if (task.completed) {
            li.classList.add('completed');
        }
        document.getElementById('taskList').appendChild(li);
    });
    updateTaskScaling(); // Add this line
}

function saveTasks() {
    const tasks = [];
    document.querySelectorAll('.task').forEach(task => {
        tasks.push({
            text: task.querySelector('.task-text').textContent,
            description: task.querySelector('.task-description')?.textContent || '',
            completed: task.classList.contains('completed'),
            progress: parseInt(task.querySelector('.progress-slider').value)
        });
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function handleAddTask() {
    const input = document.getElementById('taskInput');
    const descInput = document.getElementById('descriptionInput');
    const taskText = input.value.trim();
    const description = descInput.value.trim();
    
    if (!taskText) return;
    
    const currentTasks = document.querySelectorAll('.task').length;
    
    if (currentTasks >= MAX_TASKS) {
        alert("Please complete some existing tasks first! Maximum limit is 20 tasks.");
        return;
    }
    
    addTask(taskText, description);
    input.value = '';
    descInput.value = '';
}

function addTask(taskText, description = '') {
    const taskList = document.getElementById('taskList');
    const li = createTaskElement(taskText, description);
    taskList.appendChild(li);
    updateTaskScaling(); // Add this line
    saveTasks();
}

function createTaskElement(taskText, description, progress = 0) {
    const li = document.createElement('li');
    li.className = 'task';
    li.draggable = true;
    li.innerHTML = `
        <div class="drag-handle">⋮⋮</div>
        <div class="task-progress">
            <span class="progress-value">${progress}%</span>
        </div>
        <input type="checkbox" class="task-checkbox" onclick="toggleComplete(this)">
        <div class="task-content">
            <span class="task-text">${taskText}</span>
            ${description ? `<span class="task-description">${description}</span>` : ''}
        </div>
        <div class="edit-form">
            <input type="text" class="edit-title" value="${taskText}">
            <input type="text" class="edit-description" value="${description || ''}">
            <button class="save-btn" onclick="saveEdit(this.closest('.task'))">Save Changes</button>
        </div>
        <div class="task-actions">
            <button onclick="toggleComplete(this)">✓</button>
            <button class="task-menu-btn" onclick="toggleMenu(this)">⋮</button>
            <div class="task-menu">
                <button onclick="editTask(this)">Edit Task</button>
                <button onclick="showProgressControl(this)">Set Progress</button>
                <button onclick="archiveTask(this)">Archive Task</button>
                <div class="progress-control" style="display: none;">
                    <input type="range" class="progress-slider" min="0" max="100" value="${progress}" 
                           oninput="updateProgress(this)">
                    <button class="progress-save-btn" onclick="saveProgress(this)">Save Progress</button>
                </div>
            </div>
        </div>
    `;

    const dragHandle = li.querySelector('.drag-handle');
    
    // Only start drag when using the drag handle
    li.draggable = false;
    dragHandle.addEventListener('mousedown', () => {
        li.draggable = true;
    });
    li.addEventListener('mouseup', () => {
        li.draggable = false;
    });
    li.addEventListener('dragend', () => {
        li.draggable = false;
    });

    // Add drag event listeners
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);
    li.addEventListener('dragenter', handleDragEnter);
    li.addEventListener('dragleave', handleDragLeave);

    // Close all menus when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.task-menu-btn')) {
            document.querySelectorAll('.task-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });

    return li;
}

function showProgressControl(button) {
    const progressControl = button.parentElement.querySelector('.progress-control');
    progressControl.style.display = progressControl.style.display === 'none' ? 'block' : 'none';
    event.stopPropagation();
}

function updateProgress(slider) {
    const value = slider.value;
    const task = slider.closest('.task');
    // Only update the preview while sliding
    slider.parentElement.querySelector('.progress-save-btn').style.display = 'block';
}

function saveProgress(button) {
    const task = button.closest('.task');
    const slider = task.querySelector('.progress-slider');
    const value = slider.value;
    
    // Update the visible progress value
    task.querySelector('.progress-value').textContent = value + '%';
    
    // Hide the progress control and save button
    button.style.display = 'none';
    button.closest('.progress-control').style.display = 'none';
    button.closest('.task-menu').classList.remove('show');
    
    saveTasks();
}

let draggedTask = null;

function handleDragStart(e) {
    // Prevent drag if clicking checkbox or complete button
    if (e.target.type === 'checkbox' || e.target.tagName === 'BUTTON') {
        e.preventDefault();
        return;
    }
    draggedTask = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    if (this === draggedTask) return;

    const taskList = document.getElementById('taskList');
    const tasks = [...taskList.children];
    const draggedIndex = tasks.indexOf(draggedTask);
    const droppedIndex = tasks.indexOf(this);

    if (draggedIndex < droppedIndex) {
        this.parentNode.insertBefore(draggedTask, this.nextSibling);
    } else {
        this.parentNode.insertBefore(draggedTask, this);
    }

    this.classList.remove('drag-over');
    draggedTask.classList.remove('dragging');
    updateTaskScaling(); // Add this line
    saveTasks();
}

function toggleComplete(element) {
    const task = element.closest('.task');
    task.classList.toggle('completed');
    
    if (element.type === 'checkbox' && element.checked) {
        // Add transition class for smooth fade out
        task.classList.add('removing');
        // Trigger immediate scale update for other tasks
        const tasks = document.querySelectorAll('.task:not(.removing)');
        tasks.forEach((otherTask, index) => {
            const scale = 1.2 - (index * 0.05);
            const fontSize = 18 - (index * 0.8);
            otherTask.style.transform = `scale(${Math.max(scale, 0.7)})`;
            otherTask.querySelector('.task-text').style.fontSize = 
                `${Math.max(fontSize, 12)}px`;
            otherTask.style.marginBottom = 
                `${Math.max(24 - (index * 2), 12)}px`;
        });
        
        setTimeout(() => {
            task.remove();
            updateTaskScaling();
            saveTasks();
        }, 300);
    }
    saveTasks();
}

// Add event listener for Enter key
document.getElementById('taskInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handleAddTask();
    }
});

function updateTaskScaling() {
    const tasks = document.querySelectorAll('.task');
    const totalTasks = tasks.length;
    
    tasks.forEach((task, index) => {
        // Only scale down until the 10th task
        const effectiveIndex = Math.min(index, 9);
        const scale = 1.2 - (effectiveIndex * 0.05);
        const fontSize = 16 - (effectiveIndex * 0.15);
        
        task.style.transform = `scale(${Math.max(scale, 0.7)})`;
        task.querySelector('.task-text').style.fontSize = `${Math.max(fontSize, 15)}px`;
        task.style.marginBottom = `${Math.max(24 - (effectiveIndex * 2), 12)}px`;
    });
}

function toggleMenu(button) {
    event.stopPropagation();
    const menu = button.nextElementSibling;
    document.querySelectorAll('.task-menu.show').forEach(m => {
        if (m !== menu) m.classList.remove('show');
    });
    menu.classList.toggle('show');
}

function editTask(button) {
    const task = button.closest('.task');
    const menu = button.closest('.task-menu');
    menu.classList.remove('show');
    task.classList.add('editing');
    
    // Focus on the title input
    const titleInput = task.querySelector('.edit-title');
    titleInput.focus();
    
    // Remove automatic save on blur
    task.querySelector('.edit-description').onblur = null;
}

function saveEdit(task) {
    const titleInput = task.querySelector('.edit-title');
    const descInput = task.querySelector('.edit-description');
    const newTitle = titleInput.value.trim();
    const newDesc = descInput.value.trim();
    
    if (newTitle) {
        task.querySelector('.task-text').textContent = newTitle;
        const descEl = task.querySelector('.task-description');
        if (newDesc) {
            if (descEl) {
                descEl.textContent = newDesc;
            } else {
                task.querySelector('.task-content').insertAdjacentHTML(
                    'beforeend',
                    `<span class="task-description">${newDesc}</span>`
                );
            }
        } else if (descEl) {
            descEl.remove();
        }
        
        task.classList.remove('editing');
        saveTasks();
    }
}

function archiveTask(button) {
    const task = button.closest('.task');
    task.classList.add('removing');
    setTimeout(() => {
        task.remove();
        updateTaskScaling();
        saveTasks();
    }, 300);
}
