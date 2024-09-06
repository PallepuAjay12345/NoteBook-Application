// DOM element variables
const createButton = document.querySelector(".btn");
const create = document.querySelector(".create");
const er = document.querySelector(".er");
const notesContainer = document.getElementById('notes-container');
const content = document.querySelector(".content");
const content1 = document.querySelector(".content1");
const footer = document.querySelector(".footer");
const text = document.getElementById("text");
const send = document.getElementById("send");
const leftScroll = document.getElementById("leftScroll")
const scrollContent = document.getElementById("scrollContent")

// Array to store notes fetched from the backend
const notes = [];


// Fetch notes from backend on page load
axios.get('http://localhost:3000/notes')
    .then(response => {
        const fetchedNotes = response.data;

        fetchedNotes.forEach(note => {
            notes.push(note);
        });
        renderNotes() // Display fetched notes
    })
    .catch(error => {
        console.error('Error fetching notes:', error);
    });

// Event listener for creating a new note
createButton.addEventListener("click", () => {
    if (createButton.disabled) {
        return;
    }

    // Disable create button during note creation
    createButton.disabled = true;
    createButton.style.cursor = "none";
    leftScroll.style.maxHeight = "calc(100% - 195px)";

    // Create form for note creation
    let form = document.createElement("form");
    form.action = '/notes';
    form.method = "post";
    form.id = "form-create";

    // Input field for note name
    let input = document.createElement("input");
    input.id = "note-name";
    input.setAttribute("placeholder", "Enter a note name");
    input.name = "noteName";

    // Create buttons for create and cancel
    let btn = document.createElement("button");
    btn.id = "create-btn";
    btn.textContent = "Create";
    let cancelBtn = document.createElement("button");
    cancelBtn.id = "create-btn";
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.backgroundColor = "red";
    cancelBtn.style.cursor = "pointer";
    cancelBtn.style.color = "white";

    // Append elements to form and create div
    create.appendChild(form);
    form.appendChild(input);
    form.appendChild(btn);
    form.appendChild(cancelBtn);

    // Disable create button if input is empty
    btn.disabled = true;
    btn.classList.add("disabled");

    // Event listener for input field to enable/disable create button
    input.addEventListener("input", () => {
        let inputValue = input.value.trim();
        if (inputValue.length > 0) {
            btn.disabled = false;
            btn.classList.remove("disabled");
            btn.style.backgroundColor = "#4756ca";
            btn.style.cursor = "pointer";
            btn.style.color = "white";
        } else {
            btn.disabled = true;
            btn.classList.add("disabled");
            btn.style.cursor = "none";
            btn.style.backgroundColor = "gainsboro";
            btn.style.color = "black";
        }
    });

    // Event listener for cancel button to reset create form
    cancelBtn.addEventListener("click", () => {
        create.removeChild(form);
        leftScroll.style.maxHeight = "calc(100% - 150px)";
        createButton.disabled = false;
        createButton.style.cursor = "pointer";
    });

});

// Function to render notes in the UI
function renderNotes() {
    let notesHTML = "";
    for (let i = 0; i < notes.length; i++) {
        let noteTitle = notes[i].note_title;
        let date = notes[i].created_at.substring(0, 10) + "   " + notes[i].created_at.substring(11, 16);

        // Truncate long note titles
        if (noteTitle.length > 10) {
            noteTitle = noteTitle.substring(0, 10) + "....";
        }

        // HTML structure for displaying each note
        notesHTML += `<div class="note" style="cursor:pointer" onclick="openHistory(${i})">
                        ${noteTitle}
                        <pre class="date">${date}</pre>
                        <span style="cursor:pointer;" onclick="deleteNote(${i})"><i class="fa fa-trash"></i></span>
                      </div>`;
    }
    notesContainer.innerHTML = notesHTML;
    checkSearchVisibility(); // Check and display search visibility
}


// Event listener for search input on notes
document.getElementById('search').addEventListener('input', function () {
    let searchValue = this.value.trim().toLowerCase();
    if (searchValue === '') {
        renderNotes(); // Display all notes if search is empty
    } else {
        filterNotes(searchValue); // Filter notes by search term
    }
});

