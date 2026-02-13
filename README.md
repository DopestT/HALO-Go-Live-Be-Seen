# HALO — Go Live, Be Seen

A premium live streaming platform where authenticity meets artistry. HALO combines beautiful design, robust safety features, and genuine human connection.

---

## Repository Structure

```
HALO/
├── frontend/     # React Native app (Expo)
├── backend/      # Go API Gateway
└── docs/         # App Store materials & documentation
```

### Frontend
React Native application built with Expo. Features dark-first glassmorphism design, live streaming, and comprehensive safety features.

**Key Technologies:**
- React Native 0.73
- Expo 50
- LiveKit for real-time streaming
- TypeScript

[Read more →](frontend/README.md)

### Backend  
High-performance Go API Gateway built with Gin framework. Optimized for 50k+ concurrent requests with PostgreSQL and Redis.

**Key Technologies:**
- Go 1.24+
- Gin Web Framework
- PostgreSQL (user profiles, video metadata)
- Redis (real-time engagement counters)

[Read more →](backend/README.md)

### Docs
App Store submission materials including descriptions, privacy policy, screenshot guidelines, and asset management.

[Read more →](docs/README.md)

---

## Design Philosophy

- **Dark-First Aesthetic**: Void Black (#020617) with glassmorphism
- **Presence over Performance**: Focus on authentic connection
- **Calm over Chaos**: No urgency-based language or gaming HUDs
- **Safety First**: One-tap reporting and blocking
- **Adult Mode**: Age-verified 18+ content with strict gating

---

## Quick Start

### Frontend Development
```bash
cd frontend
npm install
npx expo start
```

### Backend Development
```bash
cd backend
make run
# or with Docker
docker-compose up
```

---

## Key Features

### For Users
- **Live Streaming**: High-quality broadcasts with low latency
- **Discovery Feed**: Browse streams in a calm, low-density layout
- **Safety Tools**: One-tap reporting and blocking
- **Adult Mode**: Age-verified access to 18+ content
- **Beautiful Design**: Dark glassmorphism with rounded geometry

### For Developers
- **Modular Architecture**: Clean separation of concerns
- **High Performance**: Optimized for 50k+ concurrent requests
- **Type Safety**: TypeScript frontend, strongly-typed Go backend
- **Real-time Features**: LiveKit integration for streaming
- **Comprehensive Testing**: Jest (frontend), Go testing (backend)

---

## Environment Setup

### Frontend (.env)
```
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```

### Backend (.env)
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
```

See individual README files in `frontend/` and `backend/` for detailed setup instructions.

---

## Contributing

We welcome contributions! Please read our contributing guidelines and code of conduct.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes following our design principles
4. Write/update tests
5. Submit a pull request

---

## License

[License details to be added]

---

## Contact

- **Support**: support@haloapp.live
- **Privacy**: privacy@haloapp.live
- **Security**: security@haloapp.live

---

**HALO — Where authenticity meets artistry**
