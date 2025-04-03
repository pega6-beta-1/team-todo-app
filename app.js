import { generateAITasks } from './src/config/openai.js';

let tasks = [];
let archivedTasks = [];
let completedTasks = [];
let showingArchived = false;
let showingCompleted = false;
let taskLists = [];
let currentTaskListId = null;

// Expose necessary functions to the global scope for inline onclick handlers
window.addTask = addTask;
window.toggleTask = toggleTask;
window.archiveTask = archiveTask;
window.deleteTask = deleteTask;
window.restoreTask = restoreTask;
window.editTask = editTask;
window.saveEdit = saveEdit;
window.cancelEdit = cancelEdit;
window.createNewTaskList = createNewTaskList;
window.deleteCurrentCategory = deleteCurrentCategory;

document.addEventListener("DOMContentLoaded", () => {
	const savedArchivedTasks = localStorage.getItem("archivedTasks");
	const savedCompletedTasks = localStorage.getItem("completedTasks");
	const savedTaskLists = localStorage.getItem("taskLists");

	archivedTasks = savedArchivedTasks ? JSON.parse(savedArchivedTasks) : [];
	completedTasks = savedCompletedTasks ? JSON.parse(savedCompletedTasks) : [];
	taskLists = savedTaskLists ? JSON.parse(savedTaskLists) : [];

	showingArchived = window.location.pathname.includes("archived.html");
	showingCompleted = window.location.pathname.includes("completed.html");

	if (showingArchived) {
		document.querySelector("h1").textContent = "Archived Tasks";
		const inputSection = document.querySelector(".input-section");
		if (inputSection) inputSection.style.display = "none";
	}

	if (showingCompleted) {
		document.querySelector("h1").textContent = "Completed Tasks";
		const inputSection = document.querySelector(".input-section");
		if (inputSection) inputSection.style.display = "none";
	}

	// Load tasks for the current view
	if (!showingArchived && !showingCompleted) {
		tasks = getAllTasks(); // Aggregate tasks for "All Tasks"
	}

	renderTasks();
	updateArchivedCount();
	updateCompletedCount();

	document
		.querySelector(".section-toggle")
		.addEventListener("click", toggleSection);

	updateTaskListSelector();

	document
		.getElementById("taskListSelector")
		.addEventListener("change", (e) => {
			const selectedValue = e.target.value;

			if (selectedValue === "new") {
				e.target.value = currentTaskListId || "";
				document.getElementById("newTaskListDialog").showModal();
				return;
			}

			if (currentTaskListId) {
				const oldList = taskLists.find((list) => list.id === currentTaskListId);
				if (oldList) {
					oldList.tasks = tasks;
				}
			}

			if (!selectedValue) {
				tasks = getAllTasks(); // Aggregate tasks for "All Tasks"
				currentTaskListId = null;
			} else {
				// Convert to number to ensure comparison works properly
				const selectedId = Number(selectedValue);
				const newList = taskLists.find((list) => list.id === selectedId);
				if (newList) {
					tasks = [...newList.tasks];
					currentTaskListId = selectedId;
				}
			}

			saveTaskLists();
			renderTasks();
		});

	const deleteCategoryBtn = document.getElementById("deleteCategoryBtn");
	if (deleteCategoryBtn) {
		deleteCategoryBtn.addEventListener("click", deleteCurrentCategory);
	}
		
	// AI Generator Button Event Listener
	const aiGeneratorBtn = document.getElementById("aiGeneratorBtn");
	if (aiGeneratorBtn) {
		aiGeneratorBtn.addEventListener("click", () => {
			document.getElementById("aiGeneratorDialog").showModal();
		});
	}
	
	// AI Generator Form Submit Handler
	const aiGeneratorForm = document.getElementById("aiGeneratorForm");
	if (aiGeneratorForm) {
		aiGeneratorForm.addEventListener("submit", handleAIGeneratorSubmit);
	}

	// Add Task Button Event Listener
	const addTaskBtn = document.getElementById("addTaskBtn");
	if (addTaskBtn) {
		addTaskBtn.addEventListener("click", addTask);
	}

	// New Task List Form Submit Handler
	const newTaskListForm = document.getElementById("newTaskListForm");
	if (newTaskListForm) {
		newTaskListForm.addEventListener("submit", createNewTaskList);
	}
});

