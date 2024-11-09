// AnkiConnect endpoint
const ANKI_CONNECT_URL = "http://localhost:8765";

// Deck and model names
const DECK_NAME = "CHINA_APEX_LANGUAGE";
const MODEL_NAME = "Basic"; // Ensure this model has 7 fields

// Sample vocabulary data (you can replace this with the actual data)
const vocabularies = [
    ["1", "保存", "bǎocún", "save", "请记得保存文件。","Qǐng jìdé bǎocún wénjiàn.", "Please remember to save the file.","Vocabulary1" ,"Sentence1" ],
     ["2", "不保存", "bù bǎocún", "don’t save", "如果你不保存更改，它们将丢失。", "Rúguǒ nǐ bù bǎocún gēnggǎi, tāmen jiāng diūshī.", "If you don't save the changes, they will be lost.","Vocabulary1" ,"Sentence1"]
];

async function addNoteToAnki(noteFields) {
    // Use relative paths to reference the media files in Anki's collection.media folder
    const imagePath = `${noteFields[0]}.png`;  // Reference the image file (just the filename)
    const voiceVocabularyPath = `${noteFields[7]}.wav`;  // Audio for Vocabulary
    const voiceSentencesPath = `${noteFields[8]}.wav`;  // Audio for Sentences
    // Create a note object with the required fields
    const note = {
        deckName: DECK_NAME,
        modelName: MODEL_NAME,
        fields: {
            IMG: `<img src="${imagePath}">`,  // Embed the image in the card
            Vocabulary: noteFields[1] || "N/A",
            Pinyin: noteFields[2] || "N/A",
            English: noteFields[3] || "N/A",
            Example_Sentences_Chinese: noteFields[4] || "N/A",
            Pinyin_Sentence: noteFields[5] || "N/A",
            Translation: noteFields[6] || "N/A",
            Voice: `[sound:${voiceVocabularyPath}]`,
            Voice_Sentences: `[sound:${voiceSentencesPath}]`,  // Embed voice for sentence

        },
        options: {
            allowDuplicate: false  // Prevent duplicates
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

// Function to loop through all vocabularies and add them to Anki
function addVocabularyToAnki() {
    vocabularies.forEach(vocab => {
        addNoteToAnki(vocab);
    });
}

// Call the function to add all vocabularies
addVocabularyToAnki();

