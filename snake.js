const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
//hej
const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [
    {x: 10, y: 10},
    {x: 11, y: 10},
    {x: 12, y: 10}
];
const initialAppleCount = 5;
let apples = [];
let dx = 0;
let dy = 0;
let score = 0;
let appleTimeout = null;

let aiSnake = [
    {x: 5, y: 5},
    {x: 5, y: 6},
    {x: 5, y: 7}
];
let aiDx = 0;
let aiDy = 0;

let purpleAISnake = [
    {x: 15, y: 15},
    {x: 15, y: 14},
    {x: 15, y: 13}
];
let purpleAIDx = 0;
let purpleAIDy = 0;

let gameLoop;
let gameSpeed = 100; // Default game speed (normal)

const mainMenu = document.getElementById('mainMenu');
const startButton = document.getElementById('startButton');
const speedOptions = document.getElementById('speedOptions');
const normalSpeedButton = document.getElementById('normalSpeed');
const slowSpeedButton = document.getElementById('slowSpeed');

startButton.addEventListener('click', () => {
    startButton.style.display = 'none';
    speedOptions.style.display = 'block';
});

normalSpeedButton.addEventListener('click', () => {
    gameSpeed = 100;
    startGame();
});

slowSpeedButton.addEventListener('click', () => {
    gameSpeed = 200; // 50% slower
    startGame();
});

function startGame() {
    resetGame();
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(drawGame, gameSpeed);
    mainMenu.style.display = 'none';
    canvas.style.display = 'block';
}

function drawGame() {
    clearCanvas();
    moveSnake();
    moveAISnake();
    movePurpleAISnake();
    checkCollision();
    drawSnake();
    drawAISnake();
    drawPurpleAISnake();
    drawApples();
    drawScore();
}

function clearCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function moveSnake() {
    if (dx === 0 && dy === 0) return; // Don't move if no direction is set

    let head;
    if (snake.length === 3 && dx === -1 && snake[0].x === snake[1].x) {
        // Special case: moving left at the start
        head = {x: snake[2].x, y: snake[2].y};
        snake.unshift(head);
        snake.pop();
        snake.pop();
    } else {
        head = {x: snake[0].x + dx, y: snake[0].y + dy};
        snake.unshift(head);
    }
    
    const eatenAppleIndex = apples.findIndex(apple => apple.x === head.x && apple.y === head.y);
    if (eatenAppleIndex !== -1) {
        score++;
        apples.splice(eatenAppleIndex, 1);
        generateApple();
    } else {
        snake.pop();
    }
}

function moveAISnake() {
    const head = aiSnake[0];
    let nearestApple = null;
    let minDistance = Infinity;

    // Find the nearest apple
    for (let apple of apples) {
        const distance = Math.abs(head.x - apple.x) + Math.abs(head.y - apple.y);
        if (distance < minDistance) {
            minDistance = distance;
            nearestApple = apple;
        }
    }

    let possibleMoves = [
        {dx: 1, dy: 0},  // Right
        {dx: -1, dy: 0}, // Left
        {dx: 0, dy: 1},  // Down
        {dx: 0, dy: -1}  // Up
    ];

    // Filter out moves that would result in immediate collision
    possibleMoves = possibleMoves.filter(move => {
        const newX = head.x + move.dx;
        const newY = head.y + move.dy;
        return !(newX < 0 || newX >= tileCount || newY < 0 || newY >= tileCount ||
                 aiSnake.some(segment => segment.x === newX && segment.y === newY) ||
                 snake.some(segment => segment.x === newX && segment.y === newY) ||
                 purpleAISnake.some(segment => segment.x === newX && segment.y === newY));
    });

    // Further filter moves that might trap the snake
    possibleMoves = possibleMoves.filter(move => {
        const newX = head.x + move.dx;
        const newY = head.y + move.dy;
        return hasEscapePath(newX, newY, aiSnake);
    });

    if (possibleMoves.length > 0) {
        let bestMove;
        if (nearestApple) {
            // Move towards the apple if possible
            bestMove = possibleMoves.reduce((best, move) => {
                const newDistance = Math.abs(head.x + move.dx - nearestApple.x) + 
                                    Math.abs(head.y + move.dy - nearestApple.y);
                return newDistance < best.distance ? {move, distance: newDistance} : best;
            }, {distance: Infinity}).move;
        } else {
            // Choose a random safe move
            bestMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        }
        aiDx = bestMove.dx;
        aiDy = bestMove.dy;
    } else {
        // No safe moves available, reset the snake
        resetAISnake();
        return;
    }

    const newHead = {x: head.x + aiDx, y: head.y + aiDy};
    aiSnake.unshift(newHead);

    // Check if AI snake ate an apple
    const eatenAppleIndex = apples.findIndex(apple => apple.x === newHead.x && apple.y === newHead.y);
    if (eatenAppleIndex !== -1) {
        apples.splice(eatenAppleIndex, 1);
        generateApple();
    } else if (aiSnake.length > 3) {
        aiSnake.pop();
    }
}