function addTask() {
	const titleInput = document.getElementById("taskInput");
	const descriptionInput = document.getElementById("taskDescription");
	const title = titleInput.value.trim();
	const description = descriptionInput.value.trim();

	if (title) {
		const newTask = {
			id: Date.now(),
			text: title,
			description: description,
			completed: false,
		};

		if (currentTaskListId) {
			const currentList = taskLists.find(
				(list) => list.id === currentTaskListId,
			);
			if (currentList) {
				currentList.tasks.push(newTask);
				tasks = [...currentList.tasks]; // Ensure tasks array is updated for rendering
				saveTaskLists();
			}
		} else {
			tasks.push(newTask);
		}

		titleInput.value = "";
		descriptionInput.value = "";
		renderTasks(); // Ensure tasks are displayed immediately
	}
}

function toggleMenu(id) {
	const taskElement = document.querySelector(`li[data-id="${id}"]`);
	const menu = taskElement.querySelector(".task-menu");
	menu.classList.toggle("show");
}

function toggleTask(id) {
	if (showingCompleted) {
		const taskToRestore = completedTasks.find((task) => task.id === id);
		if (taskToRestore) {
			completedTasks = completedTasks.filter((task) => task.id !== id);
			const { completedDate, ...restoredTask } = taskToRestore;
			restoredTask.completed = false;
			
			// Add to active tasks
			tasks.push(restoredTask);
			
			// Save state to localStorage
			localStorage.setItem("completedTasks", JSON.stringify(completedTasks));
			
			// If we're in a specific category
			if (currentTaskListId) {
				const currentList = taskLists.find((list) => list.id === currentTaskListId);
				if (currentList) {
					currentList.tasks.push(restoredTask);
					saveTaskLists();
				}
			} else {
				// When in "All Tasks" view, need to assign to a category
				// Find the first category or create a default one
				if (taskLists.length > 0) {
					taskLists[0].tasks.push(restoredTask);
				} else {
					const defaultList = {
						id: Date.now(),
						name: "Default",
						tasks: [restoredTask]
					};
					taskLists.push(defaultList);
				}
				saveTaskLists();
			}
			
			renderTasks();
			updateCompletedCount();

			if (completedTasks.length === 0) {
				window.location.href = "index.html";
			}
		}
	} else {
		const task = tasks.find((t) => t.id === id);
		if (task) {
			// Remove from active tasks array
			tasks = tasks.filter((t) => t.id !== id);
			
			// Add to completed tasks
			completedTasks.push({
				...task,
				completed: true,
				completedDate: new Date(),
			});
			
			// Save state to localStorage
			localStorage.setItem("completedTasks", JSON.stringify(completedTasks));
			
			// If we're in a specific category, update that list
			if (currentTaskListId) {
				const currentList = taskLists.find((list) => list.id === currentTaskListId);
				if (currentList) {
					currentList.tasks = currentList.tasks.filter(t => t.id !== id);
					saveTaskLists();
				}
			} else {
				// When in "All Tasks" view, remove from all categories
				for (const list of taskLists) {
					if (list.tasks) {
						list.tasks = list.tasks.filter(t => t.id !== id);
					}
				}
				saveTaskLists();
			}
			
			renderTasks();
			updateCompletedCount();
		}
	}
}

function archiveTask(id) {
	const taskToArchive = tasks.find((task) => task.id === id);
	if (taskToArchive) {
		// Remove from active tasks array
		tasks = tasks.filter((task) => task.id !== id);
		
		// Add to archived tasks
		archivedTasks.push({
			...taskToArchive,
			archivedDate: new Date(),
			autoArchived: false,
		});

		// Save to localStorage
		localStorage.setItem("archivedTasks", JSON.stringify(archivedTasks));
		
		// If we're in a specific category, update that list
		if (currentTaskListId) {
			const currentList = taskLists.find((list) => list.id === currentTaskListId);
			if (currentList) {
				currentList.tasks = currentList.tasks.filter(t => t.id !== id);
				saveTaskLists();
			}
		} else {
			// When in "All Tasks" view, remove from all categories
			for (const list of taskLists) {
				if (list.tasks) {
					list.tasks = list.tasks.filter(t => t.id !== id);
				}
			}
			saveTaskLists();
		}

		renderTasks();
		updateArchivedCount();

		const toggleBtn = document.querySelector(".section-toggle");
		toggleBtn.classList.add("highlight");
		setTimeout(() => toggleBtn.classList.remove("highlight"), 1000);
	}
}

