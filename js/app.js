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
