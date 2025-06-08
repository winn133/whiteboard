# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A lightweight collaborative whiteboard web application built with Ruby on Rails (API backend) and React (frontend). Features real-time drawing collaboration using WebSockets.

## Development Setup

### Backend (Rails API)
```bash
cd backend
rbenv exec bundle install
rbenv exec rails db:migrate
rbenv exec rails server -p 3001
```

### Frontend (React)
```bash
cd frontend
npm install
npm start
```

### Running Tests
```bash
# Backend tests
cd backend && rbenv exec rails test

# Frontend tests  
cd frontend && npm test
```

## Architecture

### Backend Structure
- **Rails API** running on port 3001
- **SQLite database** for storing stroke data
- **Action Cable** for WebSocket communication
- **CORS enabled** for frontend communication

Key files:
- `app/models/stroke.rb` - Drawing stroke data model
- `app/controllers/api/v1/strokes_controller.rb` - REST API for strokes
- `app/channels/whiteboard_channel.rb` - WebSocket channel for real-time collaboration

### Frontend Structure
- **React with TypeScript** running on port 3000
- **HTML5 Canvas** for drawing interface
- **ActionCable client** for WebSocket communication

Key files:
- `src/components/Whiteboard.tsx` - Main drawing canvas component
- `src/services/websocket.ts` - WebSocket service for real-time collaboration

### Real-time Collaboration
- Users draw on HTML5 canvas
- Stroke data sent via WebSocket to Rails backend
- Backend broadcasts stroke data to all connected clients
- Other users see drawings appear in real-time

## Common Commands

Start both servers:
```bash
# Terminal 1: Backend
cd backend && rbenv exec rails server -p 3001

# Terminal 2: Frontend  
cd frontend && npm start
```