function deleteTask(id) {
	if (showingArchived) {
		archivedTasks = archivedTasks.filter((task) => task.id !== id);
		localStorage.setItem("archivedTasks", JSON.stringify(archivedTasks));
		renderTasks();
	} else if (showingCompleted) {
		completedTasks = completedTasks.filter((task) => task.id !== id);
		localStorage.setItem("completedTasks", JSON.stringify(completedTasks));
		renderTasks();
	} else {
		tasks = tasks.filter((task) => task.id !== id);
		
		// If we're in a specific category, update that list
		if (currentTaskListId) {
			const currentList = taskLists.find((list) => list.id === currentTaskListId);
			if (currentList) {
				currentList.tasks = tasks;
				saveTaskLists();
			}
		}
		
		renderTasks();
	}
}

function toggleSection() {
	if (showingArchived) {
		window.location.href = "index.html";
	} else if (showingCompleted) {
		window.location.href = "index.html";
	} else {
		window.location.href = "archived.html";
	}
}

function renderTasks() {
	const taskList = document.getElementById("taskList");
	if (!taskList) return;

	const currentTasks = showingArchived
		? archivedTasks
		: showingCompleted
			? completedTasks
			: tasks;

	taskList.innerHTML = "";

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

	for (const task of currentTasks) {
		const li = document.createElement("li");
		li.className = `${task.completed ? "completed" : ""} ${showingArchived ? "archived" : ""}`;
		li.dataset.id = task.id;
		li.draggable = !showingArchived && !showingCompleted;

		li.innerHTML = `
            <div class="checkbox" onclick="toggleTask(${task.id})">
                ${task.completed ? "✓" : ""}
            </div>
            <div class="task-content">
                <div class="task-header">
                    <span class="task-text" title="${task.description || ""}">${task.text}</span>
                    ${
											showingArchived
												? `<small class="archive-date">
                            Archived: ${new Date(task.archivedDate).toLocaleDateString()}
                        </small>`
												: showingCompleted
													? `<small class="completed-date">
                            Completed: ${new Date(task.completedDate).toLocaleDateString()}
                        </small>`
													: ""
										}
                </div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ""}
            </div>
            <div class="task-actions">
                ${
									showingArchived
										? `<button class="action-btn restore-btn" title="Restore Task" onclick="restoreTask(${task.id})">↩️</button>
                     <button class="action-btn delete-btn" title="Delete Permanently" onclick="deleteTask(${task.id})">🗑️</button>`
										: showingCompleted
											? `<button class="action-btn delete-btn" title="Delete Permanently" onclick="deleteTask(${task.id})">🗑️</button>`
											: `
                    <button class="action-btn edit-btn" title="Edit Task" onclick="editTask(${task.id})">✏️</button>
                    <button class="action-btn archive-btn" title="Archive Task" onclick="archiveTask(${task.id})">📥</button>
                    <button class="action-btn delete-btn" title="Delete Task" onclick="deleteTask(${task.id})">🗑️</button>
                `
								}
            </div>
        `;

		taskList.appendChild(li);
	}

	if (!showingArchived && !showingCompleted) {
		const taskItems = taskList.querySelectorAll("li");
		for (const item of taskItems) {
			item.addEventListener("dragstart", handleDragStart);
			item.addEventListener("dragend", handleDragEnd);
			item.addEventListener("dragover", handleDragOver);
			item.addEventListener("drop", handleDrop);
		}
	}
}

function restoreTask(id) {
	const taskToRestore = archivedTasks.find((task) => task.id === id);
	if (taskToRestore) {
		// Remove from archived tasks
		archivedTasks = archivedTasks.filter((task) => task.id !== id);
		const { archivedDate, autoArchived, ...restoredTask } = taskToRestore;
		
		// Add to active tasks
		tasks.push(restoredTask);
		
		// Save to localStorage
		localStorage.setItem("archivedTasks", JSON.stringify(archivedTasks));
		
		// If we're in a specific category, add the task to that list
		if (currentTaskListId) {
			const currentList = taskLists.find((list) => list.id === currentTaskListId);
			if (currentList) {
				currentList.tasks.push(restoredTask);
				saveTaskLists();
			}
		} else {
			// When in "All Tasks" view, need to assign to a category
			// Find the original category if it exists, or add to the first one
			// Find the list where this task originally belonged
			let foundList = false;
			for (const list of taskLists) {
				if (list.tasks?.some(t => t.id === restoredTask.id)) {
					list.tasks.push(restoredTask);
					foundList = true;
					break;
				}
			}
			
			// If no matching list found, assign to the first list or create one
			if (!foundList) {
				if (taskLists.length > 0) {
					taskLists[0].tasks.push(restoredTask);
				} else {
					const defaultList = {
						id: Date.now(),
						name: "Default",
						tasks: [restoredTask]
					};
					taskLists.push(defaultList);
				}
			}
			saveTaskLists();
		}

		renderTasks();

		if (showingArchived && archivedTasks.length === 0) {
			window.location.href = "index.html";
		}
	}
}

