/* chrome storage */

/* constants */
const appTitle = 'Notepad';
let counter = 0;
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
      const exists = noteIds.hasOwnProperty(newId);
      return exists ? genId() : newId;
    }
    const newId =  genId();
    noteIds[newId] = this;
    return newId;
  }

  getDateString() {
    return new Date(this.lastUpdated).toString();
  }

  getTitle() {
    return this.title.length > 0 ? this.title : 'untitled';
  }

  updateLastUpdated() {
    this.lastUpdated = Date.now();
  }
}

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
const current = {
  'home': function () {
    main.innerHTML = '';
    const addBtn = createBtn({
      innerText: 'Create a note', listener: createNote
    });
    main.append(addBtn);
    const notes = Object.keys(noteIds);
    if (notes.length > 0) {
      const ul = createNoteIndex();
      main.append(ul);
    }
  },
  'notePage': function (note) {
    currentNoteId = note.id;
    main.innerHTML = '';

    const homeBtn = createBtn({
      innerText:'Go home',
      listener: () => {
        currentNoteId = '';
        current.home();
      }
    });
    const titleHeading = createNoteTitle();
    const noteBody = createNoteBody();

    main.append(homeBtn, titleHeading, noteBody)
  }
}

current.home();

function createNoteTitle() {
  const titleHeading = document.createElement('h1');
  titleHeading.setAttribute('class', 'note-title');
  titleHeading.textContent = noteIds[currentNoteId].title.length > 0 ? noteIds[currentNoteId].title : 'untitled';
  titleHeading.addEventListener('click', makeInput);
  return titleHeading;
}

function createNote(e) {
  counter = counter + 1;
  const newNote = new Note();
  const noteId = newNote.id;
  Object.assign(noteIds, {
    [noteId]: newNote 
  });
  current.notePage(newNote);
}

function makeInput(e) {
  const target = e.target;
  const className = target.getAttribute('class');
  const value = target.innerHTML;
  let newElement;
  if (className === 'note-title') {
    newElement = makeTextInput({ value });
  } else if (className === 'note-body') {
    newElement = makeTextArea()
  }
  replaceElement(newElement, target);
}

function makeTextArea() {

  const currentNote = noteIds[currentNoteId];
  const textarea = document.createElement('textarea');
  const value = currentNote.body;
  textarea.innerText = value;
  textarea.addEventListener('keydown', exitTextArea);
  return textarea;
}

function exitTextArea(e) {
  if (e.key === 'Enter') {
    const oldChild = e.target;
    const currentNote = noteIds[currentNoteId];
    currentNote.body = oldChild.value;
    const noteBody = createNoteBody();
    currentNote.updateLastUpdated();
    replaceElement(noteBody, oldChild);
  }
}

function makeTextInput(options) {
  const { value } = options;
  const textInput = document.createElement('input');
  textInput.setAttribute('class', 'text-input');
  textInput.setAttribute('autofocus', '');
  if (value && value !== 'untitled') {
    textInput.setAttribute('value', value);
  }
  textInput.addEventListener('keydown', exitTextInput)
  return textInput;
}

function exitTextInput(e) {
  if (e.key === 'Enter') {
    const oldChild = e.target;
    const currentNote = noteIds[currentNoteId];
    currentNote.title = oldChild.value;
    currentNote.updateLastUpdated();
    const titleHeading = createNoteTitle();
    replaceElement(titleHeading, oldChild);
  }
}

function replaceElement(newChild, oldChild) {
  const parent = oldChild.parentNode;
  parent.replaceChild(newChild, oldChild);
}

function createNoteBody() {
  const note = noteIds[currentNoteId];
  const noteBody = document.createElement('p');
  noteBody.setAttribute('class', 'note-body');
  noteBody.textContent = note.body;
  noteBody.addEventListener('click', makeInput);
  noteBody.style.minHeight = '1em';
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

function createNoteIndex() {
  const notes = sortLastUpdated(Object.keys(noteIds));
  const ul = document.createElement('ul');
  ul.style.listStyleType = 'none';
  ul.style.padding = '0';
  ul.setAttribute('class', 'note-list');
  for (let nI = 0; nI < notes.length; nI++) {
    const li = document.createElement('li');
    li.setAttribute('class', 'note-item');
    const id = notes[nI];
    const n = noteIds[id];
    const nText = n.getTitle();
    const a = document.createElement('a');
    a.innerHTML = nText;
    a.setAttribute('href', id);
    a.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      current.notePage(n);
    })
    const span = document.createElement('span');
    span.innerHTML = n.getDateString().slice(0, 24);
    li.append(a, span);
    ul.append(li);
  }
  return ul;
}

function sortLastUpdated(arr) {
  const u = []; // updated array
  for (let x = 0; x < arr.length; x++) {
    const addendId = arr[x];
    let addendIdx = 0;
    const addend = noteIds[addendId];
    for (let y = 0; y < u.length; y++) {
      const compId = u[y];
      const comp = noteIds[compId];
      if (addend.getDateString() < comp.getDateString()) {
        addendIdx = y + 1;
      }
    }
    u.splice(addendIdx, 0, addendId);
  }
  return u;
}

function dateIsGreater(a, b) {
  const [aN, bN] = [noteIds[a], noteIds[b]];
  return aN.lastUpdated > bN.lastUpdated;
}

function createNotePreview() {

}