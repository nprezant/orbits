import './search-bar.less';

let searchBar;

export class SearchItem{
    constructor(text, fn) {
        this.text = text;
        this.fn = fn;
    }
}

export default class SearchBar{
    constructor(searchItems=[]) {
        // searchItems is a list of search items,
        // e.g. [ SearchItem(text: 'Add orbit', fn: ()=>{} ) ]
        searchBar = this;
        this.MAX_RESULT_COUNT = 8;

        this.searchItems = searchItems;

        this.searchBar = document.createElement('div');
        this.searchBar.id = 'search-bar';
        document.body.append(this.searchBar);

        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.id = 'search-input';
        this.input.placeholder = 'Search';
        this.input.spellcheck = false;
        this.input.addEventListener('keyup', this.handleKeys, false);
        this.searchBar.appendChild(this.input);

        let searchResults = document.createElement('div');
        searchResults.id = 'search-results';
        this.searchBar.appendChild(searchResults);

        this.displayList = document.createElement('ul');
        this.displayList.id = 'search-results-list';
        searchResults.appendChild(this.displayList);

        // Listen for click event to un-focus
        document.addEventListener('click', (e) => {
            if (!e.target.matches('#search-input')) {
                this.handleUnfocus();
            }
        }, false);

        // Listen to focus on the search bar
        document.addEventListener('keyup', (e) => {
            if (e.key == '/') {
                searchBar.input.focus();
            }
        }, false)
    }

    handleKeys(e) {
        switch(e.key) {
            case 'Escape':
                searchBar.handleUnfocus();
                break;
            
            case 'Enter':
                searchBar.runSelectedSearchResult();
                break;

            case 'ArrowUp':
                searchBar.moveSelectedSearchResult('up');
                break;

            case 'ArrowDown':
                searchBar.moveSelectedSearchResult('down');
                break;

            case 'ArrowLeft':
            case 'ArrowRight':
                break;

            default:
                searchBar.search(e.target);
        }
    }

    runSelectedSearchResult() {
        let li = searchBar.displayList.querySelector('.selected');
        li.dispatchEvent(new MouseEvent("pointerup", {bubbles: true}));
        searchBar.handleUnfocus();
    }

    moveSelectedSearchResult(direction) {
        // direction = 'up' or 'down'
        let li = searchBar.displayList.querySelector('.selected');
        let next;

        if (direction == 'down') {
            next = li.nextSibling;
        } else if (direction == 'up') {
            next = li.previousSibling;
        } else {
            throw 'Invalid search bar move direction: ' + direction;
        }

        // if we're at the top or the bottom, the sibling is null
        if (next == null) {
            next = li;
        }
        
        searchBar.selectResult(next);
    }

    handleUnfocus() {
        this.clearList();
        searchBar.input.value = '';
        searchBar.input.blur();
    }

    selectResult(el) {
        Array.prototype.forEach.call(this.displayList.children, li => {
            li.classList.remove('selected');
        });
        el.classList.add('selected');
    }

    clearList() {
        let root = this.displayList;
        while (root.firstChild ) {
            root.removeChild(root.firstChild);
        }
    }

    search(input) {
        let filter = input.value.toUpperCase();

        this.clearList();
        if (filter.length == 0) {
            this.displayList.style.visibility = 'hidden';
            return;
        } else {
            this.displayList.style.visibility = 'visible';
        }

        for (let item of this.searchItems) {
            if (item.text.toUpperCase().indexOf(filter) > -1) {
                let textNode = document.createTextNode(item.text);

                let li = document.createElement('li');
                li.appendChild(textNode);
                li.addEventListener('pointerup', item.fn, false);

                this.displayList.appendChild(li);

                // select this if it's the first in the list
                if (this.displayList.childElementCount == 1) {
                    this.selectResult(li);
                } else if (this.displayList.childElementCount >= this.MAX_RESULT_COUNT) {
                    break;
                }
            }
        };
    }
}

