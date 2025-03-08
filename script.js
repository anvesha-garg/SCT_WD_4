document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const listsContainer = document.getElementById('lists-container');
    const currentListName = document.getElementById('current-list-name');
    const newListInput = document.getElementById('new-list-input');
    const addListBtn = document.getElementById('add-list-btn');
    const taskInput = document.getElementById('task-input');
    const taskDatetime = document.getElementById('task-datetime');
    const addTaskBtn = document.getElementById('add-task-btn');
    const tasksList = document.getElementById('tasks-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    // Modal Elements
    const editModal = document.getElementById('edit-modal');
    const closeModal = document.querySelector('.close-modal');
    const editTaskInput = document.getElementById('edit-task-input');
    const editTaskDatetime = document.getElementById('edit-task-datetime');
    const saveEditBtn = document.getElementById('save-edit-btn');
    
    // State
    let lists = JSON.parse(localStorage.getItem('tickTickGoLists')) || [
        { id: 'default', name: 'Default', tasks: [] }
    ];
    let currentListId = localStorage.getItem('tickTickGoCurrentList') || 'default';
    let currentFilter = 'all';
    let editingTaskId = null;
    
    // Initialize
    function initialize() {
        renderLists();
        renderTasks();
        
        // Set current datetime as the default value for new tasks
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        taskDatetime.value = now.toISOString().slice(0, 16);
    }
    
    // Save to localStorage
    function saveToLocalStorage() {
        localStorage.setItem('tickTickGoLists', JSON.stringify(lists));
        localStorage.setItem('tickTickGoCurrentList', currentListId);
    }
    
    // Render Lists
    function renderLists() {
        listsContainer.innerHTML = '';
        
        lists.forEach(list => {
            const li = document.createElement('li');
            li.className = `list-item ${list.id === currentListId ? 'active' : ''}`;
            li.textContent = list.name;
            li.dataset.listId = list.id;
            
            li.addEventListener('click', () => {
                currentListId = list.id;
                currentListName.textContent = list.name;
                
                // Update active class
                document.querySelectorAll('.list-item').forEach(item => {
                    item.classList.remove('active');
                });
                li.classList.add('active');
                
                saveToLocalStorage();
                renderTasks();
            });
            
            listsContainer.appendChild(li);
        });
    }
    
    // Add New List
    function addList() {
        const listName = newListInput.value.trim();
        if (listName === '') return;
        
        const newList = {
            id: 'list_' + Date.now(),
            name: listName,
            tasks: []
        };
        
        lists.push(newList);
        saveToLocalStorage();
        renderLists();
        
        newListInput.value = '';
    }
    
    // Get Current List
    function getCurrentList() {
        return lists.find(list => list.id === currentListId);
    }
    
    // Render Tasks
    function renderTasks() {
        tasksList.innerHTML = '';
        const currentList = getCurrentList();
        if (!currentList) return;
        
        let filteredTasks = [...currentList.tasks];
        
        if (currentFilter === 'active') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        }
        
        // Sort tasks by date (if available)
        filteredTasks.sort((a, b) => {
            if (a.datetime && b.datetime) {
                return new Date(a.datetime) - new Date(b.datetime);
            } else if (a.datetime) {
                return -1;
            } else if (b.datetime) {
                return 1;
            }
            return 0;
        });
        
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'task-completed' : ''}`;
            li.dataset.taskId = task.id;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = task.completed;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'task-content';
            
            const taskText = document.createElement('div');
            taskText.className = 'task-text';
            taskText.textContent = task.text;
            
            const taskDate = document.createElement('div');
            taskDate.className = 'task-date';
            if (task.datetime) {
                const date = new Date(task.datetime);
                taskDate.textContent = date.toLocaleString();
            }
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'task-actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'task-edit';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'task-delete';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            
            // Event Listeners
            checkbox.addEventListener('change', () => {
                toggleTaskCompletion(task.id);
            });
            
            editBtn.addEventListener('click', () => {
                openEditModal(task);
            });
            
            deleteBtn.addEventListener('click', () => {
                deleteTask(task.id);
            });
            
            // Append Elements
            contentDiv.appendChild(taskText);
            contentDiv.appendChild(taskDate);
            
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            
            li.appendChild(checkbox);
            li.appendChild(contentDiv);
            li.appendChild(actionsDiv);
            
            tasksList.appendChild(li);
        });
    }
    
    // Add New Task
    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') return;
        
        const currentList = getCurrentList();
        if (!currentList) return;
        
        const newTask = {
            id: 'task_' + Date.now(),
            text: taskText,
            datetime: taskDatetime.value || null,
            completed: false
        };
        
        currentList.tasks.push(newTask);
        saveToLocalStorage();
        renderTasks();
        
        taskInput.value = '';
        
        // Reset datetime to current time
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        taskDatetime.value = now.toISOString().slice(0, 16);
    }
    
    // Toggle Task Completion
    function toggleTaskCompletion(taskId) {
        const currentList = getCurrentList();
        if (!currentList) return;
        
        const task = currentList.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            saveToLocalStorage();
            renderTasks();
        }
    }
    
    // Delete Task
    function deleteTask(taskId) {
        const currentList = getCurrentList();
        if (!currentList) return;
        
        currentList.tasks = currentList.tasks.filter(task => task.id !== taskId);
        saveToLocalStorage();
        renderTasks();
    }
    
    // Open Edit Modal
    function openEditModal(task) {
        editingTaskId = task.id;
        editTaskInput.value = task.text;
        editTaskDatetime.value = task.datetime || '';
        editModal.style.display = 'block';
    }
    
    // Close Modal
    function closeEditModal() {
        editModal.style.display = 'none';
        editingTaskId = null;
    }
    
    // Save Edited Task
    function saveEditedTask() {
        if (!editingTaskId) return;
        
        const currentList = getCurrentList();
        if (!currentList) return;
        
        const task = currentList.tasks.find(t => t.id === editingTaskId);
        if (task) {
            task.text = editTaskInput.value.trim();
            task.datetime = editTaskDatetime.value || null;
            
            saveToLocalStorage();
            renderTasks();
            closeEditModal();
        }
    }
    
    // Event Listeners
    addListBtn.addEventListener('click', addList);
    newListInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addList();
        }
    });
    
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderTasks();
        });
    });
    
    closeModal.addEventListener('click', closeEditModal);
    saveEditBtn.addEventListener('click', saveEditedTask);
    
    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target == editModal) {
            closeEditModal();
        }
    });
    
    // Initialize the app
    initialize();
});