# Local Tic-Tac-Toe Game

## Game Architecture and Implementation

### Game Entities

The Tic-Tac-Toe game is structured around several key entities:

1. **Game Room**
   - Represents a unique game session identified by a game ID
   - Manages the state of the current game
   - Tracks players, board state, current turn, and game progress

2. **Player**
   - Identified by a unique session or socket connection
   - Assigned either 'X' or 'O' symbol
   - Can make moves on the game board

3. **Game Board**
   - 3x3 grid represented as a list or 2D array
   - Tracks the state of each cell (empty, 'X', or 'O')

### Game Flow

1. **Game Initialization**
   - Player creates or joins a game room using a unique game ID
   - First player to join becomes 'X', second player becomes 'O'
   - Game board is initialized as empty

2. **Turn Management**
   - Players take turns making moves
   - Server validates and processes each move
   - Alternates between players after each valid move
   - Prevents players from making moves out of turn

3. **Move Validation**
   - Checks if the selected cell is empty
   - Ensures the move is made by the correct player
   - Updates the board state if the move is valid

4. **Win Condition Check**
   The win condition is checked after each move by examining:
   - **Horizontal Lines**: Checks each row for three matching symbols
   - **Vertical Lines**: Checks each column for three matching symbols
   - **Diagonal Lines**: Checks both diagonals for three matching symbols

   Win detection algorithm:
   ```python
   def check_win(board):
       # Check rows
       for row in board:
           if row.count(row[0]) == len(row) and row[0] != None:
               return row[0]
       
       # Check columns
       for col in range(3):
           column = [board[row][col] for row in range(3)]
           if column.count(column[0]) == len(column) and column[0] != None:
               return column[0]
       
       # Check diagonals
       diag1 = [board[i][i] for i in range(3)]
       diag2 = [board[i][2-i] for i in range(3)]
       
       if diag1.count(diag1[0]) == len(diag1) and diag1[0] != None:
           return diag1[0]
       if diag2.count(diag2[0]) == len(diag2) and diag2[0] != None:
           return diag2[0]
       
       return None
   ```

5. **Game Termination**
   - Game ends when:
     * A player wins by getting three symbols in a line
     * The board is full (resulting in a draw)
   - Scores are updated
   - Option to start a new game is provided

### Communication Architecture

- **Server-Side:** Flask with Socket.IO
  - Manages game rooms
  - Handles player connections
  - Processes game moves
  - Broadcasts game state updates

- **Client-Side:** JavaScript with Socket.IO
  - Sends player moves to the server
  - Receives and updates game state
  - Manages UI interactions

## Running the Game

### Server Setup

1. **Prerequisites**
   - Python 3.6 or higher
   - pip (Python package manager)

2. **Installation**
   ```bash
   # Clone the repository
   git clone https://github.com/HayElmaliah/TicTacToe.git
   
   # Navigate to the project directory
   cd TicTacToe
   
   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Starting the Server**
   ```bash
   # Run the Flask application
   python app.py
   ```
   - The server will start at `http://127.0.0.1:8080`

### Connecting and Playing

1. **Local Play (Same Computer)**
   - Open two browser windows
   - Navigate to `http://127.0.0.1:8080`
   - Enter the same game ID in both windows

2. **Network Play**
   - Find the host computer's IP address (e.g., 192.168.1.5)
   - Other players on the same network can connect to `http://[host-ip]:8080`
   - Ensure all players use the same game ID

### Game Interaction

1. Enter a unique game ID
2. Wait for the second player to join
3. Take turns clicking on empty cells
4. Game automatically detects wins or draws
5. Use "Play Again" to start a new round

## Technical Stack

- **Backend:** Python, Flask, Flask-SocketIO
- **Frontend:** HTML5, CSS3, JavaScript
- **Real-time Communication:** WebSockets (Socket.IO)

## License

MIT License - See LICENSE file for details.