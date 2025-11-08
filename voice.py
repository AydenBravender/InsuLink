

## List of questions to ask:
questions = ["How are you?", "How often do you work out?", "How long do you work out for?", "How much sleep did you get"]

num_of_questions = 2

# for i in range(num_of_questions):


# import pyttsx3

# # Initialize the TTS engine
# engine = pyttsx3.init()

# # Set properties (optional)
# engine.setProperty('rate', 150)    # Speed of speech (words per minute)
# engine.setProperty('volume', 0.9)  # Volume (0.0 to 1.0)

# # The text you want to speak
# text = "Hello, I am speaking completely offline using the pyttsx3 library!"

# # Queues the speech and blocks while all queued commands are processed
# engine.say(text)
# engine.runAndWait() 

# # You can also stop the engine when done, though runAndWait() will usually handle it
# engine.stop()


from gtts import gTTS
from playsound import playsound
import os

text = "This voice is much more natural and clear, powered by Google's service."

# Create the TTS object
tts = gTTS(text=text, lang='en')

# Save the audio file (gTTS creates a file, it doesn't stream audio directly)
filename = "temp_speech.mp3"
tts.save(filename)

# Play the audio
playsound(filename)

# Clean up the file
os.remove(filename)