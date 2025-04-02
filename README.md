# Team Todo App

A collaborative to-do list application built with Vite.

## Features

- Create and manage tasks with descriptions
- Organize tasks into categories
- Archive and mark tasks as completed
- AI-powered task generation using OpenAI

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the project root
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_api_key_here
     ```
4. Start the development server:
   ```
   npm run dev
   ```

## Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the project root with the following variables:

- `OPENAI_API_KEY`: Your OpenAI API key (required for AI-generated tasks)

## Development

The application is built with:

- Vite for bundling and development
- Plain JavaScript for the main application logic
- OpenAI API for AI task generation

## Project Structure

- `app.js`: Main application logic
- `index.html`, `archived.html`, `completed.html`: Main HTML files
- `css/styles.css`: CSS styles
- `src/config/openai.js`: OpenAI API utility functions
- `src/config/env.js`: Environment variable configuration

## Security Notes

- The `.env` file is excluded from version control in `.gitignore`
- In production, environment variables should be set in the hosting environment rather than in a file