function movePurpleAISnake() {
    const head = purpleAISnake[0];
    let targetApple = apples[Math.floor(Math.random() * apples.length)];

    let possibleMoves = [
        {dx: 1, dy: 0},  // Right
        {dx: -1, dy: 0}, // Left
        {dx: 0, dy: 1},  // Down
        {dx: 0, dy: -1}  // Up
    ];

    // Filter out moves that would result in immediate collision
    possibleMoves = possibleMoves.filter(move => {
        const newX = head.x + move.dx;
        const newY = head.y + move.dy;
        return !(newX < 0 || newX >= tileCount || newY < 0 || newY >= tileCount ||
                 purpleAISnake.some(segment => segment.x === newX && segment.y === newY) ||
                 snake.some(segment => segment.x === newX && segment.y === newY) ||
                 aiSnake.some(segment => segment.x === newX && segment.y === newY));
    });

    // Further filter moves that might trap the snake
    possibleMoves = possibleMoves.filter(move => {
        const newX = head.x + move.dx;
        const newY = head.y + move.dy;
        return hasEscapePath(newX, newY, purpleAISnake);
    });

    if (possibleMoves.length > 0) {
        let bestMove;
        if (targetApple) {
            // Move towards the random target apple if possible
            bestMove = possibleMoves.reduce((best, move) => {
                const newDistance = Math.abs(head.x + move.dx - targetApple.x) + 
                                    Math.abs(head.y + move.dy - targetApple.y);
                return newDistance < best.distance ? {move, distance: newDistance} : best;
            }, {distance: Infinity}).move;
        } else {
            // Choose a random safe move
            bestMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        }
        purpleAIDx = bestMove.dx;
        purpleAIDy = bestMove.dy;
    } else {
        // No safe moves available, reset the snake
        resetPurpleAISnake();
        return;
    }

    const newHead = {x: head.x + purpleAIDx, y: head.y + purpleAIDy};
    purpleAISnake.unshift(newHead);

    // Check if purple AI snake ate an apple
    const eatenAppleIndex = apples.findIndex(apple => apple.x === newHead.x && apple.y === newHead.y);
    if (eatenAppleIndex !== -1) {
        apples.splice(eatenAppleIndex, 1);
        generateApple();
    } else if (purpleAISnake.length > 3) {
        purpleAISnake.pop();
    }
}

