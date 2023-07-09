# This is the container to run the harmony blizzle-chazzizle.
# Run with the following command:
# docker run -it -p 9599:9599 -p 9598:9598 --name harmony_debug harmony_debug
# to open a second terminal to the container, run:
# docker exec -it harmony_debug bash

# Base image
FROM golang:1.19

# Install GMP and OpenSSL dependencies
RUN apt-get update && apt-get install -y \
    libgmp-dev \
    libssl-dev \
    make \
    gcc \
    g++ \
    jq

# Set the GOPATH environment variable
ENV GOPATH /go

# Clone and set up the repos
RUN mkdir -p $GOPATH/src/github.com/harmony-one
WORKDIR $GOPATH/src/github.com/harmony-one

# Clone the required repos
RUN git clone https://github.com/harmony-one/mcl.git
RUN git clone https://github.com/harmony-one/bls.git
RUN git clone https://github.com/harmony-one/harmony.git
WORKDIR $GOPATH/src/github.com/harmony-one/harmony

# RUN mkdir -p $GOPATH/src/github.com/harmony-one/harmony/precompiles

# COPY ./bls $GOPATH/src/github.com/harmony-one/harmony/precompiles

# Build the harmony binary and dependent libs
RUN go mod tidy
RUN make

# Run the install_build_tools.sh script
RUN bash scripts/install_build_tools.sh

# Expose ports for localnet endpoints
# 9599 is shard 0, 9598 is shard 1 9500 is the RPC port
EXPOSE 9500
EXPOSE 9599
EXPOSE 9598

# Command to start the local network
# CMD ["make", "debug"]