function handleDragStart(e) {
	e.target.classList.add("dragging");
	e.dataTransfer.setData("text/plain", e.target.dataset.id);
}

function handleDragEnd(e) {
	e.target.classList.remove("dragging");
}

function handleDragOver(e) {
	e.preventDefault();
}

function handleDrop(e) {
	e.preventDefault();
	const draggedId = Number.parseInt(e.dataTransfer.getData("text/plain"));
	const dropId = Number.parseInt(e.target.closest("li").dataset.id);

	if (draggedId === dropId) return;

	const draggedIndex = tasks.findIndex((task) => task.id === draggedId);
	const dropIndex = tasks.findIndex((task) => task.id === dropId);

	const [draggedTask] = tasks.splice(draggedIndex, 1);
	tasks.splice(dropIndex, 0, draggedTask);

	renderTasks();
}

function updateArchivedCount() {
	const archivedCount = document.getElementById("archivedCount");
	if (archivedCount) {
		archivedCount.textContent = archivedTasks.length;
	}
}

function updateCompletedCount() {
	const completedCount = document.getElementById("completedCount");
	if (completedCount) {
		completedCount.textContent = completedTasks.length;
	}
}

function editTask(id) {
	const task = tasks.find((t) => t.id === id);
	if (!task) return;

	const taskElement = document.querySelector(`li[data-id="${id}"]`);
	const taskContent = taskElement.querySelector(".task-content");
	const taskActions = taskElement.querySelector(".task-actions");

	const taskListOptions = taskLists
		.map(
			(list) =>
				`<option value="${list.id}" ${list.id === currentTaskListId ? "selected" : ""}>
            ${list.name}
        </option>`,
		)
		.join("");

	const editForm = document.createElement("div");
	editForm.className = "edit-form";
	editForm.innerHTML = `
        <input type="text" class="edit-title" value="${task.text}" placeholder="Task title">
        <input type="text" class="edit-description" value="${task.description || ""}" placeholder="Task description (optional)">
        <select class="edit-task-list">
            <option value="">Select Task List</option>
            ${taskListOptions}
        </select>
        <div class="edit-actions">
            <button class="save-btn" onclick="saveEdit(${id})">Save</button>
            <button class="cancel-btn" onclick="cancelEdit(${id})">Cancel</button>
        </div>
    `;

	taskContent.style.display = "none";
	taskActions.style.display = "none";
	taskElement.appendChild(editForm);
	taskElement.classList.add("editing");

	const titleInput = editForm.querySelector(".edit-title");
	titleInput.focus();
}

function saveEdit(id) {
	const taskElement = document.querySelector(`li[data-id="${id}"]`);
	const editForm = taskElement.querySelector(".edit-form");
	const titleInput = editForm.querySelector(".edit-title");
	const descriptionInput = editForm.querySelector(".edit-description");
	const taskListSelect = editForm.querySelector(".edit-task-list");
	const newTaskListId = taskListSelect.value ? Number(taskListSelect.value) : null;

	const task = tasks.find((t) => t.id === id);
	if (task) {
		task.text = titleInput.value.trim();
		task.description = descriptionInput.value.trim();

		if (newTaskListId && newTaskListId !== currentTaskListId) {
			tasks = tasks.filter((t) => t.id !== id);

			const newList = taskLists.find((list) => list.id === newTaskListId);
			if (newList) {
				newList.tasks = newList.tasks || [];
				newList.tasks.push(task);
				saveTaskLists();
			}
		} else {
			saveTaskLists();
		}

		renderTasks();
	}

	exitEditMode(id);
}

function cancelEdit(id) {
	exitEditMode(id);
}

function exitEditMode(id) {
	const taskElement = document.querySelector(`li[data-id="${id}"]`);
	const editForm = taskElement.querySelector(".edit-form");
	const taskContent = taskElement.querySelector(".task-content");
	const taskActions = taskElement.querySelector(".task-actions");

	editForm.remove();
	taskContent.style.display = "flex";
	taskActions.style.display = "flex";
	taskElement.classList.remove("editing");
}

