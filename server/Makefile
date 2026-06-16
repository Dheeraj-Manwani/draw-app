DB_URL=postgres://excalidraw:secret@localhost:5432/excalidraw?sslmode=disable

migrate-up:
	goose -dir ./services/auth/migrations postgres "$(DB_URL)" up

migrate-down:
	goose -dir ./services/auth/migrations postgres "$(DB_URL)" down