// Function to filter notes by search term
function filterNotes(searchTerm) {
    let filteredNotes = notes.filter(note => note.note_title.toLowerCase().includes(searchTerm));
    let notesHTML = "";
    for (let i = 0; i < filteredNotes.length; i++) {
        let date = filteredNotes[i].created_at.substring(0, 10) + "   " + filteredNotes[i].created_at.substring(12, 16);
        notesHTML += `<div class="note">
                        <span style="cursor:pointer;" onclick="openHistory(${i})">${filteredNotes[i].note_title}</span>
                        <pre class="date">${date}</pre>
                        <span style="cursor:pointer;" onclick="deleteNote(${i})"><i class="fa fa-trash"></i></span>
                      </div>`;
    }
    notesContainer.innerHTML = notesHTML;
    checkSearchVisibility(); // Check and display search visibility
}

// Function to delete a note by index
function deleteNote(index) {
    const noteId = notes[index].note_id;
    if (confirm(`Are you sure you want to delete "${notes[index].note_title}"?`)) {
        notes.splice(index, 1); // Remove note from array
        renderNotes(); // Update UI after deletion
        clearContent(); // Clear content display
        axios.delete(`http://localhost:3000/notes/${noteId}`)
            .then(response => {
                console.log('Note deleted successfully from backend:', response.data);
            })
            .catch(error => {
                console.error('Error deleting note from backend:', error);
            });
    }
}

// Function to clear content display
function clearContent() {
    content.innerHTML = "";
    content1.innerHTML = "";
    footer.style.visibility = "hidden";
    activeNoteIndex = -1;
    content.style.visibility = "hidden";
    checkSearchVisibility(); // Check and display search visibility
}

let activeNoteIndex = -1;

// display comments chat messages
const displayComments = async () => {
    let messages = '';
    console.log("displayComments", activeNoteIndex)

    if (activeNoteIndex == -1) return
    content1.innerHTML = '<div class="spinner"></div>';
    const notesDivs = document.querySelectorAll('.note');

    notesDivs.forEach((noteDiv, i) => {
        if (i === activeNoteIndex) {
            noteDiv.classList.add('active-note');
        } else {
            noteDiv.classList.remove('active-note');
        }
    });

    axios.get(`http://localhost:3000/messages/note_id/${notes[activeNoteIndex].note_id}`)
        .then(response => {

            const fetchedMessages = response.data;
            let finalData = "";
            messages = fetchedMessages
            fetchedMessages.forEach(message => {
                let comment = message.message_content;
                let commentDate = message.sent_at;
                let formattedDate = `${commentDate.substring(0, 10)}  ${commentDate.substring(11, 16)}`;

                let commentContent = `
                <div class="comment-container" style="display: flex; align-items: flex-start; margin-bottom: 10px;">
                    <div class="comment" style="max-width: 500px; min-width:200px;border: 1px solid #ccc; background-color: #f9f9f9; padding: 10px; margin-bottom: 10px; display: flex;">
                      <div class="comment-content" style="display: flex; flex-direction: column;">
                        <div class="comment-text" style="word-wrap: break-word;">${comment}</div><br>
                         <div class="comment-date" style="margin-top: 5px;display:flex;justify-content:space-between;min-width:200px">${formattedDate} <div class="delete-icon" style="margin-right:10px;cursor: pointer;"onclick="deleteMessage(${message.message_id})">
                          <i class="fa fa-trash"></i>
                        </div></div>
                    </div>
                </div>
            </div>
            `;

                finalData += commentContent;
            });

            content1.innerHTML = finalData;
            scrollContent.scrollTop = content1.scrollHeight;
            hideLoadingSpinner();


        })
        .catch(error => {
            console.error('Error fetching messages:', error);
            content1.innerHTML = '<div class="error-message">Failed to fetch messages.</div>'; // Handle error case
            hideLoadingSpinner();
        });
    document.getElementById('search1').addEventListener('input', function () {
        let searchValue = this.value.trim().toLowerCase();
        filterMessages(searchValue);
    });
    function filterMessages(searchTerm) {
        let filteredMessages = messages.filter(msg => msg.message_content.toLowerCase().includes(searchTerm));
        console.log(filteredMessages)
        let messageHTML = "";
        for (let i = 0; i < filteredMessages.length; i++) {
            messageHTML += `
            <div class="comment-container" style="display: flex; align-items: flex-start; margin-bottom: 10px;">
                       <div class="comment" style="max-width: 500px; min-width:200px;border: 1px solid #ccc; background-color: #f9f9f9; padding: 10px; margin-bottom: 10px; display: flex;">
                             <div class="comment-content" style="display: flex; flex-direction: column;">
                                <div class="comment-text" style="word-wrap: break-word;">${filteredMessages[i].message_content}</div><br>
                                   <div class="comment-date" style="margin-top: 5px;display:flex;justify-content:space-between;min-width:200px">${filteredMessages[i].sent_at.substring(0, 10) + "  " + filteredMessages[i].sent_at.substring(11, 16)} 
                                   <div class="delete-icon" style="margin-right:10px;cursor: pointer;" onclick="deleteMessage(${filteredMessages[i].message_id})">
                                    <i class="fa fa-trash"></i>
                                </div></div>
                            </div>
                        </div> 
               </div>`;

        }
        content1.innerHTML = messageHTML
        scrollContent.scrollTop = content1.scrollHeight;
    }
}

