/* chrome storage */

function handleChromeError() {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError);
  } else {
    console.log('action successful');
  }
}

async function indexNotes() {
  console.log(`hitting indexNotes`)
  return chrome.storage.local.get('notes').then((result) => {
    console.log(result)
    return result;
  });
}

async function deleteNote(notes) {
  console.log(`hitting deleteNote`)
  return chrome.storage.local.set({ notes }, handleChromeError);
  // return chrome.storage.local.remove(note.id).then((result) => {
  //   console.log(result)
  // });
}

async function getNotes() {
  console.log(`hitting indexNotes`)
  return chrome.storage.local.get('notes').then((result) => {
    console.log(result)
    return result;
  });
}

function saveNote(note) {
  const noteId = note.id;
  const noteObj = note;

  chrome.storage.local.get('notes', function(result) {
    if ('notes' in result) {
      result.notes[noteId] = noteObj;

      chrome.storage.local.set({ 'notes': result.notes }, handleChromeError);
    } else {
      const notes = { [noteId]: noteObj };

      chrome.storage.local.set({ 'notes': notes }, handleChromeError);
    }
  });
}

/* constants */
const appTitle = 'Notepad';
let counter = 0;

const elReplacement = {
  'h1': 'input',
  'p': 'textarea',
};



/* state */
let currentNoteId = '';
const noteIds = {};

/* DOM elements */
const body = document.body;
body.style.backgroundColor = 'beige';

const header = document.createElement('header');
const h1 = document.createElement('h1');
const main = document.createElement('main');

h1.innerText = appTitle;

header.append(h1);
body.append(header, main);

/* navigation */

app({ page: 'home' });

async function app(options) {
  const { page, currentNote } = options;
  const result = await getNotes();
  const notes = result.notes;
  const notesIds = Object.keys(notes);
  class Note {
    constructor(title = '', body = '') {
      this.title = title;
      this.body = body;
    }
  
    lastUpdated = Date.now();
    id = this.createId();
    cardinal = counter;
  
  
    createId() {
      function genId() {
        const tenMil = 10 * 1000 * 1000;
        const newId = (Math.floor(Math.random() * tenMil) + '').padStart(7, 0);
        const exists = notes.hasOwnProperty(newId);
        return exists ? genId() : newId;
      }
      const newId =  genId();

      return newId;
    }
  }

  const current = {
    'home': function () {
      main.innerHTML = '';
      const addBtn = createBtn({
        innerText: 'Create a note', listener: createNote
      });
      main.append(addBtn);
      if (notesIds.length > 0) {
        const ul = createNoteIndex(notes);
        main.append(ul);
      }
    },
    'notePage': function () {
      main.innerHTML = '';
  
      const homeBtn = createBtn({
        innerText:'Go home',
        listener: () => {
          app({ page: 'home' });
        }
      });
      const titleHeading = createNoteTitle(currentNote);
      const noteBody = createNoteBody(currentNote);
      const noteContainer = document.createElement('div');
      noteContainer.setAttribute('class', 'note-container');
      noteContainer.setAttribute('noteId', currentNote.id);
      noteContainer.append(titleHeading, noteBody);
      main.append(homeBtn, noteContainer)
    }
  }



function createNoteTitle(note) {
  const titleHeading = document.createElement('h1');
  titleHeading.setAttribute('class', 'note-title');
  titleHeading.setAttribute('field', 'title')
  titleHeading.setAttribute('noteId', note.id);
  titleHeading.textContent = note.title.length > 0 ? note.title : 'untitled';
  titleHeading.addEventListener('click', makeInput);
  const trashBtn = document.createElement('button');
  const svg = makeTrashIconSvg();
  trashBtn.append(svg);
  trashBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    console.log('clicked trash button')
    console.log(`trying to delete ${note.id}`);
    delete notes[note.id]
    await deleteNote(notes);
    return app({ page: 'home'});
  })
  trashBtn.style.backgroundColor = 'transparent';
  trashBtn.border = 'none';
  titleHeading.append(trashBtn);
  return titleHeading;
}

function createNote(e) {
  counter = counter + 1;
  const newNote = new Note();
  saveNote(newNote);
  const noteId = newNote.id;
  Object.assign(noteIds, {
    [noteId]: newNote 
  });
  return app({ page: 'notePage', currentNote: newNote });
}

