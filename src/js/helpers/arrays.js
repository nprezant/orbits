// javascript array helper functions

export function arange(start, stop, step=1) {
    // make an array over the range of values
    // start, stop, step=1
    
    var a = [];
    for (var i = start; i <= stop; i+=step) {
        a.push(i);
    }
    return a;
}

export function fillArray(value, len) {
  var arr = [];
  for (var i = 0; i < len; i++) {
    arr.push(value);
  }
  return arr;
}

// returns the dictionary values as a list
export function dictValues(d) {
  let list = Object.keys(d).map(function(key){
    return d[key];
  });
  return list
}