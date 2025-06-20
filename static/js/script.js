document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const boardElement = document.getElementById('sudoku-board');
    const solveBtn = document.getElementById('solve-btn');
    const hintBtn = document.getElementById('hint-btn');
    const resetBtn = document.getElementById('reset-btn');
    const clearBtn = document.getElementById('clear-btn');
    const easyBtn = document.querySelector('.difficulty-btn.easy');
    const mediumBtn = document.querySelector('.difficulty-btn.medium');
    const hardBtn = document.querySelector('.difficulty-btn.hard');
    const speedSlider = document.getElementById('speed-slider');
    const stepsCount = document.getElementById('steps-count');
    const backtracksCount = document.getElementById('backtracks-count');
    
    // Game state
    let currentBoard = Array(9).fill().map(() => Array(9).fill(0));
    let initialBoard = Array(9).fill().map(() => Array(9).fill(0));
    let solvingSpeed = 250; // Default speed (middle of range)
    let isSolving = false;
    
    // Confetti setup
    const confettiCanvas = document.getElementById('confetti-canvas');
    const confettiCtx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    
    // Initialize speed slider
    speedSlider.value = 200 - solvingSpeed;
    
    // Initialize the board
    function initializeBoard() {
        boardElement.innerHTML = '';
        
        for (let row = 0; row < 9; row++) {
            const tr = document.createElement('tr');
            
            for (let col = 0; col < 9; col++) {
                const td = document.createElement('td');
                const input = document.createElement('input');
                
                input.type = 'text';
                input.maxLength = 1;
                input.dataset.row = row;
                input.dataset.col = col;
                
                // Add thick borders for 3x3 boxes
                if (row % 3 === 0) td.classList.add('top-border');
                if (col % 3 === 0) td.classList.add('left-border');
                
                // Input handling
                input.addEventListener('input', handleInput);
                input.addEventListener('focus', () => highlightRelatedCells(row, col));
                input.addEventListener('blur', removeHighlights);
                
                td.appendChild(input);
                tr.appendChild(td);
            }
            
            boardElement.appendChild(tr);
        }
    }
    
    // Handle cell input
    function handleInput(e) {
        const input = e.target;
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);
        let value = input.value.trim();
        
        // Validate input
        if (value && !/^[1-9]$/.test(value)) {
            input.value = '';
            currentBoard[row][col] = 0;
            input.classList.remove('correct', 'incorrect');
            return;
        }
        
        // Update board state
        currentBoard[row][col] = value ? parseInt(value) : 0;
        
        // Validate the move
        if (value) {
            validateMove(input, row, col, parseInt(value));
        } else {
            input.classList.remove('correct', 'incorrect');
        }
    }
    
    // Validate a move
    function validateMove(input, row, col, num) {
        const temp = currentBoard[row][col];
        currentBoard[row][col] = 0;
        
        const isValid = isMoveValid(currentBoard, row, col, num);
        
        currentBoard[row][col] = temp;
        
        input.classList.remove('correct', 'incorrect');
        
        if (isValid) {
            input.classList.add('correct');
            checkCompletion();
        } else {
            input.classList.add('incorrect');
            animateConflict(input);
        }
    }
    
    // Check if move is valid
    function isMoveValid(board, row, col, num) {
        // Check row
        if (board[row].includes(num)) return false;
        
        // Check column
        for (let i = 0; i < 9; i++) {
            if (board[i][col] === num) return false;
        }
        
        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = boxRow; i < boxRow + 3; i++) {
            for (let j = boxCol; j < boxCol + 3; j++) {
                if (board[i][j] === num) return false;
            }
        }
        
        return true;
    }
    
    // Check if board is complete
    function checkCompletion() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (currentBoard[row][col] === 0) return false;
                const cell = document.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
                if (cell && cell.classList.contains('incorrect')) {
                    return false;
                }
            }
        }
        
        // Puzzle solved!
        triggerConfetti();
        boardElement.classList.add('animate__rubberBand');
        setTimeout(() => {
            boardElement.classList.remove('animate__rubberBand');
        }, 1000);
        return true;
    }
    
    // Highlight related cells
    function highlightRelatedCells(row, col) {
        removeHighlights();
        
        // Highlight row and column
        for (let i = 0; i < 9; i++) {
            const rowCell = document.querySelector(`input[data-row="${row}"][data-col="${i}"]`);
            const colCell = document.querySelector(`input[data-row="${i}"][data-col="${col}"]`);
            
            if (rowCell) rowCell.parentElement.classList.add('cell-highlight');
            if (colCell) colCell.parentElement.classList.add('cell-highlight');
        }
        
        // Highlight 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = boxRow; i < boxRow + 3; i++) {
            for (let j = boxCol; j < boxCol + 3; j++) {
                const boxCell = document.querySelector(`input[data-row="${i}"][data-col="${j}"]`);
                if (boxCell) boxCell.parentElement.classList.add('cell-highlight');
            }
        }
    }
    
    // Remove all highlights
    function removeHighlights() {
        const highlightedCells = document.querySelectorAll('.cell-highlight');
        highlightedCells.forEach(cell => {
            cell.classList.remove('cell-highlight');
        });
    }
    
    // Animate conflict
    function animateConflict(input) {
        input.parentElement.classList.add('cell-conflict');
        setTimeout(() => {
            input.parentElement.classList.remove('cell-conflict');
        }, 1000);
    }
    
    // Load a board into the UI
    function loadBoard(boardData, isInitial = false) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const input = document.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
                if (!input) continue;
                
                if (boardData[row][col] !== 0) {
                    input.value = boardData[row][col];
                    
                    if (isInitial) {
                        input.readOnly = true;
                        input.classList.add('initial');
                    } else {
                        input.readOnly = false;
                        input.classList.remove('initial');
                    }
                } else {
                    input.value = '';
                    input.readOnly = false;
                    input.classList.remove('initial');
                }
                
                input.classList.remove('correct', 'incorrect');
            }
        }
    }
    
    // Start a new game
    async function newGame(difficulty) {
        if (isSolving) return;
        
        try {
            isSolving = false;
            solveBtn.disabled = false;
            
            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ difficulty })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate new game');
            }

            const data = await response.json();
            
            if (data.status !== 'success') {
                throw new Error(data.message || 'Failed to generate new game');
            }

            currentBoard = data.board.map(row => [...row]);
            initialBoard = data.board.map(row => [...row]);
            loadBoard(currentBoard, true);
            resetStats();
            
        } catch (error) {
            console.error('Error loading new game:', error);
            alert(`Error: ${error.message}`);
        }
    }
    
    // Solve the board visually
    async function solveBoard() {
        if (isSolving) return;
        
        isSolving = true;
        solveBtn.disabled = true;
        
        try {
            const response = await fetch('/solve-with-trace', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ board: currentBoard })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to solve puzzle');
            }

            const data = await response.json();
            
            if (data.status === 'success') {
                await animateSolution(data.steps);
                currentBoard = data.solution;
                checkCompletion();
            } else {
                throw new Error(data.message || 'No solution found');
            }
            
        } catch (error) {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
        } finally {
            isSolving = false;
            solveBtn.disabled = false;
        }
    }
    
    // Animate the solving process
    async function animateSolution(steps) {
        const allInputs = document.querySelectorAll('#sudoku-board input');
        allInputs.forEach(input => {
            input.readOnly = false;
            input.classList.remove('initial');
        });

        stepsCount.textContent = '0';
        backtracksCount.textContent = '0';
        
        for (const step of steps) {
            const { row, col, num, action, stats } = step;
            const cell = document.querySelector(`#sudoku-board tr:nth-child(${row + 1}) td:nth-child(${col + 1})`);
            if (!cell) continue;
            
            const input = cell.querySelector('input');
            
            stepsCount.textContent = stats.steps;
            backtracksCount.textContent = stats.backtracks;
            
            if (action === 'place') {
                cell.classList.add('cell-highlight');
                createParticles(cell, num, 'place');
                await typewriterEffect(input, num);
                currentBoard[row][col] = num;
            } else if (action === 'remove') {
                createParticles(cell, num, 'remove');
                input.style.animation = 'removeNumber 0.5s forwards';
                await new Promise(r => setTimeout(r, 500));
                input.value = '';
                input.style.animation = '';
                currentBoard[row][col] = 0;
            }
            
            await new Promise(r => setTimeout(r, solvingSpeed));
            cell.classList.remove('cell-highlight');
        }
    }
    
    // Typewriter effect for numbers
    async function typewriterEffect(input, num) {
        if (!input) return;
        
        input.value = '';
        const delay = Math.max(30, solvingSpeed / 5);
        for (let i = 1; i <= num; i++) {
            input.value = i;
            await new Promise(r => setTimeout(r, delay));
        }
    }
    
    // Create particle effects
    function createParticles(cell, num, type) {
        const rect = cell.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const particleCount = Math.max(5, Math.floor(20 * (solvingSpeed / 300)));
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.textContent = type === 'place' ? num : '';
            
            const angle = Math.random() * Math.PI * 2;
            const distance = type === 'place' ? 0 : Math.random() * 100 + 50;
            const targetX = centerX + Math.cos(angle) * distance;
            const targetY = centerY + Math.sin(angle) * distance;
            
            document.body.appendChild(particle);
            
            particle.animate([
                { 
                    transform: type === 'place' ? 
                        `translate(${targetX}px, ${targetY}px) scale(0)` : 
                        `translate(${centerX}px, ${centerY}px) scale(1)`,
                    opacity: 0
                },
                { 
                    transform: type === 'place' ? 
                        `translate(${centerX}px, ${centerY}px) scale(1)` : 
                        `translate(${targetX}px, ${targetY}px) scale(0)`,
                    opacity: 1
                }
            ], {
                duration: solvingSpeed * 2,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }).onfinish = () => particle.remove();
        }
    }
    
    // Trigger confetti celebration
    function triggerConfetti() {
        const particles = [];
        const colors = ['#ff2ced', '#0af', '#0f0', '#ff0', '#fff'];
        const particleCount = Math.min(100, Math.floor(window.innerWidth / 10));

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * confettiCanvas.width,
                y: -Math.random() * confettiCanvas.height * 0.5,
                size: Math.random() * 6 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: Math.random() * 3 + 2,
                angle: Math.random() * Math.PI * 2,
                rotation: Math.random() * 0.2 - 0.1
            });
        }
        
        function renderConfetti() {
            confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            
            particles.forEach((p, i) => {
                p.y += p.speed;
                p.angle += p.rotation;
                
                confettiCtx.save();
                confettiCtx.translate(p.x, p.y);
                confettiCtx.rotate(p.angle);
                confettiCtx.fillStyle = p.color;
                confettiCtx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                confettiCtx.restore();
                
                if (p.y > confettiCanvas.height) {
                    particles.splice(i, 1);
                }
            });
            
            if (particles.length > 0) {
                requestAnimationFrame(renderConfetti);
            }
        }
        
        renderConfetti();
    }
    
    // Reset the board to initial state
    function resetBoard() {
        if (isSolving) return;
        loadBoard(initialBoard, true);
        currentBoard = initialBoard.map(row => [...row]);
        resetStats();
    }
    
    // Clear the board completely
    function clearBoard() {
        if (isSolving) return;
        const emptyBoard = Array(9).fill().map(() => Array(9).fill(0));
        loadBoard(emptyBoard);
        currentBoard = emptyBoard.map(row => [...row]);
        resetStats();
    }
    
    // Reset statistics
    function resetStats() {
        stepsCount.textContent = '0';
        backtracksCount.textContent = '0';
    }
    
    // Provide a hint
    function provideHint() {
        if (isSolving) return;
        
        const emptyCells = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (currentBoard[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        if (emptyCells.length === 0) return;
        
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const { row, col } = randomCell;
        
        const possibleNumbers = [];
        for (let num = 1; num <= 9; num++) {
            if (isMoveValid(currentBoard, row, col, num)) {
                possibleNumbers.push(num);
            }
        }
        
        if (possibleNumbers.length === 0) {
            alert("No valid moves for this cell!");
            return;
        }
        
        const hintNum = possibleNumbers[Math.floor(Math.random() * possibleNumbers.length)];
        const cell = document.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;
        
        cell.focus();
        
        let counter = 0;
        const interval = setInterval(() => {
            cell.value = counter % 2 === 0 ? hintNum : '';
            counter++;
            
            if (counter > 5) {
                clearInterval(interval);
                cell.value = hintNum;
                currentBoard[row][col] = hintNum;
                validateMove(cell, row, col, hintNum);
                checkCompletion();
            }
        }, 200);
    }
    
    // Event listeners
    solveBtn.addEventListener('click', solveBoard);
    hintBtn.addEventListener('click', provideHint);
    resetBtn.addEventListener('click', resetBoard);
    clearBtn.addEventListener('click', clearBoard);
    easyBtn.addEventListener('click', () => newGame('easy'));
    mediumBtn.addEventListener('click', () => newGame('medium'));
    hardBtn.addEventListener('click', () => newGame('hard'));
    speedSlider.addEventListener('input', (e) => {
        solvingSpeed = 300 - e.target.value;
    });
    
    // Window resize handler
    window.addEventListener('resize', () => {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    });
    
    // Initialize the game
    initializeBoard();
    newGame('easy');
});