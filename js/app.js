const MAX_TASKS = 20;

// Load tasks when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
});

function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    tasks.forEach(task => {
        const li = createTaskElement(task.text, task.description);
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
            completed: task.classList.contains('completed')
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

function createTaskElement(taskText, description) {
    const li = document.createElement('li');
    li.className = 'task';
    li.draggable = true;
    li.innerHTML = `
        <div class="drag-handle">⋮⋮</div>
        <input type="checkbox" class="task-checkbox" onclick="toggleComplete(this)">
        <div class="task-content">
            <span class="task-text">${taskText}</span>
            ${description ? `<span class="task-description">${description}</span>` : ''}
        </div>
        <div class="task-actions">
            <button onclick="toggleComplete(this)">✓</button>
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

    return li;
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