function makeInput(e) {
  console.log(`hitting makeInput`)
  const target = e.target;
  const note = currentNote;
  const elName = elReplacement[e.target.localName]

  const inputEl = document.createElement(elName);
  const field = target.getAttribute('field');
  const value = note[field];
  inputEl.innerHTML = value;
  if (elName === 'input') {
    inputEl.setAttribute('value', value);
  }
  inputEl.addEventListener('keydown', (e2) => {
    if (e2.key === 'Enter') {
      
      const oldChild = e2.target;
      note[field] = e2.target.value;
      updateLastUpdated(updateLastUpdated);
      saveNote(note);
      let returnEl;
      if (e.target.localName === 'h1') {
        returnEl = createNoteTitle(note);
      } else if (e.target.localName === 'p') {
        returnEl = createNoteBody(note);
      }
      return replaceElement(returnEl, oldChild);
    }
  })
  return replaceElement(inputEl, target);
}

function replaceElement(newChild, oldChild) {
  const parent = oldChild.parentNode;
  return parent.replaceChild(newChild, oldChild);
}

function createNoteBody(note) {
  const noteBody = document.createElement('p');
  noteBody.setAttribute('class', 'note-body');
  noteBody.setAttribute('field', 'body');
  noteBody.setAttribute('noteId', note.id);
  noteBody.innerHTML = note.body.length > 0 ? note.body : '<i> No text yet</i>';
  noteBody.addEventListener('click', makeInput);
  noteBody.childNodes.forEach((child, idx) => {
    if (child.nodeType === 1) {
      child.addEventListener('click', (e) => {
        e.stopPropagation();
        e.target.parentNode.click();
      })
    }
  });
  return noteBody;
}

function createBtn(options){
  const { innerText, listener, attributes} = options;
  const btn = document.createElement('button');
  btn.innerText = innerText;
  btn.addEventListener('click', listener);
  btn.setAttribute('class', `btn${attributes ? ' ' + attributes : ''}`);
  return btn;
}

function createNoteIndex(notes) {
  const notesIds = Object.keys(notes);
  const sortedIds = sortLastUpdated(notes);
  const ul = document.createElement('ul');
  ul.style.listStyleType = 'none';
  ul.style.padding = '0';
  ul.setAttribute('class', 'note-list');
  console.log(`got the sortedIds`)
  console.log(sortedIds)
  for (let nI = 0; nI < notesIds.length; nI++) {
    
    const li = document.createElement('li');
    li.setAttribute('class', 'note-item');
    const id = sortedIds[nI];
    console.log(`creatings li for ${id}`)
    const n = notes[id];
    const nText = getTitle(n);
    const a = document.createElement('a');
    a.innerHTML = nText;
    a.setAttribute('href', id);
    a.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      app({ page: 'notePage', currentNote: n});
    })
    const span = document.createElement('span');
    span.innerHTML = getDateString(n).slice(0, 24);
    li.append(a, span);
    ul.append(li);
  }
  return ul;
}

function sortLastUpdated(notes) {
  const arr = Object.keys(notes)
  const u = []; // updated array
  for (let x = 0; x < arr.length; x++) {
    const addendId = arr[x];
    let addendIdx = 0;
    const addend = notes[addendId];
    for (let y = 0; y < u.length; y++) {
      const compId = u[y];
      const comp = notes[compId];
      if (getDateString(addend) < getDateString(comp)) {
        addendIdx = y + 1;
      }
    }
    u.splice(addendIdx, 0, addendId);
  }
  return u;
}

function makeTrashIconSvg() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("viewBox", "0 0 16 16");

  const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path1.setAttribute("d", "M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z");
  
  const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path2.setAttribute("d", "M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z");
  
  
  svg.appendChild(path1);
  svg.appendChild(path2);

  return svg;
}


/* note methods */

function getDateString(item) {
  return new Date(item.lastUpdated).toString();
}

function getTitle(item) {
  return item.title.length > 0 ? item.title : 'untitled';
}

function updateLastUpdated(item) {
  item.lastUpdated = Date.now();
}

return current[page]();
}