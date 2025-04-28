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

# Create an app directory and copy the binary in
WORKDIR /app
COPY --from=builder /app/server .

# Install dumb-init for proper signal handling
USER root
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init \
 && rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["dumb-init", "--"]

# Expose the port your Gin app listens on
EXPOSE 4500

# Launch your server
CMD ["./server"]
