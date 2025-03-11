let tasks = [];

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

function toggleTask(id) {
    tasks = tasks.map(task =>
        task.id === id ? {...task, completed: !task.completed} : task
    );
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    renderTasks();
}

function renderTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = tasks.map(task => `
        <li class="${task.completed ? 'completed' : ''}">
            <span onclick="toggleTask(${task.id})">${task.text}</span>
            <button onclick="deleteTask(${task.id})">Delete</button>
        </li>
    `).join('');
}
