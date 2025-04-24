// 获取DOM元素
const gridOverlay = document.getElementById('grid-overlay');
const horizontalSlider = document.getElementById('horizontal-slider');
const verticalSlider = document.getElementById('vertical-slider');
const horizontalInput = document.getElementById('horizontal-input');
const verticalInput = document.getElementById('vertical-input');
const horizontalValue = document.getElementById('horizontal-value');
const verticalValue = document.getElementById('vertical-value');
const applyGridBtn = document.getElementById('apply-grid');
const showGridCheckbox = document.getElementById('show-grid');

// 控制面板元素
const controlPanel = document.getElementById('control-panel');
const controlToggle = document.getElementById('control-toggle');

// 画布尺寸控制元素
const canvasWidthInput = document.getElementById('canvas-width');
const canvasHeightInput = document.getElementById('canvas-height');
const canvasWidthSlider = document.getElementById('canvas-width-slider');
const canvasHeightSlider = document.getElementById('canvas-height-slider');
const widthValue = document.getElementById('width-value');
const heightValue = document.getElementById('height-value');
const applySizeBtn = document.getElementById('apply-size');
const resetSizeBtn = document.getElementById('reset-size');
const canvas = document.querySelector('.canvas');
const contentWrapper = document.querySelector('.content-wrapper');
const canvasWrapper = document.querySelector('.canvas-wrapper');

// 缩放控制
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const zoomResetBtn = document.getElementById('zoom-reset');
const zoomLevelDisplay = document.getElementById('zoom-level');
let currentZoom = 0.4; // 初始缩放比例改为40%

// 拖拽控制
let isDragging = false;
let startX, startY;
let translateX = 0;
let translateY = 0;

// 触摸控制
let lastTouchDistance = 0;
let isTouching = false;

// 默认画布尺寸
const defaultWidth = 1200;
const defaultHeight = 1600;
const pagePadding = 60; // 固定页边距

// 初始网格设置
let hGridCount = 30;
let vGridCount = 30;

// 检测是否为移动设备
const isMobile = window.matchMedia("(max-width: 1024px)").matches;

// 计算画布居中位置
function calculateCenterPosition() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const canvasWidth = parseInt(canvas.style.width || defaultWidth);
    const canvasHeight = parseInt(canvas.style.height || defaultHeight);
    
    // 考虑当前缩放比例
    const scaledCanvasWidth = canvasWidth * currentZoom;
    const scaledCanvasHeight = canvasHeight * currentZoom;
    
    // 计算居中位置（考虑控制面板的空间）
    const controlPanelWidth = isMobile ? 0 : (controlPanel.offsetWidth || 300);
    
    // 调整计算方法，确保真正居中
    const x = (viewportWidth - scaledCanvasWidth - controlPanelWidth) / 2;
    const y = (viewportHeight - scaledCanvasHeight) / 2;
    
    return { x, y };
}

// 初始化移动端控制
function initMobileControls() {
    // 控制面板切换
    controlToggle.addEventListener('click', function() {
        controlPanel.classList.toggle('open');
        this.classList.toggle('active');
    });
    
    // 点击画布区域关闭控制面板
    canvasWrapper.addEventListener('click', function(e) {
        if (controlPanel.classList.contains('open') && 
            !e.target.closest('.control-panel') && 
            !e.target.closest('.control-toggle')) {
            controlPanel.classList.remove('open');
            controlToggle.classList.remove('active');
        }
    });
}

// 初始化触摸事件
function initTouchEvents() {
    // 触摸开始
    canvasWrapper.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
            // 单指拖动
            handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
            e.preventDefault();
        } else if (e.touches.length === 2) {
            // 双指缩放
            isTouching = true;
            isDragging = false;
            lastTouchDistance = getTouchDistance(e.touches);
            e.preventDefault();
        }
    });
    
    // 触摸移动
    canvasWrapper.addEventListener('touchmove', function(e) {
        if (isDragging && e.touches.length === 1) {
            // 单指拖动
            handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
            e.preventDefault();
        } else if (e.touches.length === 2 && isTouching) {
            // 双指缩放
            const distance = getTouchDistance(e.touches);
            const delta = distance - lastTouchDistance;
            // 调整缩放敏感度
            const zoomDelta = delta * 0.01;
            setZoom(currentZoom + zoomDelta);
            lastTouchDistance = distance;
            e.preventDefault();
        }
    });
    
    // 触摸结束
    canvasWrapper.addEventListener('touchend', function(e) {
        if (e.touches.length === 0) {
            isDragging = false;
            isTouching = false;
        } else if (e.touches.length === 1) {
            isTouching = false;
            // 从双指变为单指时，重新初始化拖动
            handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
        }
    });
}

