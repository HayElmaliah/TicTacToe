# app.py
from flask import Flask, render_template, request, session
from flask_socketio import SocketIO, emit, join_room, leave_room
import os

app = Flask(__name__, static_folder='static')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key')
socketio = SocketIO(app, cors_allowed_origins="*")

# Game state
games = {}

# Routes
@app.route('/')
def index():
    return render_template('main.html')

@app.route('/game/<game_id>', methods=['GET'])
def get_game_state(game_id):
    if game_id in games:
        game = games[game_id]
        return {
            'board': game['board'],
            'currentTurn': game['current_turn'],
            'gameOver': game['game_over'],
            'winner': game['winner'],
            'moveCount': game['move_count']
        }
    else:
        return {'error': 'Game not found'}, 404

# Helper function to check for a winner
def check_winner(board):
    # Define winning combinations
    winning_combinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],  # Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8],  # Columns
        [0, 4, 8], [2, 4, 6]              # Diagonals
    ]
    
    for combo in winning_combinations:
        a, b, c = combo
        if board[a] and board[a] == board[b] == board[c]:
            return board[a]
    return None

# Socket.IO events
@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')
    
    # Find and clean up games where this player was participating
    for game_id in list(games.keys()):
        game = games[game_id]
        if request.sid in game['players']:
            # Notify other player
            for player_id in game['players']:
                if player_id != request.sid:
                    emit('opponent_left', {
                        'message': 'Opponent left the game.'
                    }, room=player_id)
            
            # Remove the game
            del games[game_id]

@socketio.on('join_game')
def handle_join_game(data):
    game_id = data['gameId']
    
    # If game doesn't exist, create it
    if game_id not in games:
        games[game_id] = {
            'id': game_id,
            'board': [None] * 9,
            'players': [request.sid],
            'current_turn': request.sid,
            'marks': {request.sid: 'X'},
            'game_over': False,
            'winner': None,
            'move_count': 0
        }
        join_room(game_id)
        emit('game_joined', {
            'gameId': game_id,
            'playerId': request.sid,
            'mark': 'X',
            'board': games[game_id]['board'],
            'isYourTurn': True,
            'message': 'Waiting for opponent to join...'
        })
        print(f'Player {request.sid} created game {game_id}')
    
    # If game exists but is not full, join it
    elif len(games[game_id]['players']) == 1:
        games[game_id]['players'].append(request.sid)
        games[game_id]['marks'][request.sid] = 'O'
        join_room(game_id)
        emit('game_joined', {
            'gameId': game_id,
            'playerId': request.sid,
            'mark': 'O',
            'board': games[game_id]['board'],
            'isYourTurn': False,
            'message': 'Game started! Waiting for X to move.'
        })
        emit('opponent_joined', {
            'message': 'Opponent joined! Your turn (X).'
        }, room=games[game_id]['players'][0])
        print(f'Player {request.sid} joined game {game_id}')
    
    # Game is full
    else:
        emit('error', {'message': 'Game is full'})

@socketio.on('make_move')
def handle_make_move(data):
    game_id = data['gameId']
    index = data['index']
    
    # Validate game exists
    if game_id not in games:
        emit('error', {'message': 'Game not found'})
        return
    
    game = games[game_id]
    
    # Check if it's the player's turn
    if game['current_turn'] != request.sid:
        emit('error', {'message': 'Not your turn'})
        return
    
    # Check if move is valid
    if game['board'][index] is not None or game['game_over']:
        emit('error', {'message': 'Invalid move'})
        return
    
    # Make move
    game['board'][index] = game['marks'][request.sid]
    game['move_count'] += 1
    
    # Check for win or draw
    winner = check_winner(game['board'])
    is_draw = game['move_count'] == 9 and not winner
    
    if winner:
        game['game_over'] = True
        game['winner'] = request.sid
        emit('game_over', {
            'board': game['board'],
            'winner': game['marks'][request.sid],
            'message': f'Player {game["marks"][request.sid]} wins!'
        }, room=game_id)
    elif is_draw:
        game['game_over'] = True
        emit('game_over', {
            'board': game['board'],
            'winner': None,
            'message': 'Game ended in a draw!'
        }, room=game_id)
    else:
        # Switch turns
        game['current_turn'] = next(player_id for player_id in game['players'] if player_id != request.sid)
        
        # Notify players with board_updated event
        update_data = {
            'board': game['board'],
            'currentTurn': game['current_turn'],
            'lastMove': {
                'player': request.sid,
                'mark': game['marks'][request.sid],
                'index': index
            }
        }
        socketio.emit('board_updated', update_data, room=game_id)

@socketio.on('reset_game')
def handle_reset_game(data):
    game_id = data['gameId']
    
    # Check if game exists
    if game_id not in games:
        emit('error', {'message': 'Game not found'})
        return
    
    game = games[game_id]
    
    # Reset the game board but keep player information
    game['board'] = [None] * 9
    game['game_over'] = False
    
    # If there was a winner, let them start the next round
    if game['winner']:
        first_player = game['winner']
        first_mark = game['marks'][first_player]
        message = f'Game reset. {first_mark} won last round and goes first!'
    else:
        # If it was a draw or new game, X goes first
        first_player = next(player_id for player_id, mark in game['marks'].items() if mark == 'X')
        message = 'Game reset. X goes first!'
    
    game['current_turn'] = first_player
    game['winner'] = None
    game['move_count'] = 0
    
    # Notify all players
    emit('game_reset', {
        'board': game['board'],
        'currentTurn': game['current_turn'],
        'message': message
    }, room=game_id)

if __name__ == '__main__':
    # Use PORT environment variable if defined, otherwise use 8081
    port = int(os.environ.get('PORT', 8081))
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
