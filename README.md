# Real-Time Tic-Tac-Toe Game

A real-time multiplayer Tic-Tac-Toe game built with Python Flask and Socket.IO that allows players to compete across different browsers. Play the classic game with friends no matter where they are!

## Features

- **Real-time gameplay** using WebSockets through Socket.IO
- **Responsive design** that works on both desktop and mobile devices
- **Room-based system** that allows multiple games to run simultaneously
- **Elegant dark theme** with modern UI
- **Persistent score tracking** during game sessions
- **Automatic turn management** and game state synchronization
- **Optimized layout** - controls and info panel on the left, game board on the right (on desktop)

## Project Structure

```
tic-tac-toe/
│
├── app.py                # Flask server and game logic
├── Procfile              # Deployment configuration for web hosting
├── requirements.txt      # Project dependencies
│
├── templates/
│   └── main.html         # Game interface
│
└── static/
    ├── styles.css        # CSS styles with responsive layout
    └── main.js           # Client-side JavaScript for game logic
```

## How to Play

1. Enter a game ID to create or join a game
2. Share this game ID with your opponent
3. First player gets 'X', second player gets 'O'
4. Take turns making moves until someone wins or the game ends in a draw
5. Track scores across multiple rounds
6. Use the "Play Again" button to start a new round

## Running Locally

### Prerequisites

- Python 3.6+
- pip (Python package manager)

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/tic-tac-toe.git
   cd tic-tac-toe
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Start the server:
   ```
   python app.py
   ```

4. Open a web browser and navigate to:
   ```
   http://localhost:8081
   ```

## Deploying to the Web

This application is ready to deploy to platforms like Render.com or Heroku.

### Quick Deployment to Render.com

1. Push your code to a GitHub repository
2. Sign up for a Render.com account
3. Create a new Web Service and connect to your GitHub repository
4. Use the following settings:
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: (leave empty, Procfile will handle this)
5. Deploy and share the provided URL

## Game Design

### Game Flow

1. Player creates or joins a game by entering a game ID
2. First player is assigned 'X', second player is assigned 'O'
3. Players take turns making moves
4. After each move, the server:
   - Updates the game board
   - Checks for win/draw conditions
   - Switches the current turn
   - Broadcasts the updated state to both players
5. Game ends when a player wins or the board is full (draw)
6. Players can start a new round while keeping score

### Technical Implementation

- **Server-side:** Flask, Flask-SocketIO
- **Client-side:** HTML, CSS, JavaScript, Socket.IO client
- **Communication:** Real-time WebSockets with polling fallback
- **State Management:** Server-managed game state with client-side validation

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with Flask and Socket.IO
- Designed for simplicity and responsiveness
- Created for learning and entertainment purposes