function openHistory(index) {
    let input = document.createElement("input");
    input.id = "search1";
    input.style.height = "4vh";
    input.style.width = "20vw"
    input.setAttribute("placeholder", "Search...");
    input.style.backgroundImage = "url('/assets/searchicon.png')";
    input.style.textAlign = "left";
    input.style.paddingLeft = "23px";
    input.style.backgroundRepeat = "no-repeat"
    input.style.backgroundPosition = " 1px 4px"
    input.style.backgroundSize = "20px 20px"
    input.style.border = "1px solid #ccc"
    input.style.borderRadius = "5px"
    // background-position: 10px 10px; 
    // background-size: 20px 20px;;


    content.innerHTML = notes[index].note_title;
    content.style.backgroundColor = "#f0f0f0";
    content.style.height = "7vh";
    content.style.width = "70vw";
    content.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
    content.style.border = "1px solid #ccc";
    content.style.fontSize = "25px";
    content.style.padding = "15px";
    content.style.display = "flex";
    content.style.fontWeight = "bold";
    content.style.justifyContent = "space-between";
    content.appendChild(input);

    footer.style.visibility = "visible";
    content.style.visibility = "visible";

    activeNoteIndex = index;
    displayComments();
}


// Define an async function for handling the POST request
const sendMessage = async () => {
    try {
        const messageContent = text.value.trim();
        if (messageContent === '') {
            return; // Exit function if message content is empty
        }

        const response = await axios.post(`http://localhost:3000/messages/note_id/${notes[activeNoteIndex].note_id}`, {
            message_content: messageContent
        });

        console.log("messageContent", messageContent);
        console.log('New message:', response.data);
        text.value = '';

    } catch (error) {
        console.error('Error adding message:', error);
    }
};

// Event listener attached to the send button
send.addEventListener("click", async (e) => {
    e.preventDefault();
    await sendMessage(); // Call the async function to handle sending the message
    await displayComments();
});



// Function to delete a message/comment
function deleteMessage(messageId) {
    if (confirm(`Are you sure you want to delete this message?`)) {
        axios.delete(`http://localhost:3000/message/${messageId}`)
            .then(response => {
                console.log('Message deleted successfully from backend:', response.data);
                displayComments(); // Refresh comments/messages display after deletion
            })
            .catch(error => {
                console.error('Error deleting message from backend:', error);
            });
    }
}

// Function to hide loading spinner
function hideLoadingSpinner() {
    const spinnerElement = document.querySelector('.spinner');
    if (spinnerElement) {
        spinnerElement.style.display = 'none';
    }
}

// Function to check and display search visibility
function checkSearchVisibility() {
    if (notes.length > 0) {
        document.getElementById('search').style.visibility = "visible";
    } else {
        document.getElementById('search').style.visibility = "hidden";
    }
}

// Function to handle user logout
function handleLogout() {
    localStorage.setItem('accessToken', ''); // Clear access token from local storage
    localStorage.setItem('user_name', ''); // Clear user name from local storage
    window.location.href = '/'; // Redirect to login page
}

// Check if access token is present, redirect to login if not
const accessToken = localStorage.getItem('accessToken');
if (!accessToken) {
    window.location.href = '/';
}