// 计算两个触摸点之间的距离
function getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// 处理拖动开始
function handleDragStart(clientX, clientY) {
    // 如果点击的是控制面板内的元素，不启动拖拽
    const target = document.elementFromPoint(clientX, clientY);
    if (target && (target.closest('.control-panel') || target.closest('.zoom-controls') || target.closest('.control-toggle'))) {
        return;
    }
    
    isDragging = true;
    canvasWrapper.classList.add('grabbing');
    startX = clientX - translateX;
    startY = clientY - translateY;
}

// 处理拖动移动
function handleDragMove(clientX, clientY) {
    if (!isDragging) return;
    
    translateX = clientX - startX;
    translateY = clientY - startY;
    updateCanvasTransform();
}

// 初始化拖拽
function initDragAndDrop() {
    // 鼠标按下事件
    canvasWrapper.addEventListener('mousedown', (e) => {
        handleDragStart(e.clientX, e.clientY);
        e.preventDefault();
    });
    
    // 鼠标移动事件
    document.addEventListener('mousemove', (e) => {
        handleDragMove(e.clientX, e.clientY);
        if (isDragging) e.preventDefault();
    });
    
    // 鼠标松开事件
    document.addEventListener('mouseup', () => {
        isDragging = false;
        canvasWrapper.classList.remove('grabbing');
    });
    
    // 鼠标离开窗口事件
    document.addEventListener('mouseleave', () => {
        if (isDragging) {
            isDragging = false;
            canvasWrapper.classList.remove('grabbing');
        }
    });
}

// 更新画布变换
function updateCanvasTransform() {
    canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
    // 确保transform-origin设置正确
    canvas.style.transformOrigin = 'top left';
}

// 缩放控制函数
function setZoom(zoom) {
    // 限制缩放范围
    if (zoom < 0.2) zoom = 0.2;
    if (zoom > 3) zoom = 3;
    
    currentZoom = zoom;
    updateCanvasTransform();
    zoomLevelDisplay.textContent = Math.round(zoom * 100) + '%';
}

// 重置位置和缩放
function resetViewport() {
    currentZoom = 0.4; // 重置缩放比例为40%
    
    // 获取居中位置
    const centerPos = calculateCenterPosition();
    translateX = centerPos.x;
    translateY = centerPos.y;
    
    updateCanvasTransform();
    zoomLevelDisplay.textContent = '40%';
}

// 缩放按钮事件
zoomInBtn.addEventListener('click', () => {
    setZoom(currentZoom + 0.1);
});

zoomOutBtn.addEventListener('click', () => {
    setZoom(currentZoom - 0.1);
});

zoomResetBtn.addEventListener('click', () => {
    resetViewport();
});

// 鼠标滚轮缩放
canvasWrapper.addEventListener('wheel', (e) => {
    // 阻止默认滚动行为
    e.preventDefault();
    
    // 根据滚轮方向调整缩放
    const delta = -Math.sign(e.deltaY) * 0.1;
    setZoom(currentZoom + delta);
});

// 更新CSS变量
function updateCSSVariables() {
    // 网格单元格大小保持不变，仅更新其他变量
    document.documentElement.style.setProperty('--page-padding', `${pagePadding}px`);
    
    // 强制回流，确保尺寸计算准确
    void canvas.offsetHeight;
}

// 实时应用画布尺寸（用于滑块拖动）
function applyCanvasSizeImmediate() {
    const width = parseInt(canvasWidthSlider.value);
    const height = parseInt(canvasHeightSlider.value);
    
    if (width >= 600 && height >= 800) {
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        
        // 等待DOM更新后再生成网格
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(() => {
            generateGrid(hGridCount, vGridCount);
        }, 100);
    }
}

// 应用画布尺寸（通过按钮点击）
function applyCanvasSize() {
    const width = parseInt(canvasWidthInput.value);
    const height = parseInt(canvasHeightInput.value);
    
    if (width < 600 || height < 800) {
        alert('画布尺寸过小，请输入更大的值');
        return;
    }
    
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    // 等待DOM更新后再生成网格
    setTimeout(() => {
        generateGrid(hGridCount, vGridCount);
    }, 50);
}

