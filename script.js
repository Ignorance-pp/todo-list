// ========== DOM 元素获取 ==========
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const taskCount = document.getElementById('taskCount');
const clearCompletedBtn = document.getElementById('clearCompleted');
const filterBtns = document.querySelectorAll('.filter-btn');

// ========== 数据管理 ==========
let tasks = [];           // 任务数组
let currentFilter = 'all'; // 当前筛选状态

// ========== localStorage 存储模块 ==========
const Storage = {
    // 保存数据到本地存储
    save() {
        localStorage.setItem('todoTasks', JSON.stringify(tasks));
    },
    
    // 从本地存储读取数据
    load() {
        const data = localStorage.getItem('todoTasks');
        if (data) {
            tasks = JSON.parse(data);
        }
    }
};

// ========== 渲染模块 ==========
const Render = {
    // 获取当前筛选后的任务列表
    getFilteredTasks() {
        if (currentFilter === 'active') {
            return tasks.filter(task => !task.completed);
        }
        if (currentFilter === 'completed') {
            return tasks.filter(task => task.completed);
        }
        return tasks; // 'all'
    },

    // 渲染任务列表
    taskList() {
        const filteredTasks = this.getFilteredTasks();
        
        // 清空列表
        taskList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            // 显示空状态
            emptyState.classList.add('show');
            taskList.style.display = 'none';
        } else {
            // 隐藏空状态
            emptyState.classList.remove('show');
            taskList.style.display = 'flex';
            
            // 生成每个任务项
            filteredTasks.forEach(task => {
                const li = this.createTaskElement(task);
                taskList.appendChild(li);
            });
        }
        
        // 更新统计
        this.updateCount();
    },

    // 创建单个任务元素
    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', task.id);
        
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${this.escapeHtml(task.text)}</span>
            <button class="delete-btn" title="删除任务">×</button>
        `;
        
        // 绑定事件
        const checkbox = li.querySelector('.task-checkbox');
        const deleteBtn = li.querySelector('.delete-btn');
        
        checkbox.addEventListener('change', () => {
            App.toggleTask(task.id);
        });
        
        deleteBtn.addEventListener('click', () => {
            App.deleteTask(task.id);
        });
        
        return li;
    },

    // 更新统计信息
    updateCount() {
        const total = tasks.length;
        const active = tasks.filter(t => !t.completed).length;
        taskCount.textContent = `总共 ${total} 项，未完成 ${active} 项`;
        
        // 如果没有已完成的任务，禁用清除按钮
        const hasCompleted = tasks.some(t => t.completed);
        clearCompletedBtn.disabled = !hasCompleted;
    },

    // 防止 XSS 攻击的转义函数
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ========== 业务逻辑模块 ==========
const App = {
    // 初始化
    init() {
        Storage.load();
        Render.taskList();
        this.bindEvents();
    },

    // 绑定全局事件
    bindEvents() {
        // 添加任务：点击按钮
        addBtn.addEventListener('click', () => this.addTask());
        
        // 添加任务：按回车键
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
        
        // 清除已完成任务
        clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        
        // 筛选按钮
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // 更新激活状态
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // 更新筛选条件并重新渲染
                currentFilter = btn.getAttribute('data-filter');
                Render.taskList();
            });
        });
    },

    // 添加任务
    addTask() {
        const text = taskInput.value.trim();
        
        // 空值校验
        if (text === '') {
            taskInput.focus();
            return;
        }
        
        // 创建任务对象
        const task = {
            id: Date.now(),        // 使用时间戳作为唯一ID
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        // 添加到数组头部（新任务显示在最上面）
        tasks.unshift(task);
        
        // 保存并重新渲染
        Storage.save();
        Render.taskList();
        
        // 清空输入框并聚焦
        taskInput.value = '';
        taskInput.focus();
    },

    // 切换任务完成状态
    toggleTask(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            Storage.save();
            Render.taskList();
        }
    },

    // 删除任务
    deleteTask(id) {
        tasks = tasks.filter(t => t.id !== id);
        Storage.save();
        Render.taskList();
    },

    // 清除所有已完成任务
    clearCompleted() {
        const completedCount = tasks.filter(t => t.completed).length;
        if (completedCount === 0) return;
        
        // 可以添加确认提示（可选）
        tasks = tasks.filter(t => !t.completed);
        Storage.save();
        Render.taskList();
    }
};

// ========== 启动应用 ==========
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});