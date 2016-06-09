if (typeof exports == 'undefined') {

} else {

}
(function(exports) {

// Sort treasures by distance (squared but its the same)
function insertionSort(array, player) {
  //var array = treasures_array;
  //console.log(array.map(function(t1) {return Math.sqrt((player.state.x - t1.x) * (player.state.x - t1.x) + (player.state.y - t1.y) * (player.state.y - t1.y));}));
  //console.log(array.map(function(t1) {return Math.sqrt((player.state.x - t1.x) * (player.state.x - t1.x) + (player.state.y - t1.y) * (player.state.y - t1.y));}));

  var i, j, d1x, d1y, d2x, d2y, d1, d2, t1, t2, temp;
  for (i = 1; i < array.length; i++) {
    t1 = array[i];
    d1x = player.state.x - t1.x;
    d1y = player.state.y - t1.y;
    d1 = d1x * d1x + d1y * d1y;

    for (j = i - 1; j >= 0; j--) {
      t2 = array[j];
      d2x = player.state.x - t2.x;
      d2y = player.state.y - t2.y;
      d2 = d2x * d2x + d2y * d2y;
      if (d2 > d1) {
        temp = array[j];
        array[j] = array[j+1];
        array[j+1] = temp;
      } else {
        break;
      }
    }
  }
}

exports.insertionSort = insertionSort;

})(typeof exports == 'undefined' ? this.Utils = {} : exports);
