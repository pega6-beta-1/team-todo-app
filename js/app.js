const MAX_TASKS = 20;

// Load tasks when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
});

function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    tasks.forEach(task => {
        const li = createTaskElement(task.text);
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
            completed: task.classList.contains('completed')
        });
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function handleAddTask() {
    const input = document.getElementById('taskInput');
    const taskText = input.value.trim();
    
    if (!taskText) return;
    
    const currentTasks = document.querySelectorAll('.task').length;
    
    if (currentTasks >= MAX_TASKS) {
        alert("Please complete some existing tasks first! Maximum limit is 20 tasks.");
        return;
    }
    
    addTask(taskText);
    input.value = '';
}

function addTask(taskText) {
    const taskList = document.getElementById('taskList');
    const li = createTaskElement(taskText);
    taskList.appendChild(li);
    updateTaskScaling(); // Add this line
    saveTasks();
}

function createTaskElement(taskText) {
    const li = document.createElement('li');
    li.className = 'task';
    li.draggable = true;
    li.innerHTML = `
        <div class="drag-handle">⋮⋮</div>
        <input type="checkbox" class="task-checkbox" onclick="toggleComplete(this)">
        <span class="task-text">${taskText}</span>
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
    saveTasks();
    
    if (element.type === 'checkbox' && element.checked) {
        setTimeout(() => {
            task.remove();
            saveTasks();
        }, 500); // Small delay so user can see the completion before deletion
    }
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
        const scale = 1 - (index * 0.03); // Decrease by 3% for each position
        const fontSize = 16 - (index * 0.5); // Decrease font size by 0.5px for each position
        
        task.style.transform = `scale(${Math.max(scale, 0.7)})`; // Don't go smaller than 70%
        task.querySelector('.task-text').style.fontSize = `${Math.max(fontSize, 12)}px`; // Don't go smaller than 12px
    });
}
