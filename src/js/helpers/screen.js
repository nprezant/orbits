// helper function for dealing with the user's screen

var _emSize = null;

export var getEmSize =  function() {
    // gets the size of an Em unit in pixels

    var computeEmSize = function() {
        // gets the size of an em in pixels.
        // note: the document can only hold one element
        // so if the document already has that element,
        // we'll need to append our temporary element to that.
        // Otherwise we can just use the document as the parent.

        var tempDiv = document.createElement('div');
        tempDiv.style.height = '1em';

        if (document.children.length > 0) {
            var parent = document.children[0];
        } else {
            var parent = document;
        }

        parent.appendChild(tempDiv);
        _emSize = tempDiv.offsetHeight;
        parent.removeChild(tempDiv);

        return _emSize;
    };

    if ( _emSize ) {
        return _emSize;
    } else {
        return computeEmSize();
    }
    
};