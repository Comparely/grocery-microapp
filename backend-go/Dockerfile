#── Build stage ──────────────────────────────────────────────────────────
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install git if you need cgo-free modules; otherwise disable cgo.
RUN apk add --no-cache git

# Fetch modules
COPY go.mod go.sum ./
RUN go mod download

# Build a static, cgo-free binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server .

#── Runtime stage ────────────────────────────────────────────────────────
FROM chromedp/headless-shell:latest

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init \
 && rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["dumb-init", "--"]

# Expose the port your Gin app listens on

COPY --from=builder /app/server .

EXPOSE 4500

# Launch your server
CMD ["./server"]
