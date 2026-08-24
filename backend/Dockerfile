FROM golang:1.23-alpine AS builder

WORKDIR /app

RUN apk add --no-cache ca-certificates

COPY go.mod ./
RUN go mod download || true

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server .

FROM alpine:3.20

WORKDIR /app

RUN adduser -D -u 10001 appuser
USER appuser

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/server .

EXPOSE 8080

ENV PORT=8080

CMD ["./server"]
