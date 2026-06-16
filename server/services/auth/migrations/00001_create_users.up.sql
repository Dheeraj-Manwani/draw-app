-- +goose Up

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE element_type AS ENUM (
    'RECTANGLE',
    'ELLIPSE',
    'DIAMOND',
    'FREE',
    'LINE',
    'ARROW',
    'TEXT',
    'EMBEDDED',
    'PICTURE'
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    admin_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_rooms_admin
        FOREIGN KEY (admin_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_rooms_admin_id
    ON rooms(admin_id);

CREATE TABLE room_users (
    room_id UUID NOT NULL,
    user_id UUID NOT NULL,

    PRIMARY KEY (room_id, user_id),

    CONSTRAINT fk_room_users_room
        FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_room_users_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_room_users_user_id
    ON room_users(user_id);

CREATE TABLE elements (
    id UUID PRIMARY KEY,
    room_id UUID NOT NULL,
    user_id UUID NOT NULL,
    type element_type NOT NULL,
    data JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_elements_room
        FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_elements_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_elements_room_id
    ON elements(room_id);

CREATE INDEX idx_elements_user_id
    ON elements(user_id);



-- +goose Down

DROP TABLE IF EXISTS elements;
DROP TABLE IF EXISTS room_users;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS element_type;