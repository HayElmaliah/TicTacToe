document.addEventListener('DOMContentLoaded', function() {
    // Game state
    let gameId = '';
    let playerId = '';
    let playerMark = '';
    let currentBoard = Array(9).fill(null);
    let isMyTurn = false;
    let gameActive = false;
    
    // Score tracking
    let scores = {
        X: 0,
        O: 0,
        draws: 0
    };
    
    // DOM elements
    const gameSetup = document.getElementById('game-setup');
    const gameInfo = document.getElementById('game-info');
    const gameContainer = document.getElementById('game-container');
    const gameBoard = document.getElementById('game-board');
    const gameIdInput = document.getElementById('game-id-input');
    const joinBtn = document.getElementById('join-btn');
    const displayGameId = document.getElementById('display-game-id');
    const playerMarkSpan = document.getElementById('player-mark');
    const gameStatus = document.getElementById('game-status');
    const cells = document.querySelectorAll('.cell');
    const scoreBoard = document.getElementById('score-board');
    const playAgainBtn = document.getElementById('play-again-btn');
    const resetScoresBtn = document.getElementById('reset-scores-btn');
    
    // Connect to Socket.IO
    const socket = io();
    
    // Socket events
    socket.on('connect', function() {
        console.log('Connected to server with ID: ' + socket.id);
        playerId = socket.id;
    });
    
    socket.on('disconnect', function() {
        console.log('Disconnected from server');
        gameActive = false;
        setGameStatus('Disconnected from server', 'error');
    });
    
    socket.on('error', function(data) {
        console.error('Error: ' + data.message);
        alert(data.message);
    });
    
    socket.on('game_joined', function(data) {
        console.log('Game joined: ' + data.gameId);
        gameId = data.gameId;
        playerMark = data.mark;
        isMyTurn = data.isYourTurn;
        currentBoard = data.board;
        gameActive = true;
        
        displayGameId.textContent = gameId;
        playerMarkSpan.textContent = playerMark;
        playerMarkSpan.className = 'player-mark ' + playerMark.toLowerCase();
        setGameStatus(data.message);
        
        gameSetup.classList.add('hidden');
        gameInfo.classList.remove('hidden');
        gameContainer.classList.remove('hidden');
        gameBoard.classList.remove('hidden'); // Show the game board
        
        updateBoard();
        startPolling();
    });
    
    socket.on('opponent_joined', function(data) {
        console.log('Opponent joined');
        gameActive = true;
        setGameStatus(data.message);
    });
    
    socket.on('board_updated', function(data) {
        console.log('Board updated via Socket.IO');
        currentBoard = data.board;
        isMyTurn = data.currentTurn === playerId;
        
        setGameStatus(isMyTurn ? 'Your turn' : "Opponent's turn");
        updateBoard();
    });
    
    socket.on('game_over', function(data) {
        console.log('Game over: ' + data.message);
        currentBoard = data.board;
        gameActive = false;
        
        updateBoard();
        
        // Small delay before showing alert
        setTimeout(function() {
            setGameStatus(data.message, data.winner ? 'success' : 'draw');
            alert(data.message);
            
            // Update scores
            if (data.winner) {
                updateScores(data.winner);
            } else {
                updateScores(null); // Draw
            }
            
            // Show play again option
            playAgainBtn.classList.remove('hidden');
        }, 100);
        
        // Stop polling
        stopPolling();
    });
    
    socket.on('opponent_left', function(data) {
        console.log('Opponent left');
        gameActive = false;
        setGameStatus(data.message, 'warning');
    });
    
    socket.on('game_reset', function(data) {
        console.log('Game reset');
        currentBoard = data.board;
        isMyTurn = data.currentTurn === playerId;
        gameActive = true;
        
        setGameStatus(data.message);
        updateBoard();
        
        // Hide play again button
        playAgainBtn.classList.add('hidden');
        
        // Start polling again
        startPolling();
    });
    
    // Join game
    joinBtn.addEventListener('click', function() {
        const id = gameIdInput.value.trim();
        if (id) {
            socket.emit('join_game', { gameId: id });
        } else {
            alert('Please enter a game ID');
        }
    });
    
    // Allow pressing Enter to join game
    gameIdInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            joinBtn.click();
        }
    });
    
    // Cell click handler
    cells.forEach(function(cell, index) {
        cell.addEventListener('click', function() {
            if (!gameActive || !isMyTurn) return;
            
            if (currentBoard[index] === null) {
                socket.emit('make_move', { gameId, index });
                
                // Optimistic UI update (will be overridden by server if invalid)
                cell.textContent = playerMark;
                cell.classList.add(playerMark.toLowerCase());
            }
        });
    });
    
    // Play again button
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', resetGame);
    }
    
    // Reset scores button
    if (resetScoresBtn) {
        resetScoresBtn.addEventListener('click', function() {
            scores = { X: 0, O: 0, draws: 0 };
            updateScoreDisplay();
        });
    }
    
    // Update board UI
    function updateBoard() {
        cells.forEach(function(cell, index) {
            cell.textContent = currentBoard[index] || '';
            cell.classList.remove('x', 'o');
            
            if (currentBoard[index] === 'X') {
                cell.classList.add('x');
            } else if (currentBoard[index] === 'O') {
                cell.classList.add('o');
            }
        });
    }
    
    // Polling for updates
    let pollingInterval;
    
    function startPolling() {
        stopPolling();
        pollingInterval = setInterval(pollGameState, 1000);
    }
    
    function stopPolling() {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    }
    
    function pollGameState() {
        if (!gameId) return;
        
        fetch('/game/' + gameId)
            .then(function(response) {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(function(data) {
                // Only update if different
                if (JSON.stringify(currentBoard) !== JSON.stringify(data.board)) {
                    console.log('Board updated via polling');
                    currentBoard = data.board;
                    isMyTurn = data.currentTurn === playerId;
                    
                    setGameStatus(isMyTurn ? 'Your turn' : "Opponent's turn");
                    updateBoard();
                }
                
                // Handle game over state
                if (data.gameOver && gameActive) {
                    gameActive = false;
                    stopPolling();
                    
                    // We'll let the socket.io game_over event handle the rest
                }
            })
            .catch(function(error) {
                console.error('Polling error:', error);
            });
    }
    
    // Game status
    function setGameStatus(message, type = '') {
        gameStatus.textContent = message;
        gameStatus.className = 'status';
        
        if (type) {
            gameStatus.classList.add('status-' + type);
        }
    }
    
    // Update scores
    function updateScores(winner) {
        if (winner === 'X') {
            scores.X++;
        } else if (winner === 'O') {
            scores.O++;
        } else {
            scores.draws++;
        }
        
        updateScoreDisplay();
    }
    
    // Update score display
    function updateScoreDisplay() {
        if (scoreBoard) {
            scoreBoard.innerHTML = `
                <div class="score-item">X: ${scores.X}</div>
                <div class="score-item">O: ${scores.O}</div>
                <div class="score-item">Draws: ${scores.draws}</div>
            `;
        }
    }
    
    // Reset game for new round
    function resetGame() {
        socket.emit('reset_game', { gameId });
    }
});