// 重置画布尺寸
function resetCanvasSize() {
    canvasWidthInput.value = defaultWidth;
    canvasHeightInput.value = defaultHeight;
    canvasWidthSlider.value = defaultWidth;
    canvasHeightSlider.value = defaultHeight;
    widthValue.textContent = defaultWidth;
    heightValue.textContent = defaultHeight;
    
    canvas.style.width = defaultWidth + 'px';
    canvas.style.height = defaultHeight + 'px';
    
    // 重置缩放和位置
    resetViewport();
    
    // 等待DOM更新后再生成网格
    setTimeout(() => {
        generateGrid(hGridCount, vGridCount);
    }, 50);
}

// 生成网格线
function generateGrid(h, v) {
    // 清空网格
    gridOverlay.innerHTML = '';
    
    // 获取固定的网格单元格尺寸
    const cellWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-cell-width'));
    const cellHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-cell-height'));
    
    // 计算网格尺寸（版心内容区域）
    const gridWidth = gridOverlay.offsetWidth;
    const gridHeight = gridOverlay.offsetHeight;
    
    // 计算需要的网格线数量
    const hLines = Math.ceil(gridHeight / cellHeight) + 1;
    const vLines = Math.ceil(gridWidth / cellWidth) + 1;
    
    // 更新输入框和滑块的值（但不触发事件）
    horizontalInput.value = vLines - 1;
    horizontalSlider.value = vLines - 1;
    horizontalValue.textContent = vLines - 1;
    
    verticalInput.value = hLines - 1;
    verticalSlider.value = hLines - 1;
    verticalValue.textContent = hLines - 1;
    
    // 存储当前网格数量
    hGridCount = vLines - 1;
    vGridCount = hLines - 1;
    
    // 生成横向线
    for (let i = 0; i <= hLines; i++) {
        const hLine = document.createElement('div');
        hLine.className = 'grid-line h-line';
        hLine.style.top = (i * cellHeight) + 'px';
        gridOverlay.appendChild(hLine);
    }
    
    // 生成纵向线
    for (let i = 0; i <= vLines; i++) {
        const vLine = document.createElement('div');
        vLine.className = 'grid-line v-line';
        vLine.style.left = (i * cellWidth) + 'px';
        gridOverlay.appendChild(vLine);
    }
    
    // 更新CSS变量
    updateCSSVariables();
}

// 同步滑块和输入框
horizontalSlider.addEventListener('input', function() {
    horizontalInput.value = this.value;
    horizontalValue.textContent = this.value;
});

verticalSlider.addEventListener('input', function() {
    verticalInput.value = this.value;
    verticalValue.textContent = this.value;
});

horizontalInput.addEventListener('input', function() {
    horizontalSlider.value = this.value;
    horizontalValue.textContent = this.value;
});

verticalInput.addEventListener('input', function() {
    verticalSlider.value = this.value;
    verticalValue.textContent = this.value;
});

// 同步滑块和输入框 - 画布尺寸
canvasWidthSlider.addEventListener('input', function() {
    canvasWidthInput.value = this.value;
    widthValue.textContent = this.value;
    // 实时应用尺寸变化
    applyCanvasSizeImmediate();
});

canvasHeightSlider.addEventListener('input', function() {
    canvasHeightInput.value = this.value;
    heightValue.textContent = this.value;
    // 实时应用尺寸变化
    applyCanvasSizeImmediate();
});

canvasWidthInput.addEventListener('input', function() {
    canvasWidthSlider.value = this.value;
    widthValue.textContent = this.value;
});

canvasHeightInput.addEventListener('input', function() {
    canvasHeightSlider.value = this.value;
    heightValue.textContent = this.value;
});

// 应用网格按钮
applyGridBtn.addEventListener('click', function() {
    const cellWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-cell-width'));
    const cellHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-cell-height'));
    
    // 获取用户输入的网格数量
    hGridCount = parseInt(horizontalInput.value);
    vGridCount = parseInt(verticalInput.value);
    
    // 根据输入的网格数量更新CSS变量
    const newCellWidth = cellWidth;
    const newCellHeight = cellHeight;
    
    // 应用新的网格单元格大小
    document.documentElement.style.setProperty('--grid-cell-width', `${newCellWidth}px`);
    document.documentElement.style.setProperty('--grid-cell-height', `${newCellHeight}px`);
    
    // 重新生成网格
    generateGrid(hGridCount, vGridCount);
});

// 显示/隐藏网格
showGridCheckbox.addEventListener('change', function() {
    gridOverlay.style.display = this.checked ? 'block' : 'none';
});

