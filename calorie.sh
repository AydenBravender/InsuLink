#!/bin/bash

# Activate virtual environment (optional)
# source ~/InsuLink/insulink/bin/activate

# Run the first Python script
echo "Running first script..."
python3 camera.py

# Check if it ran successfully
if [ $? -ne 0 ]; then
    echo "Error: first_script.py failed. Exiting."
    exit 1
fi

# Run the second Python script
echo "Running second script..."
python3 calorie.py
# Ch