function createNewTaskList(event) {
	event.preventDefault();
	const nameInput = document.getElementById("taskListName");
	const name = nameInput.value.trim();

	if (name) {
		const newTaskList = {
			id: Date.now(),
			name: name,
			tasks: [],
		};

		taskLists.push(newTaskList);
		saveTaskLists();
		updateTaskListSelector();

		currentTaskListId = newTaskList.id;
		document.getElementById("taskListSelector").value = currentTaskListId;

		nameInput.value = "";
		document.getElementById("newTaskListDialog").close();

		tasks = [];
		renderTasks();
	}
}

function saveTaskLists() {
	if (currentTaskListId) {
		const currentList = taskLists.find((list) => list.id === currentTaskListId);
		if (currentList) {
			currentList.tasks = tasks;
		}
	}
	localStorage.setItem("taskLists", JSON.stringify(taskLists));
}

function updateTaskListSelector() {
	const selector = document.getElementById("taskListSelector");

	selector.innerHTML = `
		<option value="">All Tasks</option>
		${taskLists
			.map(
				(list) =>
					`<option value="${list.id}" ${list.id === currentTaskListId ? "selected" : ""}>
                ${list.name}
            </option>`,
			)
			.join("")}
		<option value="new" class="new-list-option">New Category...</option>`;

	let deleteCategoryIcon = document.getElementById("deleteCategoryIcon");
	if (!deleteCategoryIcon) {
		deleteCategoryIcon = document.createElement("span");
		deleteCategoryIcon.id = "deleteCategoryIcon";
		deleteCategoryIcon.className = "delete-category-icon";
		deleteCategoryIcon.title = "Delete Current Category";
		deleteCategoryIcon.innerHTML = "🗑️";
		selector.parentNode.appendChild(deleteCategoryIcon);
	}

	deleteCategoryIcon.onclick = (e) => {
		e.preventDefault();
		if (currentTaskListId) {
			deleteCurrentCategory();
		} else {
			alert('Cannot delete "All Tasks" category.');
		}
	};
}

function getAllTasks() {
	return taskLists.reduce((acc, list) => acc.concat(list.tasks || []), []);
}

function deleteCurrentCategory() {
	if (!currentTaskListId) {
		alert('Cannot delete "All Tasks" category.');
		return;
	}

	const confirmDelete = confirm(
		"Are you sure you want to delete this category? All tasks in this category will also be deleted.",
	);
	if (confirmDelete) {
		taskLists = taskLists.filter((list) => list.id !== currentTaskListId);
		currentTaskListId = null;

		tasks = getAllTasks(); // Reset to "All Tasks"
		saveTaskLists();
		updateTaskListSelector();
		renderTasks();
	}
}

// AI Generator Functions
async function handleAIGeneratorSubmit(event) {
	event.preventDefault();
	
	const activityDescription = document.getElementById("activityDescription").value.trim();
	if (!activityDescription) {
		alert("Please describe the activity you want to break down into tasks.");
		return;
	}
	
	// Show loading indicator
	const form = document.getElementById("aiGeneratorForm");
	const loadingIndicator = document.getElementById("generatingIndicator");
	form.style.display = "none";
	loadingIndicator.style.display = "block";
	
	try {
		// Call the function to generate tasks using ChatGPT
		const { categoryName, tasks: generatedTasks } = await generateTasksWithAI(activityDescription);
		
		// Create a new category for these tasks
		createCategoryWithTasks(categoryName, generatedTasks);
		
		// Reset and close the dialog
		document.getElementById("activityDescription").value = "";
		document.getElementById("aiGeneratorDialog").close();
		
		// Show success message
		alert(`Successfully created ${generatedTasks.length} tasks in category "${categoryName}"`);
	} catch (error) {
		alert(`Error generating tasks: ${error.message}`);
		console.error("Error generating tasks:", error);
	} finally {
		// Hide loading indicator and show form again
		form.style.display = "block";
		loadingIndicator.style.display = "none";
	}
}

async function generateTasksWithAI(activityDescription) {
	try {
		return await generateAITasks(activityDescription);
	} catch (error) {
		console.error("Error generating tasks:", error);
		throw error;
	}
}

function createCategoryWithTasks(categoryName, tasksList) {
	// Create a new category
	const newCategory = {
		id: Date.now(),
		name: categoryName,
		tasks: tasksList
	};
	
	// Add to task lists
	taskLists.push(newCategory);
	
	// Save to localStorage
	saveTaskLists();
	
	// Update the selector
	updateTaskListSelector();
	
	// Switch to the new category
	currentTaskListId = newCategory.id;
	document.getElementById("taskListSelector").value = currentTaskListId;
	
	// Update the tasks array to show the new tasks
	tasks = [...tasksList];
	
	// Render the tasks
	renderTasks();
}