// 尺寸控制按钮事件监听
applySizeBtn.addEventListener('click', applyCanvasSize);
resetSizeBtn.addEventListener('click', resetCanvasSize);

// 页面加载时初始化
window.addEventListener('load', function() {
    // 设置初始画布尺寸
    canvas.style.width = defaultWidth + 'px';
    canvas.style.height = defaultHeight + 'px';
    
    // 先设置transform-origin
    canvas.style.transformOrigin = 'top left';
    
    // 初始化拖拽功能
    initDragAndDrop();
    
    // 初始化移动端控制
    initMobileControls();
    
    // 初始化触摸事件
    initTouchEvents();
    
    // 初始化文本编辑功能
    initTextEditing();
    
    // 如果是移动设备，自动调整初始缩放以适应屏幕
    if (isMobile) {
        const initialScale = Math.min(
            window.innerWidth / (defaultWidth + 20),
            window.innerHeight / (defaultHeight + 20)
        );
        setZoom(initialScale * 0.9); // 缩小一点，确保有边距
    } else {
        // 非移动设备应用40%的初始缩放
        setZoom(0.4);
        zoomLevelDisplay.textContent = '40%';
    }
    
    // 等待DOM完全加载并计算尺寸和位置
    setTimeout(() => {
        // 先生成网格
        generateGrid(hGridCount, vGridCount);
        
        // 延迟应用居中位置，确保所有元素已渲染
        setTimeout(() => {
            // 计算并应用居中位置
            const centerPos = calculateCenterPosition();
            translateX = centerPos.x;
            translateY = centerPos.y;
            updateCanvasTransform();
        }, 200);
    }, 200);
});

// 窗口大小改变时重新生成网格
window.addEventListener('resize', function() {
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(() => {
        generateGrid(hGridCount, vGridCount);
    }, 100);
});

// 初始化文本编辑功能
function initTextEditing() {
    // 获取所有可编辑元素
    const editables = document.querySelectorAll('.editable');
    
    // 获取应用按钮
    const applyTextBtn = document.getElementById('apply-text');
    
    // 为所有可编辑元素添加点击事件
    editables.forEach(el => {
        el.addEventListener('click', function() {
            const field = this.getAttribute('data-field');
            const editor = document.getElementById('edit-' + field);
            
            if (editor) {
                // 在移动设备上，打开控制面板
                if (isMobile && !controlPanel.classList.contains('open')) {
                    controlPanel.classList.add('open');
                    controlToggle.classList.add('active');
                }
                
                // 滚动到编辑区域
                editor.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // 突出显示编辑区域
                editor.style.backgroundColor = '#fff9f9';
                editor.style.border = '1px solid #ff2e63';
                
                setTimeout(() => {
                    editor.style.backgroundColor = '';
                    editor.style.border = '1px solid #ddd';
                }, 1500);
                
                editor.focus();
            }
        });
    });
    
    // 应用按钮点击事件
    applyTextBtn.addEventListener('click', applyTextChanges);
    
    // 为所有编辑框添加实时更新
    const editors = document.querySelectorAll('[id^="edit-"]');
    editors.forEach(editor => {
        editor.addEventListener('input', function() {
            updateSingleField(this);
        });
    });
    
    // 初始化编辑器内容
    syncEditorsFromContent();
}

// 从画布内容同步到编辑器
function syncEditorsFromContent() {
    const editables = document.querySelectorAll('.editable');
    
    editables.forEach(el => {
        const field = el.getAttribute('data-field');
        const editor = document.getElementById('edit-' + field);
        
        if (editor) {
            editor.value = el.innerHTML.replace(/<br>/g, '\n').replace(/<span class="tag">([^<]+)<\/span>/g, '$1');
        }
    });
}

// 更新单个字段
function updateSingleField(editor) {
    const fieldId = editor.id.replace('edit-', '');
    const targetElement = document.querySelector(`.editable[data-field="${fieldId}"]`);
    
    if (targetElement) {
        let content = editor.value;
        
        // 处理特殊情况
        if (fieldId === 'title-2') {
            // 保留"对谈"标签
            content = content.replace(/对谈$/, '<span class="tag">对谈</span>');
        }
        
        // 将换行符转换为<br>
        content = content.replace(/\n/g, '<br>');
        
        targetElement.innerHTML = content;
    }
}

// 应用文本更改
function applyTextChanges() {
    const editors = document.querySelectorAll('[id^="edit-"]');
    
    editors.forEach(editor => {
        updateSingleField(editor);
    });
} 