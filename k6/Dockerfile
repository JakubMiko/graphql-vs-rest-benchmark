# Custom k6 with InfluxDB v2 support
FROM golang:1.23-alpine AS builder

# Install dependencies
RUN apk add --no-cache git

WORKDIR /build

# Install xk6 (allow toolchain auto-download)
ENV GOTOOLCHAIN=auto
RUN go install go.k6.io/xk6/cmd/xk6@latest

# Build k6 with xk6-output-influxdb extension
RUN xk6 build \
    --with github.com/grafana/xk6-output-influxdb@latest \
    --output /tmp/k6

# Final image
FROM alpine:3.18

RUN apk add --no-cache ca-certificates && \
    adduser -D -u 12345 -g 12345 k6

COPY --from=builder /tmp/k6 /usr/bin/k6

USER k6
WORKDIR /home/k6

ENTRYPOINT ["k6"]
