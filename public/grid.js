
var grid_number = 10;
var cell_size = 200; 
var grid;

function initializeGrid() {
  grid = new Array(grid_number)
  for (var i = 0; i < grid_number; i++) {
    grid[i] = new Array(grid_number);
    for (var j = 0; j < grid_number; j++) {
      grid[i][j] = new Cell(i, j);
      console.log('Initialising ' + i + ', ' + j);
    }
  }
}

function Cell(x, y) {
  this.number = grid_number * y + x;
  this.x = x;
  this.y = y;
  this.ships = null;
}

// Get Cell given pixel position
function coordinateToCell(x, y) {
  if (!grid) {
    return null;
  }
  var x_coord = Math.floor(x / cell_size);
  var y_coord = Math.floor(y / cell_size);
  console.log('x,y = ' + x_coord + ', ' + y_coord);
  return grid[x_coord][y_coord];
}

