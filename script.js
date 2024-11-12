const ANKI_CONNECT_URL = "http://localhost:8765";
 const xlsx = require('xlsx');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));  // This line is unnecessary
// // AnkiConnect endpoint

// Deck and model names

// Sample vocabulary data (you can replace this with the actual data)

async function addNoteToAnki(noteFields) {
    // Use relative paths to reference the media files in Anki's collection.media folder
    const imagePath = `${noteFields[0]}.png`;  // Reference the image file (just the filename)
    const voiceVocabularyPath = `${noteFields[8]}.mp3`;  // Audio for Vocabulary
    const voiceSentencesPath = `${noteFields[9]}.mp3`;  // Audio for Sentences
    const voiceEnglishPath = `${noteFields[10]}.mp3`;  // Audio for English
    const voiceEnglishSentencePath = `${noteFields[11]}.mp3`;  // Audio for English sentence
    // Create a note object with the required fields
    const note = {
        deckName: DECK_NAME,
        modelName: MODEL_NAME,
        fields: {
            IMG: `<img src="${imagePath}">`,  // Embed the image in the card
            TEXT: noteFields[1] || "N/A",
            Vocabulary: noteFields[2] || "N/A",
            Pinyin: noteFields[3] || "N/A",
            English: noteFields[4] || "N/A",
            Example_Sentences_Chinese: noteFields[5] || "N/A",
            Pinyin_Sentence: noteFields[6] || "N/A",
            Translation: noteFields[7] || "N/A",
            Voice: `[sound:${voiceVocabularyPath}]`,
            Voice_Sentences: `[sound:${voiceSentencesPath}]`,  // Embed voice for sentence
            Voice_English: `[sound:${voiceEnglishPath}]`,  // Embed voice for English word
            Voice_English_Sentence: `[sound:${voiceEnglishSentencePath}]`,  // Embed voice for English sentence
        },
        options: {
            allowDuplicate: true  // Prevent duplicates
        },
        tags: ["Chinese"]  // Tags for categorization
    };
    // Define the payload for the API request
    const payload = {
        action: "addNote",
        version: 6,
        params: { note }
    };
    try {
        // Send the request to AnkiConnect
        const response = await fetch(ANKI_CONNECT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.error) {
            console.error("Error adding note:", result.error);
        } else {
            console.log(`Note added with ID: ${result.result}`);
        }
    } catch (error) {
        console.error("Error communicating with AnkiConnect:", error);
    }
}

// // Function to loop through all vocabularies and add them to Anki
// function addVocabularyToAnki() {
//     vocabularies.forEach(vocab => {
//         addNoteToAnki(vocab);
//     });
// }

// // Call the function to add all vocabularies
//  addVocabularyToAnki();

async function addVocabulariesFromExcel(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const vocabularies = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log(vocabularies);
    let count = 0;
    for (const vocab of vocabularies.slice(1)) { // skip header row
        await addNoteToAnki(vocab);
        count++;
    }
    console.log(`Total vocabularies added to Anki: ${count}`);  // Log the total count
}

document.getElementById('addNoteButton').addEventListener('click', async () => {
    const deskName = document.getElementById('deskName').value;
    const fileInput = document.getElementById('filePath');
    const filePath = fileInput.files[0];

    if (!deskName || !filePath) {
        alert("Please enter both Desk Name and select a file.");
        return;
    }
    console.log(filePath.name);

    DECK_NAME = deskName; // Set the desk name dynamically

    // Call the function to add vocabularies from Excel
    await addVocabulariesFromExcel(filePath.name);
});


// Replace 'your_file.xlsx' with the actual path to your Excel file
//  addVocabulariesFromExcel('600 vocabulary common.xlsx');

const DELETE_TAG = "Chinese"; // Tag used to identify vocabulary notes to delete
async function deleteAllVocabularyNotes() {
    // Step 1: Find notes with the specified tag
    const findPayload = {
        action: "findNotes",
        version: 6,
        params: {
            query: `tag:${DELETE_TAG}`
        }
    };

    try {
        const findResponse = await fetch(ANKI_CONNECT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(findPayload)
        });

        const findResult = await findResponse.json();

        if (findResult.error) {
            console.error("Error finding notes:", findResult.error);
            return;
        }
        const noteIds = findResult.result;

        if (noteIds.length === 0) {
            console.log("No vocabulary notes found with the specified tag.");
            return;
        }
        // Step 2: Delete notes with the found note IDs
        const deletePayload = {
            action: "deleteNotes",
            version: 6,
            params: {
                notes: noteIds
            }
        };
        const deleteResponse = await fetch(ANKI_CONNECT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deletePayload)
        });

        const deleteResult = await deleteResponse.json();

        if (deleteResult.error) {
            console.error("Error deleting notes:", deleteResult.error);
        } else {
            console.log(`Successfully deleted ${noteIds.length} vocabulary notes.`);
            alert(`Successfully deleted ${noteIds.length} vocabulary notes.`);
        }
    } catch (error) {
        console.error("Error communicating with AnkiConnect:", error);
    }
}

// Call the function to delete all vocabulary notes with the specified tag
//    deleteAllVocabularyNotes();


async function deleteAllCardsInDeck(DECK_NAME) {
    try {
        // Fetch all notes in the deck
        const notes = await fetch('http://localhost:8765', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'findNotes',
                version: 6,
                params: {
                    query: `deck:"${DECK_NAME}"` // Search for notes in the specified deck
                }
            })
        }).then(response => response.json());

        if (notes.error) {
            console.error('Error fetching notes:', notes.error);
            return;
        }

        // Get the list of note IDs from the response
        const noteIds = notes.result;

        if (noteIds.length === 0) {
            console.log('No cards found in the deck.');
            return;
        }

        // Delete the notes (cards)
        const deleteResponse = await fetch('http://localhost:8765', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'deleteNotes',
                version: 6,
                params: {
                    notes: noteIds  // Pass the list of note IDs to delete
                }
            })
        }).then(response => response.json());

        if (deleteResponse.error) {
            console.error('Error deleting notes:', deleteResponse.error);
        } else {
            console.log(`Successfully deleted ${deleteResponse.result} cards from the deck "${DECK_NAME}".`);
        }
    } catch (error) {
        console.error('Error communicating with AnkiConnect:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const deleteButton = document.querySelector('#delete-button'); // Select the delete button by ID
    
    deleteButton.addEventListener('click', async () => {
        // Show the prompt asking for the deck name
        const DECK_NAME = prompt("Please enter the deck name to delete all cards from:");
        
        // Check if the user entered a deck name
        if (DECK_NAME) {
            // Ask for confirmation
            if (confirm(`Are you sure you want to delete all cards from the deck "${DECK_NAME}"?`)) {
                await deleteAllCardsInDeck(DECK_NAME); // Call the function to delete cards
            } else {
                console.log('Deletion cancelled.');
            }
        } else {
            console.log('No deck name provided.');
        }
    });
});

// Call the function to delete all cards in the specified deck
// deleteAllCardsInDeck();