function hasEscapePath(x, y, currentSnake) {
    const visited = new Set();
    const stack = [{x, y}];
    const currentSnakeSet = new Set(currentSnake.map(segment => `${segment.x},${segment.y}`));
    const otherSnakesSet = new Set([
        ...snake.map(segment => `${segment.x},${segment.y}`),
        ...aiSnake.map(segment => `${segment.x},${segment.y}`),
        ...purpleAISnake.map(segment => `${segment.x},${segment.y}`)
    ]);

    while (stack.length > 0) {
        const current = stack.pop();
        const key = `${current.x},${current.y}`;

        if (visited.has(key)) continue;
        visited.add(key);

        if (visited.size > currentSnake.length) return true;

        const neighbors = [
            {x: current.x + 1, y: current.y},
            {x: current.x - 1, y: current.y},
            {x: current.x, y: current.y + 1},
            {x: current.x, y: current.y - 1}
        ];

        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.x},${neighbor.y}`;
            if (neighbor.x >= 0 && neighbor.x < tileCount &&
                neighbor.y >= 0 && neighbor.y < tileCount &&
                !currentSnakeSet.has(neighborKey) &&
                !otherSnakesSet.has(neighborKey)) {
                stack.push(neighbor);
            }
        }
    }

    return false;
}

function checkCollision() {
    const head = snake[0];
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        resetGame();
        return;
    }
    
    // Check collision with own body, starting from the 4th segment
    for (let i = 3; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            resetGame();
            return;
        }
    }

    // Check collision with AI snakes
    if (aiSnake.some(segment => head.x === segment.x && head.y === segment.y) ||
        purpleAISnake.some(segment => head.x === segment.x && head.y === segment.y)) {
        resetGame();
        return;
    }
}

function drawSnake() {
    ctx.fillStyle = 'green';
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    });
}

function drawAISnake() {
    ctx.fillStyle = 'blue';
    aiSnake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    });
}

function drawPurpleAISnake() {
    ctx.fillStyle = 'purple';
    purpleAISnake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    });
}

function drawApples() {
    ctx.fillStyle = 'red';
    apples.forEach(apple => {
        ctx.fillRect(apple.x * gridSize, apple.y * gridSize, gridSize - 2, gridSize - 2);
    });
}

function drawScore() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
}

function generateApple() {
    if (apples.length >= initialAppleCount) return;

    let newApple;
    do {
        newApple = {
            x: Math.floor(Math.random() * (tileCount - 2)) + 1,
            y: Math.floor(Math.random() * (tileCount - 2)) + 1
        };
    } while (
        snake.some(segment => segment.x === newApple.x && segment.y === newApple.y) ||
        aiSnake.some(segment => segment.x === newApple.x && segment.y === newApple.y) ||
        purpleAISnake.some(segment => segment.x === newApple.x && segment.y === newApple.y) ||
        apples.some(apple => apple.x === newApple.x && apple.y === newApple.y)
    );
    apples.push(newApple);
}

function resetGame() {
    snake = [
        {x: 10, y: 10},
        {x: 11, y: 10},
        {x: 12, y: 10}
    ];
    resetAISnake();
    resetPurpleAISnake();
    apples = [];
    for (let i = 0; i < initialAppleCount; i++) {
        generateApple();
    }
    dx = 0;
    dy = 0;
    score = 0;
    
    // Add these lines to show the main menu when the game resets
    mainMenu.style.display = 'block';
    speedOptions.style.display = 'none';
    startButton.style.display = 'block';
    canvas.style.display = 'none';
}

function resetAISnake() {
    aiSnake = [
        {x: 5, y: 5},
        {x: 5, y: 6},
        {x: 5, y: 7}
    ];
    aiDx = 0;
    aiDy = 0;
}

function resetPurpleAISnake() {
    purpleAISnake = [
        {x: 15, y: 15},
        {x: 15, y: 14},
        {x: 15, y: 13}
    ];
    purpleAIDx = 0;
    purpleAIDy = 0;
}

document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp': if (dy === 0 || snake.length === 1) { dx = 0; dy = -1; } break;
        case 'ArrowDown': if (dy === 0 || snake.length === 1) { dx = 0; dy = 1; } break;
        case 'ArrowLeft': if (dx === 0 || snake.length === 1) { dx = -1; dy = 0; } break;
        case 'ArrowRight': if (dx === 0 || snake.length === 1) { dx = 1; dy = 0; } break;
    }
});
