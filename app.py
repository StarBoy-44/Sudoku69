from flask import Flask, render_template, request, jsonify
import numpy as np
import random
from time import time
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def is_valid(board, row, col, num):
    # Check row
    if num in board[row]:
        return False
    
    # Check column
    if num in [board[i][col] for i in range(9)]:
        return False
    
    # Check 3x3 box
    box_row, box_col = row // 3 * 3, col // 3 * 3
    for i in range(box_row, box_row + 3):
        for j in range(box_col, box_col + 3):
            if board[i][j] == num:
                return False
    return True

def solve_sudoku_with_steps(board, callback=None):
    for row in range(9):
        for col in range(9):
            if board[row][col] == 0:
                for num in range(1, 10):
                    if is_valid(board, row, col, num):
                        board[row][col] = num
                        if callback:
                            callback(board, row, col, num, 'place')
                        if solve_sudoku_with_steps(board, callback):
                            return True
                        board[row][col] = 0
                        if callback:
                            callback(board, row, col, num, 'remove')
                return False
    return True

def generate_sudoku(difficulty):
    # Create empty board
    board = [[0 for _ in range(9)] for _ in range(9)]
    
    # Fill diagonal boxes
    for box in range(0, 9, 3):
        nums = list(range(1, 10))
        random.shuffle(nums)
        for i in range(3):
            for j in range(3):
                board[box + i][box + j] = nums.pop()
    
    # Solve the board
    solve_sudoku_with_steps(board)
    
    # Remove numbers based on difficulty
    cells_to_remove = {
        'easy': 40,
        'medium': 50,
        'hard': 60
    }.get(difficulty, 40)
    
    positions = [(i, j) for i in range(9) for j in range(9)]
    random.shuffle(positions)
    
    for i in range(cells_to_remove):
        row, col = positions[i]
        board[row][col] = 0
    
    return board

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.get_json()
        difficulty = data.get('difficulty', 'medium')
        board = generate_sudoku(difficulty)
        return jsonify({'status': 'success', 'board': board})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/solve-with-trace', methods=['POST'])
def solve_with_trace():
    try:
        data = request.get_json()
        board = data.get('board')
        if not board:
            return jsonify({'status': 'error', 'message': 'No board provided'}), 400
            
        steps = []
        stats = {'backtracks': 0, 'steps': 0}

        def callback(b, row, col, num, action):
            stats['steps'] += 1
            if action == 'remove':
                stats['backtracks'] += 1
            steps.append({
                'row': row, 
                'col': col,
                'num': num,
                'action': action,
                'board': [row[:] for row in b],
                'stats': stats.copy()
            })
        
        if solve_sudoku_with_steps(board, callback):
            return jsonify({
                'status': 'success',
                'solution': board,
                'steps': steps,
                'stats': stats
            })
        return jsonify({'status': 'fail', 'message': 'No solution found